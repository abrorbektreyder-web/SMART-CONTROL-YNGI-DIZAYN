from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class ShiftBase(BaseModel):
    start_cash: float

class ShiftCreate(ShiftBase):
    pass

class ShortageItemCreate(BaseModel):
    """Yetmagan mahsulot ma'lumotlari (qo'lda kiritish)"""
    product_name: str
    barcode: Optional[str] = None
    price: float
    quantity: int = 1
    notes: Optional[str] = None

class ShiftClose(BaseModel):
    end_cash: float
    confirm_shortage: bool = False  # Kamomad tasdiqlash (MAJBURIY agar noto'g'ri summa)
    shortage_amount: float = 0  # Kamomad summasi (avtomatik hisoblanadi)
    shortage_items: List[ShortageItemCreate] = []  # Yetmagan mahsulotlar ro'yxati

class ShiftResponse(BaseModel):
    id: int
    user_id: int
    start_time: datetime
    end_time: Optional[datetime]
    start_cash: float
    end_cash: Optional[float]
    status: str

    class Config:
        from_attributes = True
