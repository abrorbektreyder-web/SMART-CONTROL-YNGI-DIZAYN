from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.modules.sales.models import PaymentMethod

class SaleItemCreate(BaseModel):
    barcode: str
    quantity: int

class SaleCreate(BaseModel):
    items: List[SaleItemCreate]
    payment_method: PaymentMethod
    shift_id: int
    
    # Optional fields, required ONLY if payment_method is DEBT
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None

class SaleResponse(BaseModel):
    id: int
    total_amount: float
    created_at: datetime
    status: str = "COMPLETED"

    class Config:
        from_attributes = True

# Void Schemas
class VoidCreate(BaseModel):
    barcode: str
    quantity: int
    reason: str = "Mistake"

class VoidResponse(BaseModel):
    id: int
    status: str
    created_at: datetime
    class Config:
        from_attributes = True
