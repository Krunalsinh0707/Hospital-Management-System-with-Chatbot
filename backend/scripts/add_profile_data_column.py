import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.database import engine
from sqlalchemy import text

def add_column():
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_data JSONB DEFAULT '{}'::jsonb;"))
        conn.commit()
        print("Column profile_data added/verified in users table.")

if __name__ == "__main__":
    add_column()
