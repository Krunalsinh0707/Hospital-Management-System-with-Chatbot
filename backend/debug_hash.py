from passlib.context import CryptContext

try:
    pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
    password = "AdminPass123!"
    print(f"Hashing password: {password}")
    hashed = pwd_context.hash(password)
    print(f"Success: {hashed}")
except Exception as e:
    import traceback
    traceback.print_exc()
