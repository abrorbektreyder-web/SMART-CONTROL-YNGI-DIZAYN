from sqlalchemy import Column, Integer, String, Numeric, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
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
    
    # Product Type: 'dairy' or 'long_term'
    product_type = Column(String, default="long_term")
    
    # Status: 'active' or 'deleted' (Soft Delete)
    status = Column(String, default="active")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Relationships
    batches = relationship("ProductBatch", back_populates="product", cascade="all, delete-orphan")

class ProductBatch(Base):
    __tablename__ = "product_batches"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    expiry_date = Column(DateTime, nullable=False)
    quantity = Column(Integer, default=0)
    current_status = Column(String, nullable=True)  # Added to track notification state (RED, YELLOW, None)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    product = relationship("Product", back_populates="batches")
