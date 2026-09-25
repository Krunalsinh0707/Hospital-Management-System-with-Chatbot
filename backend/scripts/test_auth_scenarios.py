import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)

from src.database import SessionLocal
from src.models import User
from src.auth import verify_password

def verify_all_logins():
    db = SessionLocal()
    try:
        print("=== 1. VERIFYING DOCTOR ACCOUNTS WITH 'Abc@123' ===")
        doctors = db.query(User).filter(User.role.in_(["doctor", "emergency_doctor"])).all()
        print(f"Total doctor accounts found: {len(doctors)}")
        success_count = 0
        for doc in doctors:
            if verify_password("Abc@123", doc.password_hash):
                success_count += 1
            else:
                print(f"FAILED password check for: {doc.email}")
        
        print(f"Verified {success_count}/{len(doctors)} doctors successfully match 'Abc@123'.")
        assert success_count == len(doctors), "Not all doctors matched Abc@123!"

        print("\n=== 2. VERIFYING PATIENT ACCOUNTS EXIST ===")
        patients = db.query(User).filter(User.role.in_(["patient", "user"])).all()
        print(f"Total patient accounts found: {len(patients)}")
        if patients:
            print(f"Sample patient: {patients[0].email} (Role: {patients[0].role})")

        print("\n=== 3. VERIFYING ADMIN ACCOUNTS EXIST ===")
        admins = db.query(User).filter(User.role.in_(["admin", "hospital_admin", "department_admin"])).all()
        print(f"Total admin accounts found: {len(admins)}")
        if admins:
            print(f"Sample admin: {admins[0].email} (Role: {admins[0].role})")

        print("\n[OK] All backend account tests passed successfully.")
    finally:
        db.close()

if __name__ == "__main__":
    verify_all_logins()
