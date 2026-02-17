import sys
import os
sys.path.append(os.getcwd())

from app.core.db import engine
from sqlalchemy import text

with engine.connect() as conn:
    # Add missing enum values (uppercase to match existing values in DB)
    try:
        conn.execute(text("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'ACCOUNTANT'"))
        conn.execute(text("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'accountant'"))
        conn.execute(text("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'owner'"))
        conn.execute(text("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'cashier'"))
        conn.commit()
        print("✅ Enum values added successfully!")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Verify
    result = conn.execute(text("SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'userrole')"))
    print("Updated enum values:", [r[0] for r in result])
