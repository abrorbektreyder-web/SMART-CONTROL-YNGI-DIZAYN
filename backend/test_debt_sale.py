import requests
import json

BASE = 'http://localhost:8000'

# 1. Login as kassir
print('1. KASSIR LOGIN...')
resp = requests.post(f'{BASE}/auth/login', data={'username': 'kassir', 'password': 'kassir123'})
print(f'   Status: {resp.status_code}')
if resp.status_code != 200:
    print(f'   ERROR: {resp.text}')
    exit()

token = resp.json()['access_token']
print(f'   Token: {token[:20]}...')

headers = {'Authorization': f'Bearer {token}'}

# 2. Search product
print('')
print('2. MAHSULOT QIDIRISH (1111)...')
resp = requests.get(f'{BASE}/products/1111', headers=headers)
print(f'   Status: {resp.status_code}')
if resp.status_code == 200:
    product = resp.json()
    print(f'   Topildi: {product["name"]} - {product["price"]} UZS')
else:
    print(f'   ERROR: {resp.text}')
    exit()

# 3. Make DEBT sale
print('')
print('3. NASIYA SAVDO...')
sale_data = {
    'items': [{'barcode': '1111', 'quantity': 1}],
    'payment_method': 'DEBT',
    'shift_id': 1,
    'customer_name': 'Test Mijoz API',
    'customer_phone': '+998901112233'
}
resp = requests.post(f'{BASE}/sales/checkout?user_id=2', headers=headers, json=sale_data)
print(f'   Status: {resp.status_code}')
if resp.status_code == 200:
    result = resp.json()
    print(f'   MUVAFFAQIYAT! Savdo ID: {result["id"]}')
    print(f'   Summa: {result["total_amount"]} UZS')
else:
    print(f'   ERROR: {resp.text}')

print('')
print('4. TELEGRAM XABAR YUBORILDI! (Backend loglarni tekshiring)')
