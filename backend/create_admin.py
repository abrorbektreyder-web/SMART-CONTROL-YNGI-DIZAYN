import sys
import os

# Add the current directory to sys.path to ensure imports work
sys.path.append(os.getcwd())

from app.core.db import SessionLocal
from app.modules.auth.models import User, UserRole
from app.core.security import get_password_hash

def create_admin():
    db = SessionLocal()
    try:
        username = "admin"
        password = "admin123"
        full_name = "Admin User"
        role = UserRole.OWNER

        # Check if user exists
        user = db.query(User).filter(User.username == username).first()
        
        if user:
            print(f"⚠️ Foydalanuvchi '{username}' topildi. Paroli yangilanmoqda...")
            user.password_hash = get_password_hash(password)
            user.role = role
            user.is_active = True
        else:
            print(f"🆕 Yangi admin yaratilmoqda: {username}")
            user = User(
                username=username,
                full_name=full_name,
                password_hash=get_password_hash(password),
                role=role,
                is_active=True
            )
            db.add(user)
        
        db.commit()
        print(f"✅ Muvaffaqiyatli! Login: '{username}', Parol: '{password}'")
        
    except Exception as e:
        print(f"❌ Xatolik: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
