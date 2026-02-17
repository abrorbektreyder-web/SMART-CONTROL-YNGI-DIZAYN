import sys
import os

# Add the current directory to sys.path
sys.path.append(os.getcwd())

from app.core.db import engine, Base
from app.modules.auth.models import User
from app.modules.products.models import Product
from sqlalchemy import text

def verify_products_module():
    print("Verifying Products Module Setup...")
    
    # Check DB Connection
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        print("✅ Database connection successful!")
    except Exception as e:
        print(f"❌ Database connection failed: {repr(e)}")
        return

    # Create Tables (including Products)
    try:
        print("Attempting to create tables (including Products)...")
        Base.metadata.create_all(bind=engine)
        print("✅ Tables created successfully via SQLAlchemy!")
    except Exception as e:
        print(f"❌ Failed to create tables: {repr(e)}")
        return

    print("Products Module verification complete. Ready for Module 4.")

if __name__ == "__main__":
    verify_products_module()
