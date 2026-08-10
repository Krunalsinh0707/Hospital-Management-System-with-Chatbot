import secrets
import logging
from datetime import datetime, timedelta, timezone
from typing import Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import delete, select, func

from src.models import PasswordResetOTP

logger = logging.getLogger("health_analyzer.otp_service")

class OTPService:
    """
    Service layer for 6-digit numeric OTP generation, rate limiting,
    database persistence, verification, and attempt checking.
    """

    @staticmethod
    def generate_6digit_otp() -> str:
        """Generate cryptographically secure 6-digit numeric OTP string."""
        digits = [str(secrets.randbelow(10)) for _ in range(6)]
        return "".join(digits)

    @staticmethod
    def cleanup_expired_otps(db: Session, email: Optional[str] = None):
        """Clean up expired OTP records from database."""
        now = datetime.now(timezone.utc)
        try:
            stmt = delete(PasswordResetOTP).where(PasswordResetOTP.expires_at < now)
            if email:
                stmt = stmt.where(PasswordResetOTP.email == email)
            db.execute(stmt)
            db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Error during OTP cleanup: {e}")

    @classmethod
    def create_otp_for_email(
        cls,
        db: Session,
        email: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Tuple[bool, str, Optional[str]]:
        """
        Generate and persist a new 6-digit OTP for email.
        Enforces:
        - Deletes any previous OTP for this email
        - Rate limit: Max 3 OTP requests within 10 minutes
        - Exactly 5 minutes expiration time
        """
        now = datetime.now(timezone.utc)
        cls.cleanup_expired_otps(db, email)

        # 1. Rate Limit Check: Max 3 OTP requests within 10 minutes
        ten_mins_ago = now - timedelta(minutes=10)
        recent_count = db.query(func.count(PasswordResetOTP.id)).filter(
            PasswordResetOTP.email == email,
            PasswordResetOTP.created_at >= ten_mins_ago
        ).scalar()

        if recent_count and recent_count >= 3:
            return False, "Maximum OTP request limit (3 requests in 10 minutes) reached. Please try again later.", None

        # 2. Delete previous active OTP records for this email
        try:
            db.execute(delete(PasswordResetOTP).where(PasswordResetOTP.email == email))
            db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Error deleting old OTPs for {email}: {e}")

        # 3. Generate new 6-digit OTP
        otp_code = cls.generate_6digit_otp()
        expires_at = now + timedelta(minutes=5)

        otp_record = PasswordResetOTP(
            email=email,
            otp=otp_code,
            attempts=0,
            verified=False,
            created_at=now,
            expires_at=expires_at,
            ip_address=ip_address,
            user_agent=user_agent
        )

        try:
            db.add(otp_record)
            db.commit()
            db.refresh(otp_record)
            logger.info(f"🔑 Generated new OTP for {email}, expires at {expires_at}")
            return True, "OTP Generated Successfully", otp_code
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to save OTP to database: {e}")
            return False, "Database error generating OTP", None

    @classmethod
    def verify_otp_for_email(cls, db: Session, email: str, input_otp: str) -> Tuple[bool, str]:
        """
        Validate input OTP for email against database record.
        Enforces:
        - Check record exists
        - Expiry check (5 mins)
        - Attempts check (max 5 attempts)
        - Single-use validation
        """
        now = datetime.now(timezone.utc)
        cls.cleanup_expired_otps(db, email)

        record = db.query(PasswordResetOTP).filter(
            PasswordResetOTP.email == email
        ).order_by(PasswordResetOTP.id.desc()).first()

        if not record:
            return False, "Invalid or Expired OTP"

        # Check expiration time
        record_expires = record.expires_at
        if record_expires.tzinfo is None:
            record_expires = record_expires.replace(tzinfo=timezone.utc)

        if now > record_expires:
            db.delete(record)
            db.commit()
            return False, "OTP Expired"

        # Check maximum verification attempts limit (max 5)
        if record.attempts >= 5:
            db.delete(record)
            db.commit()
            return False, "Maximum OTP verification attempts exceeded. Please request a new OTP."

        # Verify OTP value
        if record.otp != input_otp.strip():
            record.attempts += 1
            db.commit()
            remaining = 5 - record.attempts
            if remaining > 0:
                return False, f"Invalid OTP. {remaining} attempt(s) remaining."
            else:
                db.delete(record)
                db.commit()
                return False, "Invalid OTP. Limit exceeded."

        # Success! Mark verified
        record.verified = True
        db.commit()
        logger.info(f"✅ OTP verified successfully for {email}")
        return True, "OTP Verified"

    @classmethod
    def delete_otp_for_email(cls, db: Session, email: str):
        """Remove OTP record upon completion of password reset."""
        try:
            db.execute(delete(PasswordResetOTP).where(PasswordResetOTP.email == email))
            db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to delete OTP for {email}: {e}")

otp_service = OTPService()
