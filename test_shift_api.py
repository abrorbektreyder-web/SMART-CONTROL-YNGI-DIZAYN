import requests
import json

# Base URL
BASE_URL = "http://localhost:8000"

def print_response(title, response):
    print(f"\n{'='*60}")
    print(f"📍 {title}")
    print(f"{'='*60}")
    print(f"Status: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    except:
        print(f"Response: {response.text}")

# TEST SCENARIO 1: Successful Shift with Verified Void Items
print("🧪 TEST SCENARIO 1: Successful Shift Closure")
print("="*60)

# Step 1: Login as Kassir
print("\n1️⃣ Login as Kassir...")
login_response = requests.post(f"{BASE_URL}/auth/login", data={
    "username": "kassir",
    "password": "kassir123"
})
print_response("Login Response", login_response)

if login_response.status_code == 200:
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Step 2: Check current shift status
    print("\n2️⃣ Checking current shift status...")
    shift_status = requests.get(f"{BASE_URL}/shifts/status/1", headers=headers)
    
    if shift_status.status_code == 404:
        print("   ✅ No active shift - will create a new one")
        
        # Step 3: Open Shift
        print("\n3️⃣ Opening new shift with 100,000 UZS...")
        open_shift = requests.post(
            f"{BASE_URL}/shifts/open?user_id=1",
            headers=headers,
            json={"start_cash": 100000}
        )
        print_response("Open Shift", open_shift)
    else:
        print_response("Current Shift Status", shift_status)
        print("   ⚠️ Active shift already exists!")
    
    # Step 4: Get products list
    print("\n4️⃣ Getting products list...")
    products = requests.get(f"{BASE_URL}/products/", headers=headers)
    print_response("Products", products)
    
    # Step 5: Create a void item (simulate cancellation)
    print("\n5️⃣ Creating void item (simulating cancelled sale)...")
    # Note: This endpoint might not exist yet, but showing the API call
    void_item_data = {
        "product_id": 1,
        "quantity": 2,
        "reason": "Mijoz olmadi - TEST",
        "user_id": 1
    }
    print(f"   Would create void item: {json.dumps(void_item_data, indent=2)}")
    
    # Step 6: Check Yellow Basket
    print("\n6️⃣ Checking Yellow Basket...")
    yellow_basket = requests.get(f"{BASE_URL}/shifts/yellow-basket/1", headers=headers)
    print_response("Yellow Basket", yellow_basket)
    
    if yellow_basket.status_code == 200:
        basket_data = yellow_basket.json()
        pending_count = basket_data.get("pending_count", 0)
        
        if pending_count > 0:
            print(f"\n   ⚠️ Found {pending_count} unverified items in Yellow Basket")
            
            # Step 7: Verify first void item
            first_item_id = basket_data["items"][0]["id"]
            print(f"\n7️⃣ Verifying void item ID: {first_item_id}...")
            verify = requests.post(
                f"{BASE_URL}/shifts/verify-void/{first_item_id}?user_id=1",
                headers=headers
            )
            print_response("Verify Void Item", verify)
        else:
            print("   ✅ Yellow Basket is empty - ready to close shift")
    
    # Step 8: Try to close shift
    print("\n8️⃣ Attempting to close shift...")
    print("   Scenario 1: No shortage (end_cash = 100000, shortage = 0)")
    
    close_shift = requests.post(
        f"{BASE_URL}/shifts/close?user_id=1",
        headers=headers,
        json={
            "end_cash": 100000,
            "shortage_amount": 0
        }
    )
    print_response("Close Shift (No Shortage)", close_shift)

print("\n" + "="*60)
print("🎉 SCENARIO 1 TEST COMPLETED")
print("="*60)

# TEST SCENARIO 2: Shift with Shortage
print("\n\n🧪 TEST SCENARIO 2: Shift Closure with Shortage")
print("="*60)

print("\n1️⃣ Opening another shift for Scenario 2...")
shift2_open = requests.post(
    f"{BASE_URL}/shifts/open?user_id=1",
    headers=headers,
    json={"start_cash": 100000}
)
print_response("Open Shift #2", shift2_open)

print("\n2️⃣ Closing shift with SHORTAGE...")
print("   Scenario 2: With shortage (end_cash = 95000, shortage = 5000)")

close_shift_2 = requests.post(
    f"{BASE_URL}/shifts/close?user_id=1",
    headers=headers,
    json={
        "end_cash": 95000,
        "shortage_amount": 5000
    }
)
print_response("Close Shift (With Shortage)", close_shift_2)

if close_shift_2.status_code == 200:
    print("\n   ✅ Shift closed with shortage!")
    print("   📱 Telegram notification should be sent to Owner")
    print("   📒 Debt should be created: 'KASSIR KAMOMADI'")

print("\n" + "="*60)
print("🎉 SCENARIO 2 TEST COMPLETED")
print("="*60)

print("\n\n✅ ALL TESTS COMPLETED")
print("Check Telegram for owner notifications!")
print("Check database for debt records:")
print("  SQLite: SELECT * FROM debts WHERE customer_name LIKE '%KASSIR%';")
