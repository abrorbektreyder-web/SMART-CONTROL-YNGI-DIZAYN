import sys
import os
sys.path.append(os.getcwd())

from app.core.db import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text("SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'userrole')"))
    print("Database enum values:", [r[0] for r in result])
