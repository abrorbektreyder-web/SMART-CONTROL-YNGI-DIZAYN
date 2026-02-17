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
from sqlalchemy import text

def verify_debts_module():
    print("Verifying Debts Module Setup...")
    
    # Check DB Connection
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        print("✅ Database connection successful!")
    except Exception as e:
        print(f"❌ Database connection failed: {repr(e)}")
        return

    # Create Tables (including Debts)
    try:
        print("Attempting to create tables (including Debts)...")
        Base.metadata.create_all(bind=engine)
        print("✅ Tables created successfully via SQLAlchemy!")
    except Exception as e:
        print(f"❌ Failed to create tables: {repr(e)}")
        return

    print("Debts Module verification complete. Ready for Module 7.")

if __name__ == "__main__":
    verify_debts_module()
