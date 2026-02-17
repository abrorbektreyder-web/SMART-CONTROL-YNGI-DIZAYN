from pydantic import BaseModel
from datetime import datetime, date
from typing import List

class DashboardStats(BaseModel):
    today_sales: float
    active_debts: float
    monthly_sales: float
    weekly_sales: float
    low_stock_items: int
    total_products: int
    cash_in_register: float

class DailySalesReport(BaseModel):
    date: datetime
    total_sales: float
    total_cash: float
    total_card: float
    transaction_count: int

class SalesByDateItem(BaseModel):
    date: date
    total_sales: float
    total_cash: float
    total_card: float
    total_debt: float = 0
    transaction_count: int

class SalesPeriodResponse(BaseModel):
    period: str
    start_date: date
    end_date: date
    items: List[SalesByDateItem]
    grand_total: float
    grand_cash: float
    grand_card: float
    grand_debt: float = 0
    total_transactions: int

class ProductSalesItem(BaseModel):
    product_id: int
    product_name: str
    total_qty: int
    total_revenue: float
    rank: str  # "top", "average", "low", "none"
