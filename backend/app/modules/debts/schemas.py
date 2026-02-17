from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.modules.debts.models import DebtStatus

class DebtCreate(BaseModel):
    customer_name: str
    phone_number: Optional[str] = None
    original_amount: float
    sale_id: Optional[int] = None

class DebtPaymentCreate(BaseModel):
    amount: float

class DebtResponse(BaseModel):
    id: int
    customer_name: str
    phone_number: Optional[str]
    original_amount: float
    remaining_amount: float
    status: DebtStatus
    created_at: datetime

    class Config:
        from_attributes = True
