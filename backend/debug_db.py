import sys
import os

# Add current directory to path so we can import src
sys.path.append(os.getcwd())

try:
    from src.database import get_db_connection
    
    print("Connecting to database...")
    conn = get_db_connection()
    
    if not conn:
        print("Failed to connect to database.")
        sys.exit(1)
        
    print("Connected successfully.")
    cursor = conn.cursor(dictionary=True)
    
    # Check Users
    print("\n--- Users ---")
    cursor.execute("SELECT id, email, role, full_name FROM users")
    users = cursor.fetchall()
    for u in users:
        print(u)
        
    # Check Patient Reports Schema
    print("\n--- Patient Reports Columns ---")
    cursor.execute("DESCRIBE patient_reports")
    cols = cursor.fetchall()
    for c in cols:
        print(f"{c['Field']} ({c['Type']})")
        
    # Check Reports Data
    print("\n--- Patient Reports Data (Limit 5) ---")
    cursor.execute("SELECT id, user_id, risk_level, diabetes_prediction FROM patient_reports LIMIT 5")
    reports = cursor.fetchall()
    for r in reports:
        print(r)

    conn.close()

except Exception as e:
    print(f"Error: {e}")
