from sqlalchemy import text, inspect
from app.core.db import engine, SessionLocal

# Get all table names
inspector = inspect(engine)
tables = inspector.get_table_names()
print("=== JADVALLAR ===")
for t in tables:
    print(f"  - {t}")

print("\n=== USERS JADVALIGA BOG'LANISHLAR ===")
for table in tables:
    fks = inspector.get_foreign_keys(table)
    for fk in fks:
        if 'users' in str(fk.get('referred_table', '')):
            print(f"  {table}.{fk['constrained_columns']} -> users.{fk['referred_columns']}")
