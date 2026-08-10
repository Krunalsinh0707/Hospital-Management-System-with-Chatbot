from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., example="user@gmail.com")

class VerifyOTPRequest(BaseModel):
    email: str = Field(..., example="user@gmail.com")
    otp: str = Field(..., min_length=6, max_length=6, example="483921")

class ResetPasswordRequest(BaseModel):
    email: str = Field(..., example="user@gmail.com")
    password: str = Field(..., min_length=8, example="NewPassword123!")
    confirm_password: str = Field(..., min_length=8, example="NewPassword123!")

class PasswordResetResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
