import sys
import os

# Add the current directory to sys.path
sys.path.append(os.getcwd())

from app.core.db import engine, Base
from app.modules.auth.models import User
from app.modules.products.models import Product
from app.modules.shifts.models import Shift
from app.modules.sales.models import Sale, SaleItem, VoidItem
from app.modules.debts.models import Debt, DebtPayment
from app.modules.expenses.models import Expense
from sqlalchemy import text

def verify_expenses_module():
    print("Verifying Expenses Module Setup...")
    
    # Check DB Connection
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        print("✅ Database connection successful!")
    except Exception as e:
        print(f"❌ Database connection failed: {repr(e)}")
        return

    # Create Tables (including Expenses)
    try:
        print("Attempting to create tables (including Expenses)...")
        Base.metadata.create_all(bind=engine)
        print("✅ Tables created successfully via SQLAlchemy!")
    except Exception as e:
        print(f"❌ Failed to create tables: {repr(e)}")
        return

    print("Expenses Module verification complete. Ready for Module 8.")

if __name__ == "__main__":
    verify_expenses_module()
