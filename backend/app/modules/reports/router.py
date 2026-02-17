import csv
import io
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import datetime, timedelta, date
from app.core.db import get_db
from app.modules.sales.models import Sale, SaleItem, PaymentMethod
from app.modules.shifts.models import Shift
from app.modules.debts.models import Debt, DebtStatus
from app.modules.products.models import Product
from app.modules.reports.schemas import (
    DashboardStats, DailySalesReport, SalesByDateItem, SalesPeriodResponse,
    ProductSalesItem
)

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    today = datetime.now().date()
    start_of_today = datetime.combine(today, datetime.min.time())
    
    # Today's sales
    today_sales = db.query(func.sum(Sale.total_amount)).filter(
        Sale.created_at >= start_of_today
    ).scalar() or 0
    
    # Active debts (remaining_amount for OPEN/PARTIAL)
    active_debts = db.query(func.sum(Debt.remaining_amount)).filter(
        Debt.status != DebtStatus.PAID
    ).scalar() or 0
    
    # Weekly sales (last 7 days)
    week_ago = datetime.now() - timedelta(days=7)
    weekly_sales = db.query(func.sum(Sale.total_amount)).filter(
        Sale.created_at >= week_ago
    ).scalar() or 0
    
    # Monthly sales (last 30 days)
    last_30_days = datetime.now() - timedelta(days=30)
    monthly_sales = db.query(func.sum(Sale.total_amount)).filter(
        Sale.created_at >= last_30_days
    ).scalar() or 0
    
    # Low stock products
    low_stock = db.query(Product).filter(
        Product.stock_quantity < 5, Product.status == "active"
    ).count()
    
    # Total products
    total_products = db.query(Product).filter(
        Product.status == "active"
    ).count()
    
    # Cash in register - from active (OPEN) shift
    active_shift = db.query(Shift).filter(
        Shift.status == "OPEN"
    ).first()
    
    cash_in_register = 0
    if active_shift:
        # Start cash + all CASH sales during this shift
        shift_cash_sales = db.query(func.sum(Sale.total_amount)).filter(
            Sale.shift_id == active_shift.id,
            Sale.payment_method == PaymentMethod.CASH
        ).scalar() or 0
        cash_in_register = float(active_shift.start_cash) + float(shift_cash_sales)
    
    return DashboardStats(
        today_sales=today_sales,
        active_debts=active_debts,
        weekly_sales=weekly_sales,
        monthly_sales=monthly_sales,
        low_stock_items=low_stock,
        total_products=total_products,
        cash_in_register=cash_in_register
    )

@router.get("/daily-sales", response_model=DailySalesReport)
def get_daily_sales(target_date: date = datetime.now().date(), db: Session = Depends(get_db)):
    start_of_day = datetime.combine(target_date, datetime.min.time())
    end_of_day = datetime.combine(target_date, datetime.max.time())
    
    sales_query = db.query(Sale).filter(Sale.created_at >= start_of_day, Sale.created_at <= end_of_day)
    
    total_sales = sales_query.with_entities(func.sum(Sale.total_amount)).scalar() or 0
    total_cash = sales_query.filter(Sale.payment_method == PaymentMethod.CASH).with_entities(func.sum(Sale.total_amount)).scalar() or 0
    total_card = sales_query.filter(Sale.payment_method == PaymentMethod.CARD).with_entities(func.sum(Sale.total_amount)).scalar() or 0
    count = sales_query.count()
    
    return DailySalesReport(
        date=start_of_day,
        total_sales=total_sales,
        total_cash=total_cash,
        total_card=total_card,
        transaction_count=count
    )

# ========================================
# SALES BY PERIOD (Owner Analytics)
# ========================================
@router.get("/sales-by-period", response_model=SalesPeriodResponse)
def get_sales_by_period(
    period: str = Query("daily", description="daily, weekly, or monthly"),
    start_date: date = None,
    end_date: date = None,
    db: Session = Depends(get_db)
):
    """
    Returns sales grouped by date for the given period.
    - daily: today only
    - weekly: last 7 days
    - monthly: last 30 days
    - custom: use start_date and end_date params
    """
    today = datetime.now().date()
    
    if start_date and end_date:
        # Custom date range provided
        calc_start = start_date
        calc_end = end_date
    elif period == "daily":
        if datetime.now().hour < 5:
            calc_start = today - timedelta(days=1)
        else:
            calc_start = today
        calc_end = today
    elif period == "weekly":
        calc_start = today - timedelta(days=6)
        calc_end = today
    elif period == "monthly":
        calc_start = today - timedelta(days=29)
        calc_end = today
    else:
        calc_start = today
        calc_end = today
    
    start_dt = datetime.combine(calc_start, datetime.min.time())
    end_dt = datetime.combine(calc_end, datetime.max.time())
    
    # Query sales grouped by date with DEBT included
    results = db.query(
        func.date(Sale.created_at).label("sale_date"),
        func.sum(Sale.total_amount).label("total"),
        func.sum(
            case(
                (Sale.payment_method == PaymentMethod.CASH, Sale.total_amount),
                else_=0
            )
        ).label("cash"),
        func.sum(
            case(
                (Sale.payment_method == PaymentMethod.CARD, Sale.total_amount),
                else_=0
            )
        ).label("card"),
        func.sum(
            case(
                (Sale.payment_method == PaymentMethod.DEBT, Sale.total_amount),
                else_=0
            )
        ).label("debt"),
        func.count(Sale.id).label("count")
    ).filter(
        Sale.created_at >= start_dt,
        Sale.created_at <= end_dt
    ).group_by(
        func.date(Sale.created_at)
    ).order_by(
        func.date(Sale.created_at).desc()
    ).all()
    
    items = []
    grand_total = 0
    grand_cash = 0
    grand_card = 0
    grand_debt = 0
    total_transactions = 0
    
    for row in results:
        total = float(row.total or 0)
        cash = float(row.cash or 0)
        card = float(row.card or 0)
        debt = float(row.debt or 0)
        count = int(row.count or 0)
        
        items.append(SalesByDateItem(
            date=row.sale_date,
            total_sales=total,
            total_cash=cash,
            total_card=card,
            total_debt=debt,
            transaction_count=count
        ))
        
        grand_total += total
        grand_cash += cash
        grand_card += card
        grand_debt += debt
        total_transactions += count
    
    return SalesPeriodResponse(
        period=period,
        start_date=calc_start,
        end_date=calc_end,
        items=items,
        grand_total=grand_total,
        grand_cash=grand_cash,
        grand_card=grand_card,
        grand_debt=grand_debt,
        total_transactions=total_transactions
    )

# ========================================
# PRODUCT RANKING (Analytics)
# ========================================
@router.get("/product-ranking", response_model=list[ProductSalesItem])
def get_product_ranking(
    days: int = Query(30, description="Number of days to analyze"),
    db: Session = Depends(get_db)
):
    """
    Returns all active products ranked by sales quantity.
    Each product gets a rank: top, average, low, none.
    """
    since = datetime.now() - timedelta(days=days)
    
    # Get sales data per product
    product_sales = db.query(
        SaleItem.product_id,
        func.sum(SaleItem.quantity).label("total_qty"),
        func.sum(SaleItem.total_price).label("total_revenue")
    ).join(Sale, Sale.id == SaleItem.sale_id).filter(
        Sale.created_at >= since
    ).group_by(
        SaleItem.product_id
    ).all()
    
    # Build a dict of product_id -> (qty, revenue)
    sales_map = {}
    for row in product_sales:
        sales_map[row.product_id] = {
            "qty": int(row.total_qty or 0),
            "revenue": float(row.total_revenue or 0)
        }
    
    # Get all active products
    products = db.query(Product).filter(Product.status == "active").all()
    
    # Calculate percentiles for ranking
    all_qtys = [sales_map.get(p.id, {}).get("qty", 0) for p in products]
    non_zero_qtys = sorted([q for q in all_qtys if q > 0])
    
    if len(non_zero_qtys) > 0:
        p75 = non_zero_qtys[int(len(non_zero_qtys) * 0.75)] if len(non_zero_qtys) > 1 else non_zero_qtys[0]
        p25 = non_zero_qtys[int(len(non_zero_qtys) * 0.25)] if len(non_zero_qtys) > 1 else 0
    else:
        p75 = 0
        p25 = 0
    
    items = []
    for p in products:
        data = sales_map.get(p.id, {"qty": 0, "revenue": 0})
        qty = data["qty"]
        
        if qty == 0:
            rank = "none"
        elif qty >= p75 and p75 > 0:
            rank = "top"
        elif qty >= p25 and p25 > 0:
            rank = "average"
        else:
            rank = "low"
        
        items.append(ProductSalesItem(
            product_id=p.id,
            product_name=p.name,
            total_qty=qty,
            total_revenue=data["revenue"],
            rank=rank
        ))
    
    # Sort by qty descending
    items.sort(key=lambda x: x.total_qty, reverse=True)
    
    return items

# ========================================
# EXPORT (Tax Report CSV)
# ========================================
@router.get("/export/tax")
def export_tax_report(
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db)
):
    # 1. Fetch Sales Data grouped by Date
    results = db.query(
        func.date(Sale.created_at).label("sale_date"),
        func.sum(Sale.total_amount).label("total"),
        func.sum(
            case(
                (Sale.payment_method == PaymentMethod.CASH, Sale.total_amount),
                else_=0
            )
        ).label("cash"),
        func.sum(
            case(
                (Sale.payment_method == PaymentMethod.CARD, Sale.total_amount),
                else_=0
            )
        ).label("card")
    ).filter(
        func.date(Sale.created_at) >= start_date,
        func.date(Sale.created_at) <= end_date
    ).group_by(func.date(Sale.created_at)).order_by(func.date(Sale.created_at)).all()

    # 2. Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header specifically for Tax Reports
    writer.writerow(["SANAY (Date)", "JAMI SAVDO (Total)", "NAQD (Cash)", "PLASTIK (Card)"])
    
    # Track totals
    grand_total = 0
    total_cash = 0
    total_card = 0
    
    for row in results:
        writer.writerow([row.sale_date, row.total, row.cash, row.card])
        grand_total += float(row.total or 0)
        total_cash += float(row.cash or 0)
        total_card += float(row.card or 0)
    
    # Add empty row and TOTAL row
    writer.writerow([])
    writer.writerow(["JAMI (TOTAL)", grand_total, total_cash, total_card])
        
    output.seek(0)
    
    # 3. Return as a file download
    filename = f"tax_report_{start_date}_{end_date}.csv"
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
