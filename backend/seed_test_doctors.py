import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.database import SessionLocal, init_db
from src.models import Department, Doctor, User
from src.auth import get_password_hash

# Ensure DB tables exist
init_db()

TEST_DOCTORS_DATA = [
    # Cardiology
    {
        "dept_code": "CARD",
        "name": "Dr. Aarav Shah",
        "email": "aarav.shah.test@healthanalyzer.com",
        "mobile": "9876543201",
        "specialization": "Cardiology",
        "qualification": "MD Cardiology",
        "license": "TEST-CARD-001",
        "experience": 10
    },
    {
        "dept_code": "CARD",
        "name": "Dr. Riya Mehta",
        "email": "riya.mehta.test@healthanalyzer.com",
        "mobile": "9876543202",
        "specialization": "Interventional Cardiology",
        "qualification": "DM Cardiology",
        "license": "TEST-CARD-002",
        "experience": 8
    },
    # Oncology
    {
        "dept_code": "ONCO",
        "name": "Dr. Arjun Patel",
        "email": "arjun.patel.test@healthanalyzer.com",
        "mobile": "9876543203",
        "specialization": "Medical Oncology",
        "qualification": "DM Oncology",
        "license": "TEST-ONCO-001",
        "experience": 12
    },
    {
        "dept_code": "ONCO",
        "name": "Dr. Nisha Desai",
        "email": "nisha.desai.test@healthanalyzer.com",
        "mobile": "9876543204",
        "specialization": "Surgical Oncology",
        "qualification": "MS MCh Surgical Oncology",
        "license": "TEST-ONCO-002",
        "experience": 9
    },
    # Orthopedics
    {
        "dept_code": "ORTHO",
        "name": "Dr. Dev Mehta",
        "email": "dev.mehta.test@healthanalyzer.com",
        "mobile": "9876543205",
        "specialization": "Orthopedics",
        "qualification": "MS Orthopedics",
        "license": "TEST-ORTHO-001",
        "experience": 11
    },
    {
        "dept_code": "ORTHO",
        "name": "Dr. Kavya Shah",
        "email": "kavya.shah.test@healthanalyzer.com",
        "mobile": "9876543206",
        "specialization": "Joint Replacement Specialist",
        "qualification": "DNB Orthopedics",
        "license": "TEST-ORTHO-002",
        "experience": 7
    },
    # Neurology
    {
        "dept_code": "NEURO",
        "name": "Dr. Rahul Joshi",
        "email": "rahul.joshi.test@healthanalyzer.com",
        "mobile": "9876543207",
        "specialization": "Neurology",
        "qualification": "DM Neurology",
        "license": "TEST-NEURO-001",
        "experience": 14
    },
    {
        "dept_code": "NEURO",
        "name": "Dr. Ananya Patel",
        "email": "ananya.patel.test@healthanalyzer.com",
        "mobile": "9876543208",
        "specialization": "Neurosurgery",
        "qualification": "MCh Neurosurgery",
        "license": "TEST-NEURO-002",
        "experience": 10
    },
    # Pulmonology
    {
        "dept_code": "PULMO",
        "name": "Dr. Vivek Shah",
        "email": "vivek.shah.test@healthanalyzer.com",
        "mobile": "9876543209",
        "specialization": "Pulmonology",
        "qualification": "MD Pulmonology",
        "license": "TEST-PULMO-001",
        "experience": 9
    },
    {
        "dept_code": "PULMO",
        "name": "Dr. Priya Mehta",
        "email": "priya.mehta.test@healthanalyzer.com",
        "mobile": "9876543210",
        "specialization": "Chest & Respiratory Medicine",
        "qualification": "DTCD MD",
        "license": "TEST-PULMO-002",
        "experience": 6
    },
    # Gastroenterology
    {
        "dept_code": "GASTRO",
        "name": "Dr. Karan Patel",
        "email": "karan.patel.test@healthanalyzer.com",
        "mobile": "9876543211",
        "specialization": "Gastroenterology",
        "qualification": "DM Gastroenterology",
        "license": "TEST-GASTRO-001",
        "experience": 13
    },
    {
        "dept_code": "GASTRO",
        "name": "Dr. Neha Shah",
        "email": "neha.shah.test@healthanalyzer.com",
        "mobile": "9876543212",
        "specialization": "Hepatology & GI Care",
        "qualification": "MD DM Gastroenterology",
        "license": "TEST-GASTRO-002",
        "experience": 8
    },
    # Endocrinology
    {
        "dept_code": "ENDO",
        "name": "Dr. Rohan Desai",
        "email": "rohan.desai.test@healthanalyzer.com",
        "mobile": "9876543213",
        "specialization": "Endocrinology",
        "qualification": "DM Endocrinology",
        "license": "TEST-ENDO-001",
        "experience": 10
    },
    {
        "dept_code": "ENDO",
        "name": "Dr. Isha Patel",
        "email": "isha.patel.test@healthanalyzer.com",
        "mobile": "9876543214",
        "specialization": "Diabetes & Metabolic Care",
        "qualification": "MD Endocrinology",
        "license": "TEST-ENDO-002",
        "experience": 7
    },
    # Hematology
    {
        "dept_code": "HEMA",
        "name": "Dr. Mihir Shah",
        "email": "mihir.shah.test@healthanalyzer.com",
        "mobile": "9876543215",
        "specialization": "Hematology",
        "qualification": "DM Hematology",
        "license": "TEST-HEMA-001",
        "experience": 12
    },
    {
        "dept_code": "HEMA",
        "name": "Dr. Diya Mehta",
        "email": "diya.mehta.test@healthanalyzer.com",
        "mobile": "9876543216",
        "specialization": "Clinical Hematology",
        "qualification": "MD DNB Hematology",
        "license": "TEST-HEMA-002",
        "experience": 6
    },
    # Nephrology
    {
        "dept_code": "NEPHRO",
        "name": "Dr. Yash Patel",
        "email": "yash.patel.test@healthanalyzer.com",
        "mobile": "9876543217",
        "specialization": "Nephrology",
        "qualification": "DM Nephrology",
        "license": "TEST-NEPHRO-001",
        "experience": 11
    },
    {
        "dept_code": "NEPHRO",
        "name": "Dr. Pooja Shah",
        "email": "pooja.shah.test@healthanalyzer.com",
        "mobile": "9876543218",
        "specialization": "Renal & Kidney Care",
        "qualification": "MD Nephrology",
        "license": "TEST-NEPHRO-002",
        "experience": 8
    },
    # Dermatology
    {
        "dept_code": "DERM",
        "name": "Dr. Aditya Mehta",
        "email": "aditya.mehta.test@healthanalyzer.com",
        "mobile": "9876543219",
        "specialization": "Dermatology",
        "qualification": "MD Dermatology",
        "license": "TEST-DERM-001",
        "experience": 9
    },
    {
        "dept_code": "DERM",
        "name": "Dr. Simran Patel",
        "email": "simran.patel.test@healthanalyzer.com",
        "mobile": "9876543220",
        "specialization": "Cosmetology & Cutaneous Care",
        "qualification": "DVD MD Dermatology",
        "license": "TEST-DERM-002",
        "experience": 5
    },
    # Pediatrics
    {
        "dept_code": "PEDI",
        "name": "Dr. Harsh Shah",
        "email": "harsh.shah.test@healthanalyzer.com",
        "mobile": "9876543221",
        "specialization": "Pediatrics",
        "qualification": "MD Pediatrics",
        "license": "TEST-PEDI-001",
        "experience": 10
    },
    {
        "dept_code": "PEDI",
        "name": "Dr. Aditi Desai",
        "email": "aditi.desai.test@healthanalyzer.com",
        "mobile": "9876543222",
        "specialization": "Pediatric Growth & Child Care",
        "qualification": "DCH MD Pediatrics",
        "license": "TEST-PEDI-002",
        "experience": 7
    },
    # Gynecology
    {
        "dept_code": "GYNE",
        "name": "Dr. Manav Patel",
        "email": "manav.patel.test@healthanalyzer.com",
        "mobile": "9876543223",
        "specialization": "Gynecology",
        "qualification": "MS Obstetrics & Gynecology",
        "license": "TEST-GYNE-001",
        "experience": 13
    },
    {
        "dept_code": "GYNE",
        "name": "Dr. Riya Shah",
        "email": "riya.shah.test@healthanalyzer.com",
        "mobile": "9876543224",
        "specialization": "Obstetrics & Maternal Care",
        "qualification": "DGO MS Gynecology",
        "license": "TEST-GYNE-002",
        "experience": 8
    },
    # General Medicine
    {
        "dept_code": "GENMED",
        "name": "Dr. Jay Mehta",
        "email": "jay.mehta.test@healthanalyzer.com",
        "mobile": "9876543225",
        "specialization": "General Medicine",
        "qualification": "MD Internal Medicine",
        "license": "TEST-GENMED-001",
        "experience": 15
    },
    {
        "dept_code": "GENMED",
        "name": "Dr. Sneha Patel",
        "email": "sneha.patel.test@healthanalyzer.com",
        "mobile": "9876543226",
        "specialization": "Consultant Physician",
        "qualification": "MBBS MD General Medicine",
        "license": "TEST-GENMED-002",
        "experience": 9
    },
    # Emergency
    {
        "dept_code": "EMERG",
        "name": "Dr. Raj Shah",
        "email": "raj.shah.test@healthanalyzer.com",
        "mobile": "9876543227",
        "specialization": "Emergency Care",
        "qualification": "MEM DNB Emergency Medicine",
        "license": "TEST-EMERG-001",
        "experience": 11
    },
    {
        "dept_code": "EMERG",
        "name": "Dr. Anjali Mehta",
        "email": "anjali.mehta.test@healthanalyzer.com",
        "mobile": "9876543228",
        "specialization": "Critical Care & Triage",
        "qualification": "MD Emergency Medicine",
        "license": "TEST-EMERG-002",
        "experience": 7
    }
]

def seed_test_doctors():
    db = SessionLocal()
    try:
        # Load department map (code -> Department)
        departments = db.query(Department).all()
        dept_map = {d.code.upper(): d for d in departments}

        print(f"Loaded {len(dept_map)} existing departments from database.")
        
        inserted_count = 0
        skipped_count = 0

        default_password_hash = get_password_hash("Abc@123")

        for doc_data in TEST_DOCTORS_DATA:
            dept = dept_map.get(doc_data["dept_code"].upper())
            if not dept:
                print(f"⚠️ Warning: Department code '{doc_data['dept_code']}' not found in DB. Skipping doctor '{doc_data['name']}'.")
                continue

            # Check if user with email already exists
            existing_user = db.query(User).filter(User.email == doc_data["email"]).first()
            if existing_user:
                # Check if doctor record exists
                existing_doctor = db.query(Doctor).filter(Doctor.user_id == existing_user.id).first()
                if existing_doctor:
                    skipped_count += 1
                    continue
                else:
                    user_id = existing_user.id
            else:
                # Create user record
                new_user = User(
                    email=doc_data["email"],
                    mobile_no=doc_data["mobile"],
                    blood_group="O+",
                    password_hash=default_password_hash,
                    full_name=doc_data["name"],
                    role="doctor"
                )
                db.add(new_user)
                db.flush() # get new_user.id
                user_id = new_user.id

            # Create Doctor record
            new_doctor = Doctor(
                user_id=user_id,
                department_id=dept.id,
                specialization=doc_data["specialization"],
                qualification=doc_data["qualification"],
                license_number=doc_data["license"],
                experience_years=doc_data["experience"],
                availability={"days": "Mon - Fri", "hours": "09:00 AM - 04:30 PM"},
                status="Active"
            )
            db.add(new_doctor)
            inserted_count += 1

        db.commit()
        print(f"[OK] Seeding complete. Inserted: {inserted_count} new test doctors. Skipped: {skipped_count} existing doctors.")

        # Print total counts
        total_doctors = db.query(Doctor).count()
        print(f"[INFO] Total Doctors in Database: {total_doctors}")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error seeding test doctors: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_test_doctors()
