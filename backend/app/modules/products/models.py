from sqlalchemy import Column, Integer, String, Numeric, DateTime, Text
from sqlalchemy.sql import func
from app.core.db import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    barcode = Column(String, unique=True, index=True, nullable=False)
    price = Column(Numeric(12, 2), nullable=False)  # Selling Price
    cost_price = Column(Numeric(12, 2), default=0)  # Cost Price (Maya narx)
    stock_quantity = Column(Integer, default=0)
    category = Column(String, nullable=True)
    
    # Status: 'active' or 'deleted' (Soft Delete)
    status = Column(String, default="active")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
