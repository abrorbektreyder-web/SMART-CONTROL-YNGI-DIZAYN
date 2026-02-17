from sqlalchemy import create_engine, text

# Use the 'postgres' database to query pg_database system catalog
# Using the confirmed password 'postgres123'
DATABASE_URL = "postgresql://postgres:postgres123@localhost/postgres"

def list_databases():
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as connection:
            result = connection.execute(text("SELECT datname FROM pg_database WHERE datistemplate = false;"))
            print("\n----- DATABASES FOUND -----")
            for row in result:
                print(f"- {row[0]}")
            print("---------------------------\n")
    except Exception as e:
        print(f"Error listing databases: {e}")

if __name__ == "__main__":
    list_databases()
