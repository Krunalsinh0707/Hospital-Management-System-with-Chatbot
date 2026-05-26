from sqlalchemy import create_engine, text
from src.database import get_sqlalchemy_engine

try:
    engine = get_sqlalchemy_engine()
    print(f"Testing connection to: {engine.url}")
    with engine.connect() as conn:
        result = conn.execute(text("SELECT DATABASE()"))
        db_name = result.scalar()
        print(f"SUCCESS! Connected to database: {db_name}")
except Exception as e:
    import traceback
    traceback.print_exc()
    print(f"Connection failed: {e}")
