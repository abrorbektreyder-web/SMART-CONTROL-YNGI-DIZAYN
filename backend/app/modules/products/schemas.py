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

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    cost_price: Optional[float] = None
    stock_quantity: Optional[int] = None
    category: Optional[str] = None

class ProductResponse(ProductBase):
    id: int
    status: str
    cost_price: Optional[float] = None # Hidden for Cashier
    stock_quantity: Optional[int] = None # Hidden for Cashier
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
