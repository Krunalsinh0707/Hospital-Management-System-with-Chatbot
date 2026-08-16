from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from src.database import get_db
from src.models import Doctor, Department, User
from src.auth import get_current_user, get_current_admin, get_password_hash

router = APIRouter(prefix="/doctors", tags=["Doctors Management"])

class DoctorCreate(BaseModel):
    email: str
    password: str
    full_name: str
    mobile_no: str
    blood_group: str = "O+"
    department_id: int
    specialization: str
    qualification: str
    license_number: Optional[str] = None
    experience_years: int = 0

@router.get("")
def list_doctors(department_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Doctor).join(User, Doctor.user_id == User.id)
    if department_id:
        query = query.filter(Doctor.department_id == department_id)
    
    doctors = query.all()
    result = []
    for doc in doctors:
        dept = db.query(Department).filter(Department.id == doc.department_id).first()
        result.append({
            "id": doc.id,
            "user_id": doc.user_id,
            "full_name": doc.user.full_name,
            "email": doc.user.email,
            "mobile_no": doc.user.mobile_no,
            "department_id": doc.department_id,
            "department_name": dept.name if dept else "General",
            "specialization": doc.specialization,
            "qualification": doc.qualification,
            "license_number": doc.license_number,
            "experience_years": doc.experience_years,
            "status": doc.status
        })
    return result

@router.post("")
def create_doctor(data: DoctorCreate, db: Session = Depends(get_db), current_user=Depends(get_current_admin)):
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with email already exists")

    hashed_pw = get_password_hash(data.password)
    new_user = User(
        email=data.email,
        mobile_no=data.mobile_no,
        blood_group=data.blood_group,
        password_hash=hashed_pw,
        full_name=data.full_name,
        role="doctor"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    new_doctor = Doctor(
        user_id=new_user.id,
        department_id=data.department_id,
        specialization=data.specialization,
        qualification=data.qualification,
        license_number=data.license_number,
        experience_years=data.experience_years,
        status="Active"
    )
    db.add(new_doctor)
    db.commit()
    db.refresh(new_doctor)

    return {"message": "Doctor account created successfully", "doctor_id": new_doctor.id}

@router.get("/me")
def get_doctor_profile(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.user_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    
    dept = db.query(Department).filter(Department.id == doctor.department_id).first()
    return {
        "id": doctor.id,
        "user_id": doctor.user_id,
        "full_name": doctor.user.full_name,
        "email": doctor.user.email,
        "department_id": doctor.department_id,
        "department_name": dept.name if dept else "",
        "specialization": doctor.specialization,
        "qualification": doctor.qualification,
        "license_number": doctor.license_number,
        "experience_years": doctor.experience_years,
        "status": doctor.status
    }
