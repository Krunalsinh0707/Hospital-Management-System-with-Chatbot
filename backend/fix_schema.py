import sys
import os

# Add current directory to path so we can import src
sys.path.append(os.getcwd())

try:
    from src.database import get_db_connection, init_db
    
    conn = get_db_connection()
    if not conn:
        print("Failed to connect.")
        sys.exit(1)
        
    cursor = conn.cursor()
    
    print("Dropping outdated patient_reports table...")
    try:
        cursor.execute("DROP TABLE patient_reports")
        print("Table dropped.")
    except Exception as e:
        print(f"Error dropping table (might not exist): {e}")

    try:
        # Also drop cbc_reports if it's old (to be safe)
        cursor.execute("DROP TABLE cbc_reports")
        print("cbc_reports Table dropped (to ensure clean slate).")
    except Exception as e:
        print(f"Error dropping cbc_reports: {e}")
        
    conn.commit()
    conn.close()
    
    print("Re-initializing database schema...")
    init_db()
    
    print("Schema update complete.")

except Exception as e:
    print(f"Error: {e}")
