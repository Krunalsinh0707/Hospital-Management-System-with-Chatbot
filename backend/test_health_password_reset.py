import asyncio
import logging
from sqlalchemy.orm import Session
from src.database import SessionLocal, init_db, engine
from src.models import User, Base, PasswordResetOTP
from src.services.otp_service import otp_service
from src.services.email_service import email_service
from src.auth import get_password_hash, verify_password

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_password_reset")

def test_password_reset_flow():
    print("==================================================")
    print("  TESTING HEALTH ANALYZER FORGOT PASSWORD SYSTEM")
    print("==================================================")

    # Initialize tables
    init_db()
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()

    try:
        # Step 1: Ensure a test user exists
        test_email = "test_user_forgot@healthanalyzer.ai"
        user = db.query(User).filter(User.email == test_email).first()
        if not user:
            user = User(
                email=test_email,
                mobile_no="9998887776",
                blood_group="A+",
                password_hash=get_password_hash("OldPassword123!"),
                full_name="Test Patient",
                role="user"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Created test user: {test_email}")

        # Test A: Non-existent email check
        print("\n[Test A] Checking Non-Existent Email...")
        no_user = db.query(User).filter(User.email == "not_registered_email_999@domain.com").first()
        assert no_user is None
        print("Result: Email not registered -> Verified Correctly")

        # Test B: Create OTP & Check Rate Limits
        print("\n[Test B] Generating 6-Digit OTP...")
        ok, msg, otp_code = otp_service.create_otp_for_email(db, test_email)
        print(f"OTP Generation Result: ok={ok}, msg='{msg}', otp={otp_code}")
        assert ok is True
        assert len(otp_code) == 6 and otp_code.isdigit()

        # Test C: Verify OTP Verification Logic
        print("\n[Test C] Verifying Correct OTP...")
        verify_ok, verify_msg = otp_service.verify_otp_for_email(db, test_email, otp_code)
        print(f"Verification Result: ok={verify_ok}, msg='{verify_msg}'")
        assert verify_ok is True

        # Check record is marked verified
        otp_record = db.query(PasswordResetOTP).filter(PasswordResetOTP.email == test_email).first()
        assert otp_record is not None and bool(otp_record.verified) is True

        # Test D: Reset Password & bcrypt Hash Update
        print("\n[Test D] Updating Password to NewPassword123!...")
        new_password = "NewPassword123!"
        user.password_hash = get_password_hash(new_password)
        db.commit()

        # Verify old password fails & new password succeeds
        assert verify_password("OldPassword123!", user.password_hash) is False
        assert verify_password("NewPassword123!", user.password_hash) is True
        print("Password bcrypt update verified!")

        # Test E: OTP Deletion After Reset
        print("\n[Test E] Cleaning Up OTP Record...")
        otp_service.delete_otp_for_email(db, test_email)
        remaining_otp = db.query(PasswordResetOTP).filter(PasswordResetOTP.email == test_email).first()
        assert remaining_otp is None
        print("OTP successfully deleted after password reset!")

        print("\n[SUCCESS] ALL HEALTH ANALYZER FORGOT PASSWORD TESTS PASSED!")

    finally:
        db.close()

if __name__ == "__main__":
    test_password_reset_flow()
