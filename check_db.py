import sqlite3

conn = sqlite3.connect(r'c:\Users\Asus\Desktop\CAPCUT\Smart control\backend\smart_control.db')
cursor = conn.cursor()

# Get tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print("Tables:", tables)

# Get products if exists
try:
    cursor.execute("SELECT id, barcode, name FROM product LIMIT 3")
    products = cursor.fetchall()
    print("Products:", products)
except Exception as e:
    print("Error:", e)

conn.close()
