from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from app.core.db import get_db
from app.core.notifications import send_telegram_alert, get_formatted_time
from app.modules.shifts.models import Shift, ShortageItem
from app.modules.shifts.schemas import ShiftCreate, ShiftClose, ShiftResponse
from app.modules.debts.models import Debt, DebtStatus
from app.modules.sales.models import VoidItem, Sale, PaymentMethod  # Import Sale
from app.modules.products.models import Product
from app.modules.auth.models import User  # Import User for cashier name

router = APIRouter(prefix="/shifts", tags=["Shifts"])

@router.post("/open", response_model=ShiftResponse)
def open_shift(shift_data: ShiftCreate, user_id: int, db: Session = Depends(get_db)):
    active_shift = db.query(Shift).filter(Shift.user_id == user_id, Shift.status == "OPEN").first()
    if active_shift:
        raise HTTPException(status_code=400, detail="You already have an open shift")
    
    new_shift = Shift(user_id=user_id, start_cash=shift_data.start_cash, status="OPEN")
    db.add(new_shift)
    db.commit()
    db.refresh(new_shift)
    
    # 🟢 SMENA OCHILDI — TELEGRAM XABAR
    cashier = db.query(User).filter(User.id == user_id).first()
    cashier_name = cashier.full_name if cashier else f"ID: {user_id}"
    
    open_message = f"""🟢 <b>Smena Ochildi</b>

👤 Kassir: {cashier_name}
🆔 ID: {user_id}
💵 Boshlang'ich kassa: {float(shift_data.start_cash):,.0f} so'm
📅 Vaqt: {get_formatted_time()}"""
    send_telegram_alert(open_message)
    
    return new_shift

# ========================================
# GET PENDING YELLOW BASKET ITEMS
# ========================================
@router.get("/yellow-basket/{user_id}")
def get_pending_void_items(user_id: int, db: Session = Depends(get_db)):
    """Get list of void items that need to be re-scanned before shift close"""
    pending_items = db.query(VoidItem).filter(
        VoidItem.user_id == user_id,
        VoidItem.status == "YELLOW_BASKET"
    ).all()
    
    result = []
    for item in pending_items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        result.append({
            "id": item.id,
            "product_name": product.name if product else "Unknown",
            "barcode": product.barcode if product else "",
            "quantity": item.quantity,
            "reason": item.reason,
            "created_at": item.created_at
        })
    
    return {"pending_count": len(result), "items": result}

# ========================================
# VERIFY/RESCAN VOID ITEM (Qayta skanerlash)
# ========================================
@router.post("/verify-void/{void_id}")
def verify_void_item(void_id: int, user_id: int, db: Session = Depends(get_db)):
    """Mark a void item as verified (re-scanned and returned to stock)"""
    void_item = db.query(VoidItem).filter(
        VoidItem.id == void_id,
        VoidItem.user_id == user_id,
        VoidItem.status == "YELLOW_BASKET"
    ).first()
    
    if not void_item:
        raise HTTPException(status_code=404, detail="Void item not found or already verified")
    
    # Return product to stock
    product = db.query(Product).filter(Product.id == void_item.product_id).first()
    if product:
        product.stock_quantity += void_item.quantity
    
    # Mark as verified
    void_item.status = "VERIFIED"
    db.commit()
    
    return {"message": f"Item verified and returned to stock", "product": product.name if product else "Unknown"}

@router.post("/close", response_model=ShiftResponse)
def close_shift(close_data: ShiftClose, user_id: int, db: Session = Depends(get_db)):
    active_shift = db.query(Shift).filter(Shift.user_id == user_id, Shift.status == "OPEN").first()
    if not active_shift:
        raise HTTPException(status_code=400, detail="No open shift found")
    
    # ========================================
    # CHECK YELLOW BASKET (Sariq Savat)
    # ========================================
    pending_voids = db.query(VoidItem).filter(
        VoidItem.user_id == user_id,
        VoidItem.status == "YELLOW_BASKET"
    ).count()
    
    if pending_voids > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Smenani yopish mumkin emas! {pending_voids} ta mahsulot sariq savatda tekshirilmagan. Avval qayta skanerlang."
        )
    
    # ========================================
    # CALCULATE ALL SALES (Naqd + Karta + Nasiya)
    # ========================================
    total_cash_sales = db.query(func.sum(Sale.total_amount)).filter(
        Sale.shift_id == active_shift.id,
        Sale.payment_method == PaymentMethod.CASH
    ).scalar() or 0
    
    total_card_sales = db.query(func.sum(Sale.total_amount)).filter(
        Sale.shift_id == active_shift.id,
        Sale.payment_method == PaymentMethod.CARD
    ).scalar() or 0
    
    total_debt_sales = db.query(func.sum(Sale.total_amount)).filter(
        Sale.shift_id == active_shift.id,
        Sale.payment_method == PaymentMethod.DEBT
    ).scalar() or 0
    
    total_all_sales = float(total_cash_sales) + float(total_card_sales) + float(total_debt_sales)
    
    # Expected end cash = start cash + CASH ONLY sales (karta va nasiya kassaga kirmaydi)
    expected_end_cash = float(active_shift.start_cash) + float(total_cash_sales)
    actual_end_cash = float(close_data.end_cash)
    
    # ========================================
    # STRICT VALIDATION (Qat'iy tekshiruv)
    # ========================================
    shortage = expected_end_cash - actual_end_cash
    
    # Agar summa mos kelmasa VA kamomad tasdiqlanmagan bo'lsa - XATO
    if abs(shortage) > 1:  # 1 UZS tolerance
        if not close_data.confirm_shortage:
            raise HTTPException(
                status_code=400,
                detail=f"Xato summa! Kutilgan: {expected_end_cash:,.0f} UZS, Kiritilgan: {actual_end_cash:,.0f} UZS. Farq: {shortage:,.0f} UZS. To'g'ri summa kiriting yoki Kamomad tugmasini bosing."
            )
    
    # Get cashier info
    cashier = db.query(User).filter(User.id == user_id).first()
    cashier_name = cashier.full_name if cashier else f"User ID: {user_id}"
    
    # 1. Update Shift
    active_shift.end_cash = close_data.end_cash
    active_shift.end_time = datetime.now()
    active_shift.status = "CLOSED"
    db.flush()
    
    # 2. HANDLE SHORTAGE (Kamomad)
    if shortage > 0 and close_data.confirm_shortage:
        # Save shortage items
        for item in close_data.shortage_items:
            shortage_item = ShortageItem(
                shift_id=active_shift.id,
                product_name=item.product_name,
                barcode=item.barcode,
                price=item.price,
                quantity=item.quantity,
                notes=item.notes
            )
            db.add(shortage_item)
        
        # Create Debt for Cashier
        new_debt = Debt(
            customer_name=f"KASSIR KAMOMADI (Smena #{active_shift.id}) - {cashier_name}",
            original_amount=shortage,
            remaining_amount=shortage,
            status=DebtStatus.OPEN
        )
        db.add(new_debt)
        
        # Prepare shortage items list
        shortage_details = "\n".join([
            f"  • {item.product_name} ({item.barcode or 'N/A'}) - {item.quantity} x {item.price:,.0f} UZS"
            for item in close_data.shortage_items
        ]) or "  (Ro'yxat kiritilmagan)"
        
        # 🚨 Send SHORTAGE Alert to Owner
        message = f"""🏁 <b>Smena Yopildi</b>

👤 Kassir: {cashier_name}
💵 Kassadagi naqd: {actual_end_cash:,.0f} so'm
💳 Terminal: {float(total_card_sales):,.0f} so'm
📊 Savdo jami: {total_all_sales:,.0f} so'm
📅 Vaqt: {get_formatted_time()}

🚨🚨🚨 <b>DIQQAT KAMOMAD!</b> 🚨🚨🚨
Yo'qolgan summa: {shortage:,.0f} so'm

📦 Yetmagan mahsulotlar:
{shortage_details}"""
        send_telegram_alert(message)
    else:
        # ✅ Send SUCCESS Report to Owner
        message = f"""🏁 <b>Smena Yopildi</b>

👤 Kassir: {cashier_name}
💵 Kassadagi naqd: {actual_end_cash:,.0f} so'm
💳 Terminal: {float(total_card_sales):,.0f} so'm
📊 Savdo jami: {total_all_sales:,.0f} so'm
✅ Kamomad: YO'Q
📅 Vaqt: {get_formatted_time()}"""
        send_telegram_alert(message)

    db.commit()
    db.refresh(active_shift)
    return active_shift

@router.get("/status/{user_id}", response_model=ShiftResponse)
def get_shift_status(user_id: int, db: Session = Depends(get_db)):
    active_shift = db.query(Shift).filter(Shift.user_id == user_id, Shift.status == "OPEN").first()
    if not active_shift:
        raise HTTPException(status_code=404, detail="No active shift")
    return active_shift

# ========================================
# SHIFT SUMMARY (Smena Xulosasi - Frontendga)
# ========================================
@router.get("/summary/{user_id}")
def get_shift_summary(user_id: int, db: Session = Depends(get_db)):
    """
    Smena xulosasi - kutilgan kassa va savdo summasi.
    Frontend bu ma'lumotlardan foydalanib avtomatik kamomadni hisoblaydi.
    """
    active_shift = db.query(Shift).filter(Shift.user_id == user_id, Shift.status == "OPEN").first()
    if not active_shift:
        raise HTTPException(status_code=404, detail="No active shift")
    
    # Calculate total cash sales during this shift
    total_cash_sales = db.query(func.sum(Sale.total_amount)).filter(
        Sale.shift_id == active_shift.id,
        Sale.payment_method == PaymentMethod.CASH
    ).scalar() or 0
    
    # Calculate total card sales
    total_card_sales = db.query(func.sum(Sale.total_amount)).filter(
        Sale.shift_id == active_shift.id,
        Sale.payment_method == PaymentMethod.CARD
    ).scalar() or 0
    
    # Calculate total debt sales
    total_debt_sales = db.query(func.sum(Sale.total_amount)).filter(
        Sale.shift_id == active_shift.id,
        Sale.payment_method == PaymentMethod.DEBT
    ).scalar() or 0
    
    # Expected end cash = start cash + cash sales
    expected_end_cash = float(active_shift.start_cash) + float(total_cash_sales)
    
    # Pending Yellow Basket items
    pending_void_count = db.query(VoidItem).filter(
        VoidItem.user_id == user_id,
        VoidItem.status == "YELLOW_BASKET"
    ).count()
    
    # Get cashier name
    cashier = db.query(User).filter(User.id == user_id).first()
    cashier_name = cashier.full_name if cashier else f"User ID: {user_id}"
    
    return {
        "shift_id": active_shift.id,
        "user_id": user_id,
        "cashier_name": cashier_name,
        "start_time": active_shift.start_time,
        "start_cash": float(active_shift.start_cash),
        "total_cash_sales": float(total_cash_sales),
        "total_card_sales": float(total_card_sales),
        "total_debt_sales": float(total_debt_sales),
        "total_sales": float(total_cash_sales) + float(total_card_sales) + float(total_debt_sales),
        "expected_end_cash": expected_end_cash,
        "pending_void_count": pending_void_count
    }

