from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from src.database import get_db
from src.models import PatientDoctorMessage, Doctor, User, Appointment, Notification
from src.auth import get_current_user
from src.security.rate_limiter import rate_limit

router = APIRouter(prefix="/communications", tags=["Patient-Doctor Messaging"])

class MessageSend(BaseModel):
    doctor_id: int
    patient_id: Optional[int] = None
    appointment_id: Optional[int] = None
    message: str

@router.post("")
def send_message(
    data: MessageSend,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    _limiter: None = Depends(rate_limit(max_requests=30, window_seconds=60, prefix="comm_msg"))
):
    doctor = db.query(Doctor).filter(Doctor.id == data.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    user_role = (current_user.role or "").lower()

    if user_role in ["patient", "user"]:
        # A patient cannot spoof another patient's ID
        patient_id = current_user.user_id
    elif doctor.user_id == current_user.user_id:
        # Doctor sending to a patient
        if not data.patient_id:
            raise HTTPException(status_code=400, detail="Target patient_id is required")
        patient_id = data.patient_id
    elif user_role in ["admin", "hospital_admin"]:
        patient_id = data.patient_id or current_user.user_id
    else:
        raise HTTPException(status_code=403, detail="Not authorized to send communication message")

    target_patient = db.query(User).filter(User.id == patient_id).first()
    if not target_patient:
        raise HTTPException(status_code=404, detail="Patient record not found")

    msg_text = (data.message or "").strip()[:2000]
    if not msg_text:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    new_msg = PatientDoctorMessage(
        appointment_id=data.appointment_id,
        patient_id=patient_id,
        doctor_id=data.doctor_id,
        sender_id=current_user.user_id,
        message=msg_text
    )
    db.add(new_msg)

    recipient_id = doctor.user_id if current_user.user_id != doctor.user_id else patient_id
    db.add(Notification(
        user_id=recipient_id,
        title="New Healthcare Message",
        message=f"You received a new message regarding your consultation.",
        type="CHAT"
    ))

    db.commit()
    return {"message": "Message sent successfully"}

@router.get("/doctor/{doctor_id}")
def get_conversation_with_doctor(doctor_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    messages = db.query(PatientDoctorMessage).filter(
        PatientDoctorMessage.patient_id == current_user.user_id,
        PatientDoctorMessage.doctor_id == doctor_id
    ).order_by(PatientDoctorMessage.created_at.asc()).all()

    result = []
    for m in messages:
        sender = db.query(User).filter(User.id == m.sender_id).first()
        result.append({
            "id": m.id,
            "sender_id": m.sender_id,
            "sender_name": sender.full_name if sender else "User",
            "message": m.message,
            "is_me": m.sender_id == current_user.user_id,
            "created_at": m.created_at.strftime("%H:%M, %b %d")
        })
    return result

@router.get("/patient/{patient_id}")
def get_conversation_with_patient(patient_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.user_id).first()
    if not doctor:
        raise HTTPException(status_code=403, detail="Doctor profile required")

    messages = db.query(PatientDoctorMessage).filter(
        PatientDoctorMessage.patient_id == patient_id,
        PatientDoctorMessage.doctor_id == doctor.id
    ).order_by(PatientDoctorMessage.created_at.asc()).all()

    result = []
    for m in messages:
        sender = db.query(User).filter(User.id == m.sender_id).first()
        result.append({
            "id": m.id,
            "sender_id": m.sender_id,
            "sender_name": sender.full_name if sender else "User",
            "message": m.message,
            "is_me": m.sender_id == current_user.user_id,
            "created_at": m.created_at.strftime("%H:%M, %b %d")
        })
    return result
