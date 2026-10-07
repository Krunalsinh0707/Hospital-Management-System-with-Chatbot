from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session
import os
import logging

logger = logging.getLogger(__name__)

# Configuration from Environment Variables
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-health-analyzer-2026-secure-token")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ALLOWED_ALGORITHMS = ["HS256"]
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours

if ALGORITHM not in ALLOWED_ALGORITHMS:
    logger.warning("Unsafe JWT algorithm '%s' specified. Forcing HS256.", ALGORITHM)
    ALGORITHM = "HS256"

if SECRET_KEY == "dev-secret-key-health-analyzer-2026-secure-token" and os.getenv("ENVIRONMENT", "development").lower() == "production":
    logger.critical("SECURITY CRITICAL: Default dev SECRET_KEY is active in production! Set SECRET_KEY environment variable.")

pwd_context = CryptContext(schemes=["bcrypt", "pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None
    role: Optional[str] = None

class User(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    blood_group: str
    mobile_no: str
    email_verified: Optional[int] = 1
    mobile_verified: Optional[int] = 1
    profile_data: Optional[dict] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

from src.database import get_db

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        user_id: int = payload.get("user_id")
        role: str = payload.get("role")
        
        if email is None or user_id is None:
            raise credentials_exception
            
        # Verify user still exists and role matches DB
        from src.models import User as DBUser
        user = db.query(DBUser).filter(DBUser.id == user_id).first()
        if not user:
            raise credentials_exception
            
        token_data = TokenData(email=user.email, user_id=user.id, role=user.role or role)
    except JWTError:
        raise credentials_exception
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking user existence: {e}")
        raise credentials_exception
        
    return token_data

async def get_current_admin(current_user: TokenData = Depends(get_current_user)):
    if current_user.role not in ["admin", "hospital_admin", "department_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user

async def get_current_doctor(current_user: TokenData = Depends(get_current_user)):
    if current_user.role not in ["doctor", "emergency_doctor", "admin", "hospital_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor authorization required"
        )
    return current_user


