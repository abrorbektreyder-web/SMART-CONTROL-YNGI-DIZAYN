import sqlite3
import os

# Try multiple possible database locations
db_paths = [
    'smart_control.db',
    '../smart_control.db',
    os.path.join(os.path.dirname(__file__), 'smart_control.db')
]

db_path = None
for path in db_paths:
    if os.path.exists(path):
        db_path = path
        break

if not db_path:
    # Check app.core.db configuration
    import sys
    sys.path.insert(0, os.path.dirname(__file__))
    from app.core.db import SQLALCHEMY_DATABASE_URL
    db_path = SQLALCHEMY_DATABASE_URL.replace('sqlite:///', '')
    print(f"Using database from config: {db_path}")

print(f"📂 Database: {db_path}")
print("="*60)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("📊 DATABASE TABLES:")
print("="*60)
tables = cursor.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
for t in tables:
    print(f"  - {t[0]}")

if not tables:
    print("  ❌ No tables found! Database might not be initialized.")
    conn.close()
    exit(0)

# Check if shifts table exists
table_names = [t[0] for t in tables]
if 'shifts' in table_names:
    print("\n📊 SHIFTS:")
    print("="*60)
    shifts = cursor.execute("SELECT id, user_id, start_time,end_time, start_cash, end_cash, status FROM shifts ORDER BY id DESC LIMIT 3").fetchall()
    for s in shifts:
        end_cash_str = f"{s[5]:,.0f}" if s[5] else "N/A"
        print(f"ID: {s[0]} | User: {s[1]} | Start: {s[4]:,.0f} | End: {end_cash_str} | Status: {s[6]}")
else:
    print("\n⚠️ 'shifts' table not found")

if 'debts' in table_names:
    print("\n📊 DEBTS (KASSIR KAMOMAD):")
    print("="*60)
    debts = cursor.execute("SELECT * FROM debts").fetchall()
    if debts:
        for d in debts:
            print(d)
    else:
        print("  No debts found")
else:
    print("\n⚠️ 'debts' table not found")


conn.close()
