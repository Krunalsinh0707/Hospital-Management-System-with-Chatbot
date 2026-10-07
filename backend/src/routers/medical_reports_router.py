from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import os
import shutil
import json
import logging
from datetime import datetime

from src.database import get_db
from src.models import MedicalReport, ReportExtraction, AIAnalysis, DoctorReview, Doctor, Department, User, Notification, ReportReviewRequest
from src.auth import get_current_user
from src.pdf_service import extract_parameters_from_pdf
from src.ml.department_detector import detect_department
from src.security.rate_limiter import rate_limit
from src.security.file_security import validate_uploaded_file, sanitize_filename

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/medical-reports", tags=["Digital Medical Reports"])

class HospitalReportCreate(BaseModel):
    patient_id: int
    department_id: int
    report_title: str
    report_type: str
    findings: str
    parameters: dict

class DoctorReviewCreate(BaseModel):
    review_status: str # APPROVED, MODIFIED, REJECTED
    clinical_notes: Optional[str] = None
    final_assessment: Optional[str] = None
    corrected_parameters: Optional[dict] = None

class RequestReportReviewModel(BaseModel):
    doctor_id: Optional[int] = None
    notes: Optional[str] = None

@router.get("/my")
def get_my_reports(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    reports = db.query(MedicalReport).filter(MedicalReport.patient_id == current_user.user_id).order_by(MedicalReport.created_at.desc()).all()
    result = []
    for r in reports:
        dept = db.query(Department).filter(Department.id == r.department_id).first() if r.department_id else None
        doc = db.query(Doctor).filter(Doctor.id == r.doctor_id).first() if r.doctor_id else None
        doc_user = db.query(User).filter(User.id == doc.user_id).first() if doc else None
        
        ai = db.query(AIAnalysis).filter(AIAnalysis.report_id == r.id).first()
        review = db.query(DoctorReview).filter(DoctorReview.report_id == r.id).first()
        ext = db.query(ReportExtraction).filter(ReportExtraction.report_id == r.id).first()

        review_req = db.query(ReportReviewRequest).filter(
            ReportReviewRequest.report_id == r.id
        ).order_by(ReportReviewRequest.created_at.desc()).first()

        review_request_info = None
        if review_req:
            req_doc = db.query(Doctor).filter(Doctor.id == review_req.doctor_id).first()
            req_doc_user = db.query(User).filter(User.id == req_doc.user_id).first() if req_doc else None
            review_request_info = {
                "id": review_req.id,
                "status": review_req.status,
                "doctor_id": review_req.doctor_id,
                "doctor_name": f"Dr. {req_doc_user.full_name}" if req_doc_user else "Physician",
                "notes": review_req.notes,
                "created_at": review_req.created_at.strftime("%Y-%m-%d %H:%M") if review_req.created_at else "",
                "completed_at": review_req.completed_at.strftime("%Y-%m-%d %H:%M") if review_req.completed_at else ""
            }

        result.append({
            "id": r.id,
            "report_source": r.report_source,
            "report_title": r.report_title,
            "report_type": r.report_type,
            "report_date": r.report_date.strftime("%Y-%m-%d") if r.report_date else (r.created_at.strftime("%Y-%m-%d") if r.created_at else ""),
            "department_name": dept.name if dept else "General",
            "department_id": r.department_id,
            "doctor_id": r.doctor_id,
            "doctor_name": doc_user.full_name if doc_user else "Hospital Medical Staff",
            "status": r.status,
            "original_filename": r.original_filename,
            "extracted_parameters": ext.extracted_json if ext and ext.extracted_json else {},
            "ai_analysis": {
                "prediction": ai.prediction,
                "probability": ai.probability,
                "risk_level": ai.risk_level,
                "important_factors": ai.important_factors,
                "explanation": ai.explanation
            } if ai else None,
            "doctor_review": {
                "review_status": review.review_status,
                "clinical_notes": review.clinical_notes,
                "final_assessment": review.final_assessment,
                "reviewed_at": review.reviewed_at.strftime("%Y-%m-%d %H:%M")
            } if review else None,
            "review_request": review_request_info
        })
    return result

@router.post("/upload")
async def upload_existing_report(
    file: UploadFile = File(...),
    report_title: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    _limiter: None = Depends(rate_limit(max_requests=10, window_seconds=60, prefix="report_upload"))
):
    # Validate uploaded file for MIME type, magic bytes, and size limit
    content = await validate_uploaded_file(file, max_size_bytes=10 * 1024 * 1024)
    safe_filename = sanitize_filename(file.filename, prefix=f"user_{current_user.user_id}_")

    os.makedirs("uploads/reports", exist_ok=True)
    file_path = os.path.join("uploads/reports", safe_filename)

    with open(file_path, "wb") as buffer:
        buffer.write(content)

    title = (report_title or file.filename or "Uploaded Report").strip()[:150]

    # Create Medical Report record
    new_report = MedicalReport(
        patient_id=current_user.user_id,
        report_source="existing_upload",
        report_title=title,
        report_type="Uploaded Diagnostic Report",
        original_filename=file.filename[:255] if file.filename else safe_filename,
        file_path=file_path,
        status="UPLOADED"
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    # Run OCR & Structured Data Extraction
    extracted_data = {}
    raw_text = ""
    try:
        if safe_filename.lower().endswith(".pdf"):
            extracted_data = extract_parameters_from_pdf(file_path)
            raw_text = json.dumps(extracted_data)
        else:
            raw_text = "Image report upload"
    except Exception as e:
        logger.warning(f"[OCR] Extraction warning: {e}")

    extraction = ReportExtraction(
        report_id=new_report.id,
        ocr_raw_text=raw_text,
        extracted_json=extracted_data,
        validation_status="VALID" if extracted_data else "NEEDS_REVIEW",
        confidence_score=0.92 if extracted_data else 0.50
    )
    db.add(extraction)
    new_report.status = "OCR_EXTRACTED"

    # Route to relevant department using deterministic keyword detection
    dept_slug = detect_department(extracted_data, raw_text)
    dept = db.query(Department).filter(Department.code == dept_slug.upper()[:6]).first()
    if not dept:
        dept = db.query(Department).filter(Department.name.ilike(f"%{dept_slug}%")).first()

    if dept:
        new_report.department_id = dept.id

    new_report.status = "READY_FOR_REVIEW"
    db.commit()

    return {
        "message": "Report uploaded and extracted successfully",
        "report_id": new_report.id,
        "extracted_parameters": extracted_data
    }

@router.post("/hospital")
def create_hospital_report(data: HospitalReportCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.user_id).first()
    if not doctor and current_user.role not in ['admin', 'hospital_admin']:
        raise HTTPException(status_code=403, detail="Doctor access required")

    patient = db.query(User).filter(User.id == data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Target patient account not found")

    dept = db.query(Department).filter(Department.id == data.department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    doc_id = doctor.id if doctor else None

    new_report = MedicalReport(
        patient_id=data.patient_id,
        doctor_id=doc_id,
        department_id=data.department_id,
        report_source="hospital",
        report_title=data.report_title[:150],
        report_type=data.report_type[:100],
        status="DOCTOR_REVIEWED"
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    # Doctor Review record
    review = DoctorReview(
        report_id=new_report.id,
        doctor_id=doc_id or 1,
        review_status="APPROVED",
        clinical_notes=data.findings,
        final_assessment=f"Hospital Report Generated: {data.report_title}"
    )
    db.add(review)
    new_report.status = "FINALIZED"

    # Notify patient
    notif = Notification(
        user_id=data.patient_id,
        title="New Hospital Medical Report",
        message=f"New report '{data.report_title}' has been generated by your doctor.",
        type="REPORT"
    )
    db.add(notif)

    db.commit()
    return {"message": "Hospital report created successfully", "report_id": new_report.id}

@router.get("/doctor/queue")
def get_reports_pending_review(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    user_role = (current_user.role or "").lower()
    if user_role not in ['doctor', 'emergency_doctor', 'admin', 'hospital_admin']:
        raise HTTPException(status_code=403, detail="Doctor or admin privileges required")

    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.user_id).first()
    
    query = db.query(MedicalReport).filter(MedicalReport.status.in_(["READY_FOR_REVIEW", "AI_PRE_ANALYZED", "UPLOADED", "OCR_EXTRACTED"]))
    if doctor and doctor.department_id:
        query = query.filter(MedicalReport.department_id == doctor.department_id)

    reports = query.order_by(MedicalReport.created_at.desc()).all()
    result = []
    for r in reports:
        patient = db.query(User).filter(User.id == r.patient_id).first()
        ext = db.query(ReportExtraction).filter(ReportExtraction.report_id == r.id).first()
        ai = db.query(AIAnalysis).filter(AIAnalysis.report_id == r.id).first()
        result.append({
            "id": r.id,
            "patient_id": r.patient_id,
            "patient_name": patient.full_name if patient else "Patient",
            "patient_email": patient.email if patient else "",
            "report_title": r.report_title,
            "report_type": r.report_type,
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M"),
            "status": r.status,
            "extracted_json": ext.extracted_json if ext else {},
            "ai_analysis": {
                "model_name": ai.model_name,
                "prediction": ai.prediction,
                "probability": ai.probability,
                "risk_level": ai.risk_level,
                "important_factors": ai.important_factors,
                "explanation": ai.explanation
            } if ai else None
        })
    return result

@router.get("/patient/{patient_id}")
def get_patient_reports_for_doctor(patient_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    user_role = (current_user.role or "").lower()
    if user_role in ['patient', 'user'] and current_user.user_id != patient_id:
        raise HTTPException(status_code=403, detail="Access denied: Cannot access another patient's reports")

    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.user_id).first()
    if not doctor and user_role not in ['admin', 'hospital_admin', 'doctor', 'emergency_doctor'] and current_user.user_id != patient_id:
        raise HTTPException(status_code=403, detail="Clinical authorization required")

    reports = db.query(MedicalReport).filter(MedicalReport.patient_id == patient_id).order_by(MedicalReport.created_at.desc()).all()
    result = []
    for r in reports:
        dept = db.query(Department).filter(Department.id == r.department_id).first() if r.department_id else None
        doc = db.query(Doctor).filter(Doctor.id == r.doctor_id).first() if r.doctor_id else None
        doc_user = db.query(User).filter(User.id == doc.user_id).first() if doc else None
        ai = db.query(AIAnalysis).filter(AIAnalysis.report_id == r.id).first()
        review = db.query(DoctorReview).filter(DoctorReview.report_id == r.id).first()
        ext = db.query(ReportExtraction).filter(ReportExtraction.report_id == r.id).first()

        result.append({
            "id": r.id,
            "report_source": r.report_source,
            "report_title": r.report_title,
            "report_type": r.report_type,
            "report_date": r.report_date.strftime("%Y-%m-%d") if r.report_date else "",
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else "",
            "department_name": dept.name if dept else "General",
            "doctor_name": doc_user.full_name if doc_user else "Hospital Medical Staff",
            "status": r.status,
            "original_filename": r.original_filename,
            "extracted_parameters": ext.extracted_json if ext and ext.extracted_json else {},
            "ai_analysis": {
                "model_name": ai.model_name,
                "prediction": ai.prediction,
                "probability": ai.probability,
                "risk_level": ai.risk_level,
                "important_factors": ai.important_factors,
                "explanation": ai.explanation
            } if ai else None,
            "doctor_review": {
                "review_status": review.review_status,
                "clinical_notes": review.clinical_notes,
                "final_assessment": review.final_assessment,
                "reviewed_at": review.reviewed_at.strftime("%Y-%m-%d %H:%M") if review.reviewed_at else ""
            } if review else None
        })
    return result


@router.post("/{report_id}/review")
def review_report(report_id: int, review_data: DoctorReviewCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.user_id).first()
    if not doctor and current_user.role not in ['admin', 'hospital_admin']:
        raise HTTPException(status_code=403, detail="Doctor privileges required for clinical review")

    report = db.query(MedicalReport).filter(MedicalReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Medical report not found")

    existing_review = db.query(DoctorReview).filter(DoctorReview.report_id == report_id).first()
    if existing_review:
        existing_review.review_status = review_data.review_status
        existing_review.clinical_notes = review_data.clinical_notes
        existing_review.final_assessment = review_data.final_assessment
    else:
        new_review = DoctorReview(
            report_id=report_id,
            doctor_id=doctor.id if doctor else 1,
            review_status=review_data.review_status,
            clinical_notes=review_data.clinical_notes,
            final_assessment=review_data.final_assessment
        )
        db.add(new_review)

    report.status = "DOCTOR_REVIEWED" if review_data.review_status == "APPROVED" else "FINALIZED"
    report.doctor_id = doctor.id if doctor else report.doctor_id

    # Mark any pending ReportReviewRequest as COMPLETED
    from src.models import ReportReviewRequest
    pending_reqs = db.query(ReportReviewRequest).filter(
        ReportReviewRequest.report_id == report_id,
        ReportReviewRequest.status == "PENDING"
    ).all()
    for pr in pending_reqs:
        pr.status = "COMPLETED"
        pr.completed_at = datetime.utcnow()

    # Notify patient
    notif = Notification(
        user_id=report.patient_id,
        title="Medical Report Reviewed by Doctor",
        message=f"Your report '{report.report_title}' has been reviewed and signed by Dr. {doctor.user.full_name if doctor else 'Specialist'}.",
        type="REPORT"
    )
    db.add(notif)

    db.commit()
    return {"message": "Doctor review finalized successfully"}


@router.post("/{report_id}/request-review")
def request_report_review(
    report_id: int, 
    data: Optional[RequestReportReviewModel] = None, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    from src.clinical_chat.clinical_actions import create_report_review_request
    doc_id = data.doctor_id if data else None
    notes = data.notes if data else None
    res = create_report_review_request(db, current_user.user_id, report_id, doc_id, notes)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("message", "Failed to submit report for review"))
    return res

