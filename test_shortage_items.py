import requests
import json

# Base URL
BASE_URL = "http://localhost:8000"

def print_response(title, response):
    print(f"\n{'='*70}")
    print(f"📍 {title}")
    print(f"{'='*70}")
    print(f"Status: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    except:
        print(f"Response: {response.text}")

print("🧪 YANGI KAMOMAD TIZIMI TESTI")
print("="*70)
print("Test: Yetmagan mahsulotlar ro'yxati bilan kamomad")
print("="*70)

# Step 1: Login
print("\n1️⃣ Login...")
login_response = requests.post(f"{BASE_URL}/auth/login", data={
    "username": "kassir",
    "password": "kassir123"
})
print_response("Login", login_response)

if login_response.status_code == 200:
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Step 2: Open new shift
    print("\n2️⃣ Yangi smena ochish...")
    open_shift = requests.post(
        f"{BASE_URL}/shifts/open?user_id=1",
        headers=headers,
        json={"start_cash": 100000}
    )
    print_response("Open Shift", open_shift)
    
    if open_shift.status_code == 200:
        shift_id = open_shift.json()["id"]
        print(f"\n✅ Smena ochildi: ID = {shift_id}")
        
        # Step 3: Close shift WITH shortage and shortage items
        print("\n3️⃣ Kamomad bilan smenani yopish...")
        print("   Yetmagan mahsulotlar:")
        print("   - Coca-Cola 1.5L (1111) - 2 dona x 13,000 UZS")
        print("   - Fanta 1.5L (2222) - 1 dona x 12,000 UZS")
        print("   - Pepsi (shtrix-kodsiz) - 1 dona x 11,000 UZS")
        
        close_data = {
            "end_cash": 89000,
            "shortage_amount": 11000,
            "shortage_items": [
                {
                    "product_name": "Coca-Cola 1.5L",
                    "barcode": "1111",
                    "price": 13000,
                    "quantity": 2,
                    "notes": "Mijoz olib ketmadi"
                },
                {
                    "product_name": "Fanta 1.5L",
                    "barcode": "2222",
                    "price": 12000,
                    "quantity": 1
                },
                {
                    "product_name": "Pepsi",
                    "barcode": None,
                    "price": 11000,
                    "quantity": 1,
                    "notes": "Shtrix-kod yo'q"
                }
            ]
        }
        
        close_shift = requests.post(
            f"{BASE_URL}/shifts/close?user_id=1",
            headers=headers,
            json=close_data
        )
        print_response("Close Shift with Shortage Items", close_shift)
        
        if close_shift.status_code == 200:
            print("\n✅ SMENA YOPILDI!")
            print("\n📱 TELEGRAM XABARI (KUTILAYOTGAN):")
            print("-" * 70)
            print("""🚨 KAMOMAD XABARNOMASI

👤 Kassir: [Kassir nomi] (ID: 1)
🆔 Smena: #{shift_id}
💰 Kamomad summasi: 11,000 UZS

📦 Yetmagan mahsulotlar:
  • Coca-Cola 1.5L (1111) - 2 x 13,000 UZS
  • Fanta 1.5L (2222) - 1 x 12,000 UZS
  • Pepsi (N/A) - 1 x 11,000 UZS

⏰ Vaqt: [timestamp]
""")
            print("-" * 70)
        else:
            print("\n❌ Xatolik: Smenani yopib bo'lmadi!")
    else:
        print("\n❌ Smena ochilmadi!")
else:
    print("\n❌ Login failed!")

print("\n" + "="*70)
print("TEST YAKUNLANDI")
print("="*70)
print("\n📊 Database tekshirish uchun quyidagi skriptni ishga tushiring:")
print("   python backend/check_postgres.py")
