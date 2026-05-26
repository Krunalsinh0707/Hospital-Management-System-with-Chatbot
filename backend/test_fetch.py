import sys
sys.path.append('.')
from src.database import get_db_connection

def test_login(login_id_raw):
    login_id_email = login_id_raw.lower()
    import re
    login_id_mobile = re.sub(r"\D", "", login_id_raw or "")
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    print(f"Executing query for email='{login_id_email}' OR mobile_no='{login_id_mobile}'")
    cursor.execute(
        "SELECT id, email, mobile_no FROM users WHERE email = %s OR mobile_no = %s",
        (login_id_email, login_id_mobile),
    )
    user = cursor.fetchone()
    print("User found:", user)

test_login("9274368989")
