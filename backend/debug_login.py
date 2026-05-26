from sqlalchemy import text
from src.database import get_sqlalchemy_engine
from src.auth import verify_password
import sys

email = "admin@gmail.com"
password = "Admin@123"

try:
    engine = get_sqlalchemy_engine()
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, email, password_hash, role FROM users WHERE email = :email"), {"email": email})
        user = result.fetchone()
        
        if not user:
            print(f"User {email} NOT FOUND in database!")
            sys.exit(1)
            
        print(f"User found: ID={user.id}, Role={user.role}")
        print(f"Stored Hash: {user.password_hash}")
        
        is_valid = verify_password(password, user.password_hash)
        print(f"Password verification result: {is_valid}")
        
        if is_valid:
            print("Login SHOULD work.")
        else:
            print("Login FAILED. Password mismatch or hashing issue.")

except Exception as e:
    import traceback
    traceback.print_exc()
