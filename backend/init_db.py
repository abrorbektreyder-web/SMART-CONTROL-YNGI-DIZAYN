"""
Database Initialization Script for Render Deployment
=====================================================
This script performs a complete database reset and initialization:
1. Drops all existing tables (DROP SCHEMA public CASCADE)
2. Recreates empty schema
3. Creates all tables from ORM models
4. Creates default admin user

Usage:
    python init_db.py              # Full reset + create admin
    python init_db.py --no-reset   # Only create tables and admin (no drop)
"""

import sys
import os

# Ensure correct path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.config import settings
from app.core.db import Base
from app.core.security import get_password_hash

# Import all models to register with Base.metadata
from app.modules.auth.models import User, UserRole
from app.modules.products.models import Product
from app.modules.shifts.models import Shift
from app.modules.sales.models import Sale, SaleItem, VoidItem
from app.modules.debts.models import Debt, DebtPayment
from app.modules.expenses.models import Expense


def reset_schema(engine):
    """Drop and recreate public schema."""
    print("💥 Dropping public schema...")
    with engine.connect() as conn:
        conn.execute(text("DROP SCHEMA IF EXISTS public CASCADE;"))
        conn.execute(text("CREATE SCHEMA public;"))
        conn.execute(text("GRANT ALL ON SCHEMA public TO public;"))
        conn.commit()
    print("✅ Schema recreated successfully!")


def create_tables(engine):
    """Create all tables from ORM models."""
    print("📦 Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ All tables created successfully!")
    
    # Print created tables
    print("\n📋 Created tables:")
    for table in Base.metadata.sorted_tables:
        print(f"   - {table.name}")


def create_admin_user(engine):
    """Create default admin user."""
    from sqlalchemy.orm import sessionmaker
    
    Session = sessionmaker(bind=engine)
    db = Session()
    
    try:
        # Check if admin exists
        existing = db.query(User).filter(User.username == "admin").first()
        
        if existing:
            print(f"⚠️  Admin user already exists (ID: {existing.id})")
            return
        
        admin = User(
            username="admin",
            full_name="System Administrator",
            password_hash=get_password_hash("admin123"),
            role=UserRole.OWNER,
            is_active=True
        )
        db.add(admin)
        db.commit()
        
        print("✅ Admin user created successfully!")
        print("=" * 50)
        print("🔐 LOGIN CREDENTIALS:")
        print(f"   Username: admin")
        print(f"   Password: admin123")
        print(f"   Role: OWNER")
        print("=" * 50)
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating admin: {e}")
    finally:
        db.close()


def main():
    """Main initialization function."""
    print("\n" + "=" * 60)
    print("🚀 SMART CONTROL POS - DATABASE INITIALIZATION")
    print("=" * 60)
    print(f"📍 Database: {settings.DATABASE_URL[:50]}...")
    print()
    
    # Check for --no-reset flag
    no_reset = "--no-reset" in sys.argv
    
    try:
        engine = create_engine(settings.DATABASE_URL)
        
        # Test connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✅ Database connection successful!\n")
        
        if not no_reset:
            reset_schema(engine)
        else:
            print("⏭️  Skipping schema reset (--no-reset flag)")
        
        create_tables(engine)
        print()
        create_admin_user(engine)
        
        print("\n" + "=" * 60)
        print("🎉 DATABASE INITIALIZATION COMPLETE!")
        print("=" * 60 + "\n")
        
    except Exception as e:
        print(f"\n❌ FATAL ERROR: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
