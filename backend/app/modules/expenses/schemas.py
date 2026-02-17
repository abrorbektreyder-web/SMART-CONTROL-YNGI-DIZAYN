from pydantic import BaseModel
from datetime import datetime

class ExpenseCreate(BaseModel):
    amount: float
    reason: str
    shift_id: int

class ExpenseResponse(BaseModel):
    id: int
    amount: float
    reason: str
    created_at: datetime

    class Config:
        from_attributes = True
