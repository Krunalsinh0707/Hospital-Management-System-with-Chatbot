import sys
import os
from datetime import datetime

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.database import SessionLocal
from src.models import Department, Doctor, User, Appointment

def run_tests():
    db = SessionLocal()
    try:
        # Find a test patient user (or default patient)
        patient = db.query(User).filter(User.role == "user").first()
        if not patient:
            patient = db.query(User).filter(User.role == "patient").first()

        if not patient:
            print("[ERROR] No patient user found in database for testing!")
            return

        print(f"[TEST] Using Patient: ID={patient.id}, Name='{patient.full_name}', Email='{patient.email}'")

        # Clear old test appointments for clean test run (optional, or insert new ones)
        # We will insert new appointments as requested
        
        test_depts = ["CARD", "ONCO", "ORTHO", "NEURO", "PULMO", "ENDO"]
        created_appointments = []

        for dept_code in test_depts:
            dept = db.query(Department).filter(Department.code == dept_code).first()
            if not dept:
                print(f"[SKIP] Department {dept_code} not found.")
                continue

            # Fetch doctor for this department
            doc = db.query(Doctor).filter(Doctor.department_id == dept.id).first()
            if not doc:
                print(f"[SKIP] No doctor found for {dept.name}.")
                continue

            # Create test appointment
            app_date = datetime(2026, 9, 15, 9, 0, 0)
            reason_text = f"Test appointment for {dept.name} workflow validation."

            new_app = Appointment(
                patient_id=patient.id,
                doctor_id=doc.id,
                department_id=dept.id,
                appointment_date=app_date,
                time_slot="09:00 AM",
                reason=reason_text,
                status="REQUESTED"
            )
            db.add(new_app)
            db.flush()
            created_appointments.append(new_app.id)

            print(f"[OK] Appointment created for {dept.name}: Appt ID={new_app.id}, Doctor='{doc.user.full_name}'")

        db.commit()
        print(f"\n[OK] Total {len(created_appointments)} test appointments created successfully.\n")

        # Perform relational verification query
        print("==========================================================")
        print("VERIFYING MYSQL DATABASE RELATIONSHIPS (JOIN QUERY)")
        print("==========================================================")

        results = db.query(
            Appointment.id,
            Appointment.patient_id,
            User.full_name.label("patient_name"),
            Appointment.doctor_id,
            Appointment.department_id,
            Department.name.label("department_name"),
            Appointment.appointment_date,
            Appointment.time_slot,
            Appointment.reason,
            Appointment.status
        ).join(
            User, Appointment.patient_id == User.id
        ).join(
            Department, Appointment.department_id == Department.id
        ).filter(
            Appointment.id.in_(created_appointments)
        ).all()

        for r in results:
            # Get doctor name
            doc_obj = db.query(Doctor).filter(Doctor.id == r.doctor_id).first()
            doc_name = doc_obj.user.full_name if doc_obj else "Unknown"

            print(f"ID: {r.id} | Patient: {r.patient_name} (ID: {r.patient_id}) | Dept: {r.department_name} (ID: {r.department_id}) | Doctor: {doc_name} (ID: {r.doctor_id}) | Date: {r.appointment_date.strftime('%Y-%m-%d')} | Slot: {r.time_slot} | Status: {r.status}")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Test execution failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
