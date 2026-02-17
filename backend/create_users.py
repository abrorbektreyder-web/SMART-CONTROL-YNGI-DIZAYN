import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

from app.core.db import SessionLocal
from app.modules.auth.models import User, UserRole
from app.core.security import get_password_hash

def create_staff_users():
    db = SessionLocal()
    
    users_to_create = [
        {
            "username": "cashier1",
            "password": "cashier123",
            "full_name": "Test Cashier",
            "role": UserRole.CASHIER
        },
        {
            "username": "accountant1",
            "password": "acc123",
            "full_name": "Test Accountant",
            "role": UserRole.ACCOUNTANT
        }
    ]

    print("👥 Foydalanuvchilarni yaratish boshlandi...")

    try:
        for user_data in users_to_create:
            username = user_data["username"]
            existing_user = db.query(User).filter(User.username == username).first()

            if existing_user:
                print(f"⚠️ {username} topildi. Parol yangilanmoqda...")
                existing_user.password_hash = get_password_hash(user_data["password"])
                existing_user.role = user_data["role"]
                existing_user.is_active = True
                existing_user.full_name = user_data["full_name"]
            else:
                print(f"🆕 Yangi {user_data['role'].value} yaratilmoqda: {username}")
                new_user = User(
                    username=username,
                    full_name=user_data["full_name"],
                    password_hash=get_password_hash(user_data["password"]),
                    role=user_data["role"],
                    is_active=True
                )
                db.add(new_user)
            
        db.commit()
        print("\n✅ Barcha foydalanuvchilar muvaffaqiyatli yaratildi:")
        for u in users_to_create:
            print(f" - Role: {u['role'].value.ljust(10)} | Login: {u['username'].ljust(12)} | Parol: {u['password']}")

    except Exception as e:
        print(f"❌ Xatolik: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_staff_users()
