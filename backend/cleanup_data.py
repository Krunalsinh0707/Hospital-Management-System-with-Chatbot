import sys
import os

# Add src to path
sys.path.append(os.path.join(os.getcwd(), 'src'))

try:
    from database import get_db_connection
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to database")
        sys.exit(1)
        
    cursor = conn.cursor()
    tables = ['patient_reports', 'heart_reports', 'hypertension_reports', 'cbc_reports']
    
    for table in tables:
        print(f"Cleaning up {table}...")
        cursor.execute(f"UPDATE {table} SET probability = probability / 100 WHERE probability > 1")
        print(f"Updated {cursor.rowcount} rows in {table}")
        
    conn.commit()
    print("Cleanup complete. All probabilities normalized to 0-1 range.")
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error during cleanup: {e}")
