from sqlalchemy import text
from app.core.db import SessionLocal

db = SessionLocal()

try:
    # Delete ALL related records in correct order
    print("1. Deleting debt_payments...")
    db.execute(text("DELETE FROM debt_payments WHERE user_id = 1"))
    
    print("2. Deleting debts...")
    db.execute(text("DELETE FROM debts WHERE created_by_id = 1"))
    
    print("3. Deleting sale_items...")
    db.execute(text("DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM sales WHERE user_id = 1)"))
    
    print("4. Deleting sales...")
    db.execute(text("DELETE FROM sales WHERE user_id = 1"))
    
    print("5. Deleting void_items...")
    db.execute(text("DELETE FROM void_items WHERE user_id = 1"))
    
    print("6. Deleting shifts...")
    db.execute(text("DELETE FROM shifts WHERE user_id = 1"))
    
    # Skip expenses if no user_id column
    # print("7. Deleting expenses...")
    # db.execute(text("DELETE FROM expenses WHERE user_id = 1"))
    
    print("7. Deleting admin user...")
    db.execute(text("DELETE FROM users WHERE id = 1"))
    
    db.commit()
    print("\n=== Admin (ID 1) o'chirildi! ===")
except Exception as e:
    print(f"\nXatolik: {e}")
    db.rollback()
finally:
    db.close()
