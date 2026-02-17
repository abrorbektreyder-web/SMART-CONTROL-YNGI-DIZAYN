"""
Access Control Test Suite
==========================
Bloklash va rol tekshiruvi testlari.

Ishga tushirish: python verify_auth.py
"""

import sys
import os
import requests

# Add the current directory to sys.path
sys.path.append(os.getcwd())

BASE_URL = "http://localhost:8000"


def test_blocked_user_cannot_login():
    """Test: Bloklangan foydalanuvchi login qila olmaydi"""
    print("\n" + "="*50)
    print("TEST 1: Bloklangan foydalanuvchi login qila olmaydi")
    print("="*50)
    
    # Try to login as a blocked user (is_active=False)
    response = requests.post(
        f"{BASE_URL}/auth/login",
        data={"username": "blocked_user", "password": "test123"}
    )
    
    if response.status_code == 403:
        print("✅ PASS: Bloklangan foydalanuvchi login qila olmadi (403)")
        return True
    elif response.status_code == 401:
        print("⚠️  SKIP: Foydalanuvchi topilmadi (avval blocked_user yarating)")
        return None
    else:
        print(f"❌ FAIL: Kutilgan 403, lekin {response.status_code} qaytdi")
        return False


def test_owner_can_block_user():
    """Test: Owner boshqa foydalanuvchini bloklashi mumkin"""
    print("\n" + "="*50)
    print("TEST 2: Owner foydalanuvchini bloklashi mumkin")
    print("="*50)
    
    # First login as owner
    login_response = requests.post(
        f"{BASE_URL}/auth/login",
        data={"username": "admin", "password": "admin123"}
    )
    
    if login_response.status_code != 200:
        print(f"⚠️  SKIP: Owner (admin) topilmadi yoki login xato: {login_response.status_code}")
        return None
    
    token = login_response.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get all users
    users_response = requests.get(f"{BASE_URL}/auth/users", headers=headers)
    if users_response.status_code != 200:
        print(f"❌ FAIL: Users ro'yxatini olishda xato: {users_response.status_code}")
        return False
    
    users = users_response.json()
    
    # Find a non-owner user to block
    target_user = None
    for user in users:
        if user["role"] != "owner" and user["is_active"]:
            target_user = user
            break
    
    if not target_user:
        print("⚠️  SKIP: Bloklash uchun aktiv non-owner foydalanuvchi yo'q")
        return None
    
    # Block the user
    block_response = requests.patch(
        f"{BASE_URL}/auth/users/{target_user['id']}/block",
        headers=headers
    )
    
    if block_response.status_code == 200:
        print(f"✅ PASS: {target_user['username']} muvaffaqiyatli bloklandi")
        
        # Unblock back
        requests.patch(f"{BASE_URL}/auth/users/{target_user['id']}/unblock", headers=headers)
        print(f"   [Cleanup] {target_user['username']} blokdan chiqarildi")
        return True
    else:
        print(f"❌ FAIL: Bloklashda xato: {block_response.status_code} - {block_response.text}")
        return False


def test_non_owner_cannot_block():
    """Test: Non-owner foydalanuvchi bloklashi mumkin emas"""
    print("\n" + "="*50)
    print("TEST 3: Non-owner (Cashier) bloklashga urinadi")
    print("="*50)
    
    # Login as cashier
    login_response = requests.post(
        f"{BASE_URL}/auth/login",
        data={"username": "kassir", "password": "kassir123"}
    )
    
    if login_response.status_code != 200:
        print(f"⚠️  SKIP: Cashier (kassir) topilmadi: {login_response.status_code}")
        return None
    
    token = login_response.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Try to block user ID 1
    block_response = requests.patch(
        f"{BASE_URL}/auth/users/1/block",
        headers=headers
    )
    
    if block_response.status_code == 403:
        print("✅ PASS: Cashier bloklashga ruxsat olmadi (403)")
        return True
    else:
        print(f"❌ FAIL: Kutilgan 403, lekin {block_response.status_code} qaytdi")
        return False


def test_db_connection():
    """Test: Database connection"""
    print("\n" + "="*50)
    print("TEST 0: Database Connection")
    print("="*50)
    
    from app.core.db import engine
    from app.modules.auth.models import User, Base
    from sqlalchemy import text
    
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        print("✅ Database connection successful!")
        
        # Ensure tables exist
        Base.metadata.create_all(bind=engine)
        print("✅ Tables created/verified!")
        return True
    except Exception as e:
        print(f"❌ Database error: {repr(e)}")
        return False


def run_all_tests():
    """Barcha testlarni ishga tushirish"""
    print("\n" + "="*60)
    print("   ACCESS CONTROL TEST SUITE")
    print("   Backend: http://localhost:8000")
    print("="*60)
    
    results = {
        "passed": 0,
        "failed": 0,
        "skipped": 0
    }
    
    # Run tests
    tests = [
        test_db_connection,
        test_owner_can_block_user,
        test_non_owner_cannot_block,
        test_blocked_user_cannot_login,
    ]
    
    for test_func in tests:
        try:
            result = test_func()
            if result is True:
                results["passed"] += 1
            elif result is False:
                results["failed"] += 1
            else:
                results["skipped"] += 1
        except requests.exceptions.ConnectionError:
            print(f"❌ CONNECTION ERROR: Backend ishlamayapti!")
            print("   Avval backend ni ishga tushiring:")
            print("   cd backend && uvicorn app.main:app --reload")
            return
        except Exception as e:
            print(f"❌ ERROR: {repr(e)}")
            results["failed"] += 1
    
    # Summary
    print("\n" + "="*60)
    print("   NATIJA")
    print("="*60)
    print(f"   ✅ Passed:  {results['passed']}")
    print(f"   ❌ Failed:  {results['failed']}")
    print(f"   ⚠️  Skipped: {results['skipped']}")
    print("="*60)


if __name__ == "__main__":
    run_all_tests()
