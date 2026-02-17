from sqlalchemy import Column, Integer, Numeric, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.core.db import Base

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    shift_id = Column(Integer, ForeignKey("shifts.id"), nullable=False) # Linked to active shift
    
    amount = Column(Numeric(12, 2), nullable=False)
    reason = Column(String, nullable=False) # e.g., "Supplier Payment", "Lunch"
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
