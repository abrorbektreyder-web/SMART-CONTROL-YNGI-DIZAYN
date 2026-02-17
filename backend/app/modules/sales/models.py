from sqlalchemy import Column, Integer, Numeric, DateTime, String, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.db import Base
import enum

class PaymentMethod(str, enum.Enum):
    CASH = "CASH"
    CARD = "CARD"
    DEBT = "DEBT"  # Added DEBT

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    shift_id = Column(Integer, ForeignKey("shifts.id"), nullable=False)
    
    total_amount = Column(Numeric(12, 2), default=0)
    payment_method = Column(Enum(PaymentMethod), default=PaymentMethod.CASH)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    items = relationship("SaleItem", back_populates="sale")
    # No direct relationship to Debt needed here, we link from Debt side
    
class SaleItem(Base):
    __tablename__ = "sale_items"
    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    total_price = Column(Numeric(12, 2), nullable=False)
    sale = relationship("Sale", back_populates="items")
    product = relationship("app.modules.products.models.Product")

class VoidItem(Base):
    __tablename__ = "void_items"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    reason = Column(String, nullable=True)
    status = Column(String, default="YELLOW_BASKET") 
    created_at = Column(DateTime(timezone=True), server_default=func.now())
