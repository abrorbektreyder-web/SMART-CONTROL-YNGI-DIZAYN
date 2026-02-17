import sys
import os

# Add the current directory to sys.path
sys.path.append(os.getcwd())

from app.core.db import engine, Base
from app.modules.auth.models import User
from app.modules.products.models import Product
from app.modules.shifts.models import Shift
from app.modules.sales.models import Sale, SaleItem, VoidItem
from sqlalchemy import text

def verify_sales_module():
    print("Verifying Sales Module Setup...")
    
    # Check DB Connection
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        print("✅ Database connection successful!")
    except Exception as e:
        print(f"❌ Database connection failed: {repr(e)}")
        return

    # Create Tables (including Sales & Voids)
    try:
        print("Attempting to create tables (including Sales & Voids)...")
        Base.metadata.create_all(bind=engine)
        print("✅ Tables created successfully via SQLAlchemy!")
    except Exception as e:
        print(f"❌ Failed to create tables: {repr(e)}")
        return

    print("Sales Module verification complete. Ready for Module 6.")

if __name__ == "__main__":
    verify_sales_module()
