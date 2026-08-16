from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from src.database import get_db
from src.models import User, Doctor, Department, Appointment, MedicalReport, EmergencyRequest, AIAnalysis
from src.auth import get_current_user, get_current_admin

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/patient")
def get_patient_analytics(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    user_id = current_user.user_id
    total_reports = db.query(MedicalReport).filter(MedicalReport.patient_id == user_id).count()
    total_appointments = db.query(Appointment).filter(Appointment.patient_id == user_id).count()
    
    recent_reports = db.query(MedicalReport).filter(MedicalReport.patient_id == user_id).order_by(MedicalReport.created_at.desc()).limit(5).all()
    
    risk_summary = {"LOW": 0, "MODERATE": 0, "HIGH": 0, "CRITICAL": 0}
    for r in recent_reports:
        ai = db.query(AIAnalysis).filter(AIAnalysis.report_id == r.id).first()
        if ai and ai.risk_level:
            risk_summary[ai.risk_level] = risk_summary.get(ai.risk_level, 0) + 1

    return {
        "total_reports": total_reports,
        "total_appointments": total_appointments,
        "risk_summary": risk_summary,
        "health_trend": [
            {"date": r.created_at.strftime("%b %d"), "report": r.report_title}
            for r in recent_reports
        ]
    }

@router.get("/hospital")
def get_hospital_analytics(db: Session = Depends(get_db), current_user=Depends(get_current_admin)):
    total_patients = db.query(User).filter(User.role.in_(["user", "patient"])).count()
    total_doctors = db.query(Doctor).filter(Doctor.status == "Active").count()
    total_departments = db.query(Department).count()
    total_appointments = db.query(Appointment).count()
    total_reports = db.query(MedicalReport).count()
    pending_emergency = db.query(EmergencyRequest).filter(EmergencyRequest.status != "RESOLVED").count()

    dept_breakdown = []
    departments = db.query(Department).all()
    for d in departments:
        doc_count = db.query(Doctor).filter(Doctor.department_id == d.id).count()
        app_count = db.query(Appointment).filter(Appointment.department_id == d.id).count()
        dept_breakdown.append({
            "name": d.name,
            "doctors": doc_count,
            "appointments": app_count
        })

    return {
        "total_patients": total_patients,
        "total_doctors": total_doctors,
        "total_departments": total_departments,
        "total_appointments": total_appointments,
        "total_reports": total_reports,
        "pending_emergency": pending_emergency,
        "departments_breakdown": dept_breakdown
    }
