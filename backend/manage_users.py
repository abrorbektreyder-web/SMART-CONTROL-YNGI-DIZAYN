
import sys
import os

# Add current dir to path
sys.path.append(os.getcwd())

from app.core.db import SessionLocal
from app.modules.auth.models import User, UserRole
from app.core.security import get_password_hash

def manage_users():
    db = SessionLocal()
    try:
        # Note: Owner is managed by create_superuser.py

        # 2. Create/Update Accountant
        username = "buhgalter"
        password = "buhgalter123"
        role = UserRole.ACCOUNTANT
        full_name = "Buhgalter User"

        accountant = db.query(User).filter(User.username == username).first()
        if accountant:
            print(f"🔄 Updating existing accountant: {username}")
            accountant.password_hash = get_password_hash(password)
            accountant.role = role
            accountant.is_active = True
            accountant.full_name = full_name
            db.commit()
            print("✅ Accountant updated.")
        else:
            print(f"🆕 Creating new accountant: {username}")
            new_acc = User(
                username=username,
                full_name=full_name,
                password_hash=get_password_hash(password),
                role=role,
                is_active=True
            )
            db.add(new_acc)
            db.commit()
            print("✅ Accountant created.")

        # 3. Create/Update Cashier
        cashier_username = "kassir"
        cashier_password = "kassir123"
        cashier_role = UserRole.CASHIER
        cashier_full_name = "Kassir User"

        cashier = db.query(User).filter(User.username == cashier_username).first()
        if cashier:
            print(f"🔄 Updating existing cashier: {cashier_username}")
            cashier.password_hash = get_password_hash(cashier_password)
            cashier.role = cashier_role
            cashier.is_active = True
            cashier.full_name = cashier_full_name
            db.commit()
            print("✅ Cashier updated.")
        else:
            print(f"🆕 Creating new cashier: {cashier_username}")
            new_cashier = User(
                username=cashier_username,
                full_name=cashier_full_name,
                password_hash=get_password_hash(cashier_password),
                role=cashier_role,
                is_active=True
            )
            db.add(new_cashier)
            db.commit()
            print("✅ Cashier created.")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    manage_users()
