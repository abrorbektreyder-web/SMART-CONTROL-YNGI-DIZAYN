from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.db import get_db
from app.modules.products.models import Product
from app.modules.products.schemas import ProductCreate, ProductUpdate, ProductResponse

router = APIRouter(prefix="/products", tags=["Products"])

from app.core.security import get_current_user
from app.modules.auth.models import User, UserRole

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

# DELETE (Soft Delete)
@router.delete("/{id}")
def delete_product(id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product.status = "deleted"  # SOFT DELETE
    db.commit()
    return {"message": "Product deleted successfully (Soft Delete)"}
