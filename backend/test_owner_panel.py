import requests

BASE = 'http://localhost:8000'

# Login as Owner
resp = requests.post(f'{BASE}/auth/login', data={'username': '998901234567', 'password': 'admin123'})
token = resp.json()['access_token']
headers = {'Authorization': f'Bearer {token}'}

print('=== TEST: OWNER PANEL ===')

# 1. Get Products
print('')
print('1. MAHSULOTLAR:')
resp = requests.get(f'{BASE}/products/', headers=headers)
if resp.status_code == 200:
    products = resp.json()
    print(f'   Jami: {len(products)} ta')
    for p in products[:3]:
        print(f"   - {p['name']}: {p['price']} UZS, Stock: {p['stock_quantity']}")
else:
    print(f'   ERROR: {resp.text}')

# 2. Get Users
print('')
print('2. XODIMLAR:')
resp = requests.get(f'{BASE}/auth/users', headers=headers)
if resp.status_code == 200:
    users = resp.json()
    print(f'   Jami: {len(users)} ta')
    for u in users:
        status = 'Faol' if u['is_active'] else 'Bloklangan'
        print(f"   - {u['username']} ({u['role']}): {status}")
else:
    print(f'   ERROR: {resp.text}')

print('')
print('=== TEST TUGADI ===')
