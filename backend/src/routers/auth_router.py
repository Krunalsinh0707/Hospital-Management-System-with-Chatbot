from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional
from datetime import timedelta, datetime
import random
import re

from src.database import get_db_connection
from src.auth import (
    Token, User, get_current_user, get_password_hash,
    verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
)
from src.sms_service import send_otp_sms

router = APIRouter(tags=["Authentication"])

class UserCreate(BaseModel):
    email: str
    mobile_no: str
    blood_group: str
    password: str
    full_name: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    blood_group: Optional[str] = None
    mobile_no: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: str
    mobile_no: str
    full_name: str
    blood_group: str

class ResetPasswordRequest(BaseModel):
    mobile_no: str
    otp: str
    new_password: str

def _is_valid_email(email: str) -> bool:
    return re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email) is not None

def _normalize_mobile(mobile_no: str) -> str:
    return re.sub(r"\D", "", mobile_no or "")

def _is_valid_mobile(mobile_no: str) -> bool:
    normalized = _normalize_mobile(mobile_no)
    return 10 <= len(normalized) <= 15

@router.post("/register", response_model=Token)
async def register(user: UserCreate):
    email = (user.email or "").strip().lower()
    mobile_no = _normalize_mobile(user.mobile_no)

    if not _is_valid_email(email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    if not _is_valid_mobile(mobile_no):
        raise HTTPException(status_code=400, detail="Valid mobile number is required")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")

    cursor.execute("SELECT id FROM users WHERE mobile_no = %s", (mobile_no,))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Mobile number already registered")

    hashed_password = get_password_hash(user.password)

    cursor.execute(
        """
        INSERT INTO users (email, mobile_no, blood_group, password_hash, full_name, role)
        VALUES (%s, %s, %s, %s, %s, 'user')
        """,
        (email, mobile_no, user.blood_group, hashed_password, user.full_name)
    )
    conn.commit()
    user_id = cursor.lastrowid

    access_token = create_access_token(
        data={"sub": email, "user_id": user_id, "role": "user"},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    cursor.close()
    conn.close()

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    login_id_raw = (form_data.username or "").strip()
    login_id_email = login_id_raw.lower()
    login_id_mobile = _normalize_mobile(login_id_raw)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    if "@" in login_id_raw:
        cursor.execute("SELECT * FROM users WHERE email = %s", (login_id_email,))
    else:
        cursor.execute("SELECT * FROM users WHERE mobile_no = %s", (login_id_mobile,))
    user = cursor.fetchone()

    if not user or not verify_password(form_data.password, user["password_hash"]):
        cursor.close()
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    access_token = create_access_token(
        data={"sub": user["email"], "user_id": user["id"], "role": user["role"]},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    cursor.close()
    conn.close()

    return {"access_token": access_token, "token_type": "bearer"}





@router.get("/users/me", response_model=User)
async def read_users_me(current_user=Depends(get_current_user)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE id = %s", (current_user.user_id,))
        user = cursor.fetchone()
        
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
            
        return user
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()


@router.put("/users/me", response_model=User)
async def update_user_me(user_update: UserUpdate, current_user=Depends(get_current_user)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor(dictionary=True)
        ALLOWED_COLUMNS = {"full_name", "blood_group", "mobile_no"}
        update_data = {k: v for k, v in user_update.dict(exclude_unset=True).items() if k in ALLOWED_COLUMNS}
        if not update_data:
            raise HTTPException(status_code=400, detail="No valid fields provided for update")
        
        if "mobile_no" in update_data:
            update_data["mobile_no"] = _normalize_mobile(update_data["mobile_no"])
            if not _is_valid_mobile(update_data["mobile_no"]):
                raise HTTPException(status_code=400, detail="Invalid mobile number format")

        columns = ", ".join([f"`{k}` = %s" for k in update_data.keys()])
        values = list(update_data.values())
        values.append(current_user.user_id)
        
        query = f"UPDATE users SET {columns} WHERE id = %s"
        cursor.execute(query, tuple(values))
        conn.commit()
        
        cursor.execute("SELECT * FROM users WHERE id = %s", (current_user.user_id,))
        updated_user = cursor.fetchone()
        return updated_user
        
    except Exception as e:
        if "Duplicate entry" in str(e):
            raise HTTPException(status_code=400, detail="Mobile number already registered by another user")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()
