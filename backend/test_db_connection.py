from sqlalchemy import create_engine
import traceback
import os

DB_HOST = "127.0.0.1" # Force IPv4 loopback
DB_USER = os.getenv("DB_USER", "root")
DB_NAME = os.getenv("DB_NAME", "health_analyzer_db")
DB_PORT = int(os.getenv("DB_PORT", 3306))

passwords = ["root", "", "password", "admin"]

success = False

for pwd in passwords:
    print(f"Trying password: '{pwd}' ...")
    try:
        DATABASE_URL = f"mysql+pymysql://{DB_USER}:{pwd}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            print(f"SUCCESS! Password is '{pwd}'")
            success = True
            break
    except Exception:
        print(f"Failed with password '{pwd}'")

if not success:
    print("All passwords failed.")
    # Print traceback of last attempt
    traceback.print_exc()
