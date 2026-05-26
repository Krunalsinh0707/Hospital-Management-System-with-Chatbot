import sys
sys.path.append('.')
from src.auth import verify_password
h = "$2b$12$qH0pTFevfDp9tUht/wRtB.SmU7paljDMi/vxPMR6ZGvaykouMmA1i"
passwords = ['123456789', 'password!', 'aditi1234', '1234567890', '9274368989', 'Aditi123!', 'aditi@123', 'password1']
for p in passwords:
    try:
        match = verify_password(p, h)
        print(f"Password '{p}' match: {match}")
    except Exception as e:
        print(f"Error checking '{p}': {e}")
