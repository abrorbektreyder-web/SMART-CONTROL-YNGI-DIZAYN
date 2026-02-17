from sqlalchemy import Column, Integer, Numeric, String, ForeignKey, DateTime, Enum
from sqlalchemy.sql import func
from app.core.db import Base
import enum

class DebtStatus(str, enum.Enum):
    OPEN = "OPEN"
    PARTIAL = "PARTIAL"
    PAID = "PAID"

class Debt(Base):
    __tablename__ = "debts"

    id = Column(Integer, primary_key=True, index=True)
    
    # Customer Info (We store directly here for simplicity, or could be a separate Customer table)
    customer_name = Column(String, nullable=False)
    phone_number = Column(String, nullable=True)
    
    # Debt Details
    original_amount = Column(Numeric(12, 2), nullable=False)
    remaining_amount = Column(Numeric(12, 2), nullable=False)
    
    status = Column(Enum(DebtStatus), default=DebtStatus.OPEN)
    
    # Link to Sale (Optional, usually a debt comes from a specific sale)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

class DebtPayment(Base):
    __tablename__ = "debt_payments"
    
    id = Column(Integer, primary_key=True, index=True)
    debt_id = Column(Integer, ForeignKey("debts.id"), nullable=False)
    
    amount = Column(Numeric(12, 2), nullable=False)
    payment_date = Column(DateTime(timezone=True), server_default=func.now())
    
    # Who accepted the payment?
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
