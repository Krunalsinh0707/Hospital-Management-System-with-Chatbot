import sys
import traceback
sys.path.append('.')
from src.auth import verify_password

h = "$2b$12$qH0pTFevfDp9tUht/wRtB.SmU7paljDMi/vxPMR6ZGvaykouMmA1i"
passwords = ['123456789', 'password!', 'aditi1234', '1234567890', '9274368989', 'Aditi123!', 'aditi@123', 'password1']

results = []
try:
    for p in passwords:
        try:
            match = verify_password(p, h)
            results.append(f"Password '{p}' match: {match}")
        except Exception as e:
            results.append(f"Error checking '{p}': {traceback.format_exc()}")
except Exception as e:
    results.append(f"Global error: {traceback.format_exc()}")

with open('error_log.json', 'w', encoding='utf-8') as f:
    import json
    json.dump(results, f, indent=4)
