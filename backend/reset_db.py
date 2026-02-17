import sys
import os
from sqlalchemy import create_engine, text

# Add current dir to path
sys.path.append(os.getcwd())

from app.core.config import settings
from app.core.db import Base
# Import all models
from app.modules.auth.models import User
from app.modules.products.models import Product
from app.modules.shifts.models import Shift
from app.modules.sales.models import Sale, SaleItem, VoidItem
from app.modules.debts.models import Debt, DebtPayment
from app.modules.expenses.models import Expense

def reset_database():
    print("🔄 Forcing database reset (DROP SCHEMA public CASCADE)...")
    try:
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as connection:
            connection.execution_options(isolation_level="AUTOCOMMIT")
            # Force drop everything
            connection.execute(text("DROP SCHEMA public CASCADE;"))
            connection.execute(text("CREATE SCHEMA public;"))
            print("💥 User 'public' schema wiped.")
            
        print("✨ Creating all tables...")
        # Re-bind engine after schema recreation
        Base.metadata.create_all(bind=engine)
        print("✅ Tables created successfully.")
    except Exception as e:
        print(f"❌ Error resetting database: {e}")

if __name__ == "__main__":
    reset_database()
