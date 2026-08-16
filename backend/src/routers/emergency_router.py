from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from src.database import get_db
from src.models import EmergencyRequest, Doctor, User, Notification
from src.auth import get_current_user

router = APIRouter(prefix="/emergency", tags=["Emergency System"])

class EmergencyCreate(BaseModel):
    severity: str = "HIGH" # LOW, MEDIUM, HIGH, CRITICAL
    symptoms: Optional[str] = None
    location: Optional[str] = None
    contact_phone: Optional[str] = None

class EmergencyStatusUpdate(BaseModel):
    status: str # ACKNOWLEDGED, ASSIGNED, IN_REVIEW, IN_TREATMENT, RESOLVED, CANCELLED
    doctor_id: Optional[int] = None

@router.post("/request")
def trigger_emergency(data: EmergencyCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    user = db.query(User).filter(User.id == current_user.user_id).first()
    
    request = EmergencyRequest(
        patient_id=current_user.user_id,
        severity=data.severity,
        status="REQUESTED",
        symptoms=data.symptoms or "Patient initiated urgent emergency trigger",
        location=data.location or "Patient Current Location",
        contact_phone=data.contact_phone or (user.mobile_no if user else "")
    )
    db.add(request)
    
    # Notify emergency doctors & admins
    emergency_docs = db.query(Doctor).join(User, Doctor.user_id == User.id).filter(User.role.in_(["emergency_doctor", "hospital_admin", "admin"])).all()
    for doc in emergency_docs:
        db.add(Notification(
            user_id=doc.user_id,
            title="🔴 EMERGENCY ALERT TRIGGERED",
            message=f"Urgent emergency from patient {user.full_name if user else ''}. Symptoms: {data.symptoms}",
            type="EMERGENCY"
        ))

    db.commit()
    db.refresh(request)
    return {"message": "Emergency request initiated. Response team notified.", "emergency_id": request.id}

@router.get("/queue")
def get_emergency_queue(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    requests = db.query(EmergencyRequest).filter(EmergencyRequest.status != "RESOLVED").order_by(EmergencyRequest.created_at.desc()).all()
    result = []
    for r in requests:
        patient = db.query(User).filter(User.id == r.patient_id).first()
        doc = db.query(Doctor).filter(Doctor.id == r.assigned_doctor_id).first() if r.assigned_doctor_id else None
        doc_user = db.query(User).filter(User.id == doc.user_id).first() if doc else None

        result.append({
            "id": r.id,
            "patient_id": r.patient_id,
            "patient_name": patient.full_name if patient else "Patient",
            "patient_mobile": patient.mobile_no if patient else "",
            "patient_blood_group": patient.blood_group if patient else "",
            "severity": r.severity,
            "status": r.status,
            "symptoms": r.symptoms,
            "location": r.location,
            "assigned_doctor": doc_user.full_name if doc_user else "Unassigned",
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M:%S")
        })
    return result

@router.put("/{emergency_id}/status")
def update_emergency_status(emergency_id: int, update: EmergencyStatusUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    req = db.query(EmergencyRequest).filter(EmergencyRequest.id == emergency_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Emergency request not found")

    req.status = update.status
    if update.doctor_id:
        req.assigned_doctor_id = update.doctor_id
    if update.status == "RESOLVED":
        req.resolved_at = datetime.now()

    # Notify patient
    db.add(Notification(
        user_id=req.patient_id,
        title="Emergency Request Status Update",
        message=f"Your emergency request status is now: {update.status}.",
        type="EMERGENCY"
    ))

    db.commit()
    return {"message": f"Emergency status updated to {update.status}"}
