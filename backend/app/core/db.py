import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 1. Sozlamalar fayliga ishonmaymiz, to'g'ridan-to'g'ri Environmentdan olamiz
DATABASE_URL = os.getenv("DATABASE_URL")

# 2. Agar Renderda bo'lsak, manzilni to'g'irlaymiz
# (Render "postgres://" beradi, lekin Python "postgresql://" ni xohlaydi)
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# 3. Agar Environment bo'sh bo'lsa (Localhost), faqat shunda SQLite ishlatamiz
if not DATABASE_URL:
    print("DIQQAT: PostgreSQL topilmadi, vaqtinchalik SQLite ishlatilyapti!")
    DATABASE_URL = "sqlite:///./sql_app.db"
    connect_args = {"check_same_thread": False}
else:
    print(f"ULLANYAPMAN: {DATABASE_URL[:20]}...") # Logga yozamiz
    connect_args = {}

# 4. Dvigatelni o't oldiramiz
engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()