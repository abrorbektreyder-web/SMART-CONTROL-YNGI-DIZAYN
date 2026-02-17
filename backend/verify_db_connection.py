import sys
import os

# Add the current directory to sys.path
sys.path.append(os.getcwd())

from app.core.db import engine
from sqlalchemy import text

def check_db():
    print("Attempting to connect to configured DB...")
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("Database connection successful to 'smart_control_dev'!")
            return
    except Exception as e:
        print(f"Connection to 'smart_control_dev' failed: {repr(e)}")

    print("\nAttempting to connect to default 'postgres' DB to check credentials...")
    try:
        # Create a temporary engine for default DB
        from sqlalchemy import create_engine
        default_url = "postgresql://postgres:1234@localhost/postgres"
        default_engine = create_engine(default_url)
        with default_engine.connect() as connection:
            connection.execute(text("SELECT 1"))
            print("Connection to 'postgres' DB successful! Credentials are correct.")
            print("Likely cause: Database 'smart_control_dev' does not exist.")
    except Exception as e:
        print(f"Connection to 'postgres' DB also failed: {repr(e)}")


if __name__ == "__main__":
    check_db()
