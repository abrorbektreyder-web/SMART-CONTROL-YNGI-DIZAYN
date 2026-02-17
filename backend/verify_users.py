import sys
import os
sys.path.append(os.getcwd())

from app.core.db import SessionLocal
from app.modules.auth.models import User
from app.core.security import verify_password

db = SessionLocal()

print("\n" + "="*60)
print("   FOYDALANUVCHILAR TEKSHIRUVI")
print("="*60)

users_to_check = [
    ("998901234567", "admin123", "owner"),
    ("buhgalter", "buhgalter123", "accountant"),
    ("kassir", "kassir123", "cashier"),
]

for username, password, expected_role in users_to_check:
    user = db.query(User).filter(User.username == username).first()
    if user:
        pwd_ok = verify_password(password, user.password_hash)
        role_match = user.role.value == expected_role
        active = user.is_active
        
        status = "✅" if (pwd_ok and role_match and active) else "❌"
        print(f"\n{status} {username}")
        print(f"   Role: {user.role.value} (kutilgan: {expected_role}) {'✓' if role_match else '✗'}")
        print(f"   Password: {'✓' if pwd_ok else '✗'}")
        print(f"   Active: {'✓' if active else '✗'}")
    else:
        print(f"\n❌ {username} - TOPILMADI!")

db.close()
print("\n" + "="*60)
