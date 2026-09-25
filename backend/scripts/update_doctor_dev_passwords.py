import os
import sys

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)

from src.database import SessionLocal
from src.models import User
from src.auth import get_password_hash

def update_doctor_passwords():
    """
    Safely updates only doctor and emergency_doctor accounts to the development password 'Abc@123'.
    Patient and Admin accounts are left strictly untouched.
    """
    db = SessionLocal()
    try:
        new_hashed = get_password_hash("Abc@123")
        doctors = db.query(User).filter(User.role.in_(["doctor", "emergency_doctor"])).all()
        print(f"Found {len(doctors)} doctor accounts in database.")
        
        updated = 0
        for doc in doctors:
            doc.password_hash = new_hashed
            updated += 1
            print(f"  -> Updated doctor password hash for: {doc.email} ({doc.full_name})")
            
        db.commit()
        print(f"Successfully updated {updated} doctor accounts to development password 'Abc@123'.")
    except Exception as e:
        db.rollback()
        print(f"Error updating doctor passwords: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    update_doctor_passwords()
