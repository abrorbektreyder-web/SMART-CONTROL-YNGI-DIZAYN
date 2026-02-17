from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProductBase(BaseModel):
    name: str
    barcode: str
    price: float
    cost_price: float = 0
    stock_quantity: int = 0
    category: Optional[str] = None
    product_type: str = "long_term"  # 'dairy' or 'long_term'

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    cost_price: Optional[float] = None
    stock_quantity: Optional[int] = None
    category: Optional[str] = None
    product_type: Optional[str] = None

class ProductResponse(ProductBase):
    id: int
    status: str
    cost_price: Optional[float] = None # Hidden for Cashier
    stock_quantity: Optional[int] = None # Hidden for Cashier
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

# Schema for Expiring Products List
class ExpiringProductResponse(BaseModel):
    id: int
    name: str
    barcode: str
    batch_id: int
    expiry_date: datetime
    remaining_days: int
    status: str  # RED, YELLOW
    quantity: int
