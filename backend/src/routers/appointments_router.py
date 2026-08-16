from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from src.database import get_db
from src.models import Appointment, Doctor, Department, User, Notification
from src.auth import get_current_user

router = APIRouter(prefix="/appointments", tags=["Appointments"])

class AppointmentCreate(BaseModel):
    doctor_id: int
    department_id: Optional[int] = None
    appointment_date: str # ISO format string e.g. "2026-08-15 10:00:00"
    time_slot: str
    reason: Optional[str] = None

class AppointmentStatusUpdate(BaseModel):
    status: str # CONFIRMED, REJECTED, CANCELLED, COMPLETED
    notes: Optional[str] = None

@router.post("")
def book_appointment(data: AppointmentCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    doctor = db.query(Doctor).filter(Doctor.id == data.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    try:
        app_date = datetime.fromisoformat(data.appointment_date.replace("Z", "+00:00"))
    except Exception:
        app_date = datetime.now()

    new_app = Appointment(
        patient_id=current_user.user_id,
        doctor_id=data.doctor_id,
        department_id=data.department_id or doctor.department_id,
        appointment_date=app_date,
        time_slot=data.time_slot,
        reason=data.reason,
        status="REQUESTED"
    )
    db.add(new_app)
    
    # Send notification to Doctor
    notif = Notification(
        user_id=doctor.user_id,
        title="New Appointment Request",
        message=f"New appointment request from patient for {data.time_slot}.",
        type="APPOINTMENT"
    )
    db.add(notif)

    db.commit()
    db.refresh(new_app)
    return {"message": "Appointment requested successfully", "appointment_id": new_app.id}

@router.get("/my")
def get_patient_appointments(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    appointments = db.query(Appointment).filter(Appointment.patient_id == current_user.user_id).order_by(Appointment.appointment_date.desc()).all()
    result = []
    for app in appointments:
        doc = db.query(Doctor).filter(Doctor.id == app.doctor_id).first()
        doc_user = db.query(User).filter(User.id == doc.user_id).first() if doc else None
        dept = db.query(Department).filter(Department.id == app.department_id).first()
        result.append({
            "id": app.id,
            "doctor_name": doc_user.full_name if doc_user else "Doctor",
            "specialization": doc.specialization if doc else "",
            "department_name": dept.name if dept else "General",
            "appointment_date": app.appointment_date.strftime("%Y-%m-%d %H:%M"),
            "time_slot": app.time_slot,
            "reason": app.reason,
            "status": app.status,
            "notes": app.notes
        })
    return result

@router.get("/doctor")
def get_doctor_appointments(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.user_id).first()
    if not doctor and current_user.role not in ['admin', 'hospital_admin']:
        raise HTTPException(status_code=403, detail="Doctor profile required")

    query = db.query(Appointment)
    if doctor:
        query = query.filter(Appointment.doctor_id == doctor.id)

    appointments = query.order_by(Appointment.appointment_date.desc()).all()
    result = []
    for app in appointments:
        patient = db.query(User).filter(User.id == app.patient_id).first()
        result.append({
            "id": app.id,
            "patient_id": app.patient_id,
            "patient_name": patient.full_name if patient else "Patient",
            "patient_email": patient.email if patient else "",
            "patient_mobile": patient.mobile_no if patient else "",
            "appointment_date": app.appointment_date.strftime("%Y-%m-%d %H:%M"),
            "time_slot": app.time_slot,
            "reason": app.reason,
            "status": app.status,
            "notes": app.notes
        })
    return result

@router.put("/{appointment_id}/status")
def update_appointment_status(appointment_id: int, update: AppointmentStatusUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    app = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Appointment not found")

    app.status = update.status
    if update.notes:
        app.notes = update.notes

    # Notify patient
    notif = Notification(
        user_id=app.patient_id,
        title=f"Appointment {update.status.title()}",
        message=f"Your appointment status has been updated to {update.status}.",
        type="APPOINTMENT"
    )
    db.add(notif)

    db.commit()
    return {"message": f"Appointment status updated to {update.status}"}
