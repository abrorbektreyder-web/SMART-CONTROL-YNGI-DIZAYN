from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from pydantic import BaseModel

from app.core.db import get_db
from app.modules.products.models import Product, ProductBatch
from app.modules.products.schemas import ProductCreate, ProductUpdate, ProductResponse, ExpiringProductResponse

from app.core.security import get_current_user
from app.modules.auth.models import User, UserRole

router = APIRouter(prefix="/products", tags=["Products"])


class BatchCreate(BaseModel):
    expiry_date: datetime
    quantity: int


# EXPIRING PRODUCTS (Smart Logic) — MUST be before /{barcode} to avoid route conflict
@router.get("/expiring/list", response_model=List[ExpiringProductResponse])
def get_expiring_products(db: Session = Depends(get_db)):
    """
    Returns list of batches that are expiring soon based on product type rules.
    - Dairy: <= 3 days (RED)
    - Long Term: <= 30 days (YELLOW), <= 15 days (RED)
    """
    batches = db.query(ProductBatch).join(Product).filter(Product.status == "active").all()
    today = datetime.now()
    
    expiring_items = []
    
    for batch in batches:
        expiry = batch.expiry_date
        if not expiry:
            continue
        # Logic: remaining_days
        delta = expiry - today
        remaining_days = delta.days + 1 # +1 to include today
        
        status = None
        
        # Rule Check
        if batch.product.product_type == "dairy":
            if remaining_days <= 3:
                status = "RED"
        elif batch.product.product_type == "long_term":
            if remaining_days <= 15:
                status = "RED"
            elif remaining_days <= 30:
                status = "YELLOW"
        
        # If status is set, add to list
        if status:
            expiring_items.append(ExpiringProductResponse(
                id=batch.product.id,
                name=batch.product.name,
                barcode=batch.product.barcode,
                batch_id=batch.id,
                expiry_date=batch.expiry_date,
                remaining_days=remaining_days,
                status=status,
                quantity=batch.quantity
            ))
            
    # Sort: RED first, then by remaining days
    expiring_items.sort(key=lambda x: (0 if x.status == "RED" else 1, x.remaining_days))
    
    return expiring_items


# GET ALL (Only Active)
@router.get("/", response_model=List[ProductResponse])
def get_products(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.status == "active").all()
    
    # Filter for Cashier and Accountant (hide sensitive data)
    if current_user.role in [UserRole.CASHIER, UserRole.ACCOUNTANT]:
        for p in products:
            p.cost_price = None
            p.stock_quantity = None
            
    return products

# GET BY BARCODE
@router.get("/{barcode}", response_model=ProductResponse)
def get_product_by_barcode(barcode: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.barcode == barcode, Product.status == "active").first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Filter for Cashier and Accountant (hide sensitive data)
    if current_user.role in [UserRole.CASHIER, UserRole.ACCOUNTANT]:
        product.cost_price = None
        product.stock_quantity = None
        
    return product

# CREATE
@router.post("/", response_model=ProductResponse)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    # Check if barcode exists (even in deleted items, to avoid conflict or restore logic later)
    existing = db.query(Product).filter(Product.barcode == product.barcode).first()
    if existing:
        raise HTTPException(status_code=400, detail="Barcode already exists")
    
    new_product = Product(**product.dict())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

# UPDATE
@router.put("/{id}", response_model=ProductResponse)
def update_product(id: int, product_update: ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == id, Product.status == "active").first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    for key, value in product_update.dict(exclude_unset=True).items():
        setattr(product, key, value)
    
    db.commit()
    db.refresh(product)
    return product

# ADD BATCH
@router.post("/{product_id}/batches")
def add_product_batch(product_id: int, batch: BatchCreate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    new_batch = ProductBatch(
        product_id=product_id,
        expiry_date=batch.expiry_date,
        quantity=batch.quantity
    )
    db.add(new_batch)
    
    # Update total stock
    product.stock_quantity += batch.quantity
    
    db.commit()
    return {"message": "Batch added successfully", "batch_id": new_batch.id}

# DELETE (Soft Delete)
@router.delete("/{id}")
def delete_product(id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product.status = "deleted"  # SOFT DELETE
    db.commit()
    return {"message": "Product deleted successfully (Soft Delete)"}
