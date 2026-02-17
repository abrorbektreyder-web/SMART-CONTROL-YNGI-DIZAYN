import sys
import os

# Add the current directory to sys.path
sys.path.append(os.getcwd())

from app.core.db import SessionLocal
from app.modules.auth.models import User, UserRole
from app.core.security import get_password_hash

def create_superuser():
    print("Superuser yaratish boshlandi...")
    db = SessionLocal()
    try:
        username = "998901234567"
        password = "admin123"
        role = UserRole.OWNER
        full_name = "Super Admin"

        # Check if user exists
        user = db.query(User).filter(User.username == username).first()
        
        if user:
            print(f"⚠️ Foydalanuvchi {username} allaqachon mavjud.")
            print("🔄 Parol va rol yangilanmoqda...")
            user.password_hash = get_password_hash(password)
            user.role = role
            user.is_active = True
            db.commit()
            print(f"✅ Muvaffaqiyatli yangilandi!\nUsername: {username}\nPassword: {password}")
        else:
            print(f"🆕 Yangi foydalanuvchi {username} yaratilmoqda...")
            new_user = User(
                username=username,
                full_name=full_name,
                password_hash=get_password_hash(password),
                role=role,
                is_active=True
            )
            db.add(new_user)
            db.commit()
            print(f"✅ Muvaffaqiyatli yaratildi!\nUsername: {username}\nPassword: {password}")
            
    except Exception as e:
        print(f"❌ Xatolik yuz berdi: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_superuser()
