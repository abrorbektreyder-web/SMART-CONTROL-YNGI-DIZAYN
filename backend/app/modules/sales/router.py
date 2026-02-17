from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.core.notifications import send_telegram_alert, get_formatted_time
from app.modules.sales.models import Sale, SaleItem, VoidItem, PaymentMethod
from app.modules.sales.schemas import SaleCreate, SaleResponse, VoidCreate, VoidResponse
from app.modules.products.models import Product
from app.modules.debts.models import Debt, DebtStatus # Import Debt models

router = APIRouter(prefix="/sales", tags=["Sales"])

@router.post("/checkout", response_model=SaleResponse)
def create_sale(sale_data: SaleCreate, user_id: int, db: Session = Depends(get_db)):
    # 1. Validation for Debt
    if sale_data.payment_method == PaymentMethod.DEBT:
        if not sale_data.customer_name or not sale_data.customer_phone:
            raise HTTPException(status_code=400, detail="Customer Name and Phone are required for Debt sales")

    # 2. Calculate Total & Create Sale
    total_amount = 0
    new_sale = Sale(
        user_id=user_id,
        shift_id=sale_data.shift_id,
        payment_method=sale_data.payment_method,
        total_amount=0
    )
    db.add(new_sale)
    db.flush()

    for item in sale_data.items:
        product = db.query(Product).filter(Product.barcode == item.barcode, Product.status == "active").first()
        if not product: raise HTTPException(status_code=404, detail=f"Product {item.barcode} not found")
        if product.stock_quantity < item.quantity: raise HTTPException(status_code=400, detail=f"Not enough stock: {product.name}")

        item_total = product.price * item.quantity
        total_amount += float(item_total)
        product.stock_quantity -= item.quantity
        
        db_item = SaleItem(sale_id=new_sale.id, product_id=product.id, quantity=item.quantity, unit_price=product.price, total_price=item_total)
        db.add(db_item)

    new_sale.total_amount = total_amount
    
    # 3. AUTOMATIC DEBT CREATION
    if sale_data.payment_method == PaymentMethod.DEBT:
        # Check if customer already has a debt record (Optional: merge debts? For now, create new record linked to sale)
        new_debt = Debt(
            customer_name=sale_data.customer_name,
            phone_number=sale_data.customer_phone,
            original_amount=total_amount,
            remaining_amount=total_amount,
            sale_id=new_sale.id,
            status=DebtStatus.OPEN
        )
        db.add(new_debt)
        
        # 🔴 NASIYA SAVDO — TELEGRAM XABAR (faqat nasiya uchun!)
        # Kassir ismini olish
        from app.modules.auth.models import User
        cashier = db.query(User).filter(User.id == user_id).first()
        cashier_name = cashier.full_name if cashier else f"ID: {user_id}"
        
        nasiya_message = f"""🔴 <b>DIQQAT: NASIYA SAVDO!</b>

👤 Kassir: {cashier_name}
💰 Summa: {total_amount:,.0f} so'm
📝 Mijoz: {sale_data.customer_name} ({sale_data.customer_phone})
📅 Vaqt: {get_formatted_time()}"""
        send_telegram_alert(nasiya_message)

    # ✅ Cash va Card savdolarda xabar YUBORILMAYDI (jim turadi)
    db.commit()
    db.refresh(new_sale)
    return new_sale

@router.post("/void", response_model=VoidResponse)
def void_item(void_data: VoidCreate, user_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.barcode == void_data.barcode).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    new_void = VoidItem(
        user_id=user_id,
        product_id=product.id,
        quantity=void_data.quantity,
        reason=void_data.reason,
        status="YELLOW_BASKET"
    )
    db.add(new_void)
    db.commit()
    db.refresh(new_void)
    
    send_telegram_alert(f"⚠️ SARIQ SAVAT! Kassir ID:{user_id} — {product.name} (x{void_data.quantity}) bekor qildi.\nSabab: {void_data.reason}\n📅 Vaqt: {get_formatted_time()}")
    return new_void

# ========================================
# SARIQ SAVAT (Voided Items) Statistics
# ========================================
@router.get("/voids/stats")
def get_void_stats(db: Session = Depends(get_db)):
    """Get statistics for voided items (Sariq Savat)"""
    from sqlalchemy import func
    
    # Count total voided items
    total_count = db.query(func.count(VoidItem.id)).filter(
        VoidItem.status == "YELLOW_BASKET"
    ).scalar() or 0
    
    # Sum of voided quantities
    total_quantity = db.query(func.sum(VoidItem.quantity)).filter(
        VoidItem.status == "YELLOW_BASKET"
    ).scalar() or 0
    
    return {
        "count": total_count,
        "total_quantity": total_quantity
    }

