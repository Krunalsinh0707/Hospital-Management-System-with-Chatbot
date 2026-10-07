from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from src.database import get_db
from src.models import Department, Doctor, User
from src.auth import get_current_user, get_current_admin

router = APIRouter(prefix="/departments", tags=["Hospital Departments"])

DEPARTMENT_DETAILS_MAP: Dict[str, Dict[str, Any]] = {
    "cardiology": {
        "slug": "cardiology",
        "name": "Cardiology",
        "code": "CARD",
        "icon": "Heart",
        "specialization": "Cardiovascular Healthcare & Cardiac Assessment",
        "description": "Cardiovascular risk, resting blood pressure & ECG pre-analysis.",
        "detailed_overview": "The Cardiology Department focuses on non-invasive evaluation, clinical monitoring, and risk assessment of cardiovascular health. It supports lipid analysis, blood pressure classification, and ECG parameter pre-analysis.",
        "status": "Available",
        "services": [
            {"name": "ECG Assessment", "available": True, "description": "Electrocardiogram pre-analysis and rhythm parameter verification."},
            {"name": "Cardiac Risk Assessment", "available": True, "description": "Machine-learning evaluation of cardiovascular disease indicators."},
            {"name": "Blood Pressure Monitoring", "available": True, "description": "Hypertension tracking, diastolic & systolic range classification."},
            {"name": "Heart Health Evaluation", "available": True, "description": "Holistic clinical summary of cardiac vitals and history."}
        ],
        "supported_reports": ["ECG Records", "Cardiac Risk Assessment", "Blood Pressure Logs", "Lipid Profile Panels"],
        "supported_analysis": ["Resting blood pressure", "Cholesterol & LDL levels", "Heart rate metrics", "Exercise-induced angina signals", "ST depression indicators"]
    },
    "neurology": {
        "slug": "neurology",
        "name": "Neurology",
        "code": "NEURO",
        "icon": "Brain",
        "specialization": "Brain, Nervous System & Cognitive Health",
        "description": "Cognitive parameters & neurological risk support.",
        "detailed_overview": "The Neurology Department provides comprehensive evaluation of central and peripheral nervous system health, cognitive function, and neurological vital indicators.",
        "status": "Doctor Review",
        "services": [
            {"name": "Cognitive Screening", "available": True, "description": "Assessment of cognitive indicators and neurological history."},
            {"name": "Neuro-Vascular Assessment", "available": True, "description": "Evaluation of cerebral circulation parameters."},
            {"name": "Nerve Conduction Review", "available": False, "description": "Specialized electrophysiological testing (Doctor referral)."}
        ],
        "supported_reports": ["Neurological Assessment", "EEG Records", "Cognitive Function Tests", "MRI/CT Scan Diagnostics"],
        "supported_analysis": ["Cognitive parameter logs", "Neurological symptom screening", "Cerebrovascular risk metrics"]
    },
    "orthopedics": {
        "slug": "orthopedics",
        "name": "Orthopedics",
        "code": "ORTHO",
        "icon": "Bone",
        "specialization": "Bones, Joints & Musculoskeletal System",
        "description": "Bone density, joint parameters & structural imaging.",
        "detailed_overview": "The Orthopedics Department specializes in musculoskeletal health, bone mineral density assessment, joint alignment, and arthritis screening.",
        "status": "Doctor Review",
        "services": [
            {"name": "Bone Density Screening", "available": True, "description": "Evaluation of bone mineral density and osteoporosis risk."},
            {"name": "Joint Health Assessment", "available": True, "description": "Structural joint mobility and inflammation parameter tracking."},
            {"name": "Spine & Posture Review", "available": True, "description": "Clinical assessment of spinal curvature and posture metrics."}
        ],
        "supported_reports": ["X-Ray Imaging Reports", "DEXA Bone Density Scan", "Joint MRI Reports", "Musculoskeletal Vitals"],
        "supported_analysis": ["Bone mineral density T-scores", "Joint inflammation markers", "Structural skeletal vitals"]
    },
    "pulmonology": {
        "slug": "pulmonology",
        "name": "Pulmonology",
        "code": "PULMO",
        "icon": "Wind",
        "specialization": "Respiratory System & Lung Health",
        "description": "Respiratory panels, SpO2 & chest radiograph support.",
        "detailed_overview": "The Pulmonology Department evaluates pulmonary function, oxygen saturation (SpO2), airway resistance, and chest imaging indicators.",
        "status": "Doctor Review",
        "services": [
            {"name": "SpO2 & Oxygen Saturation Monitoring", "available": True, "description": "Continuous and spot blood oxygen level tracking."},
            {"name": "Pulmonary Function Screening", "available": True, "description": "Spirometry and lung capacity parameter evaluation."},
            {"name": "Chest Radiography Pre-Screening", "available": True, "description": "AI-assisted chest X-ray image pre-analysis."}
        ],
        "supported_reports": ["Spirometry Test Results", "Chest X-Ray Reports", "Blood Gas Analysis", "Pulse Oximetry Logs"],
        "supported_analysis": ["FEV1/FVC ratios", "Oxygen saturation %", "Respiration rate", "Chest radiograph anomaly flags"]
    },
    "oncology": {
        "slug": "oncology",
        "name": "Oncology",
        "code": "ONCO",
        "icon": "Dna",
        "specialization": "Tumor Markers & Biostatistical Screening",
        "description": "Biostatistical tumor markers & oncological screening.",
        "detailed_overview": "The Oncology Department integrates laboratory tumor marker tracking, histological report extraction, and biostatistical risk evaluation for cancer care support.",
        "status": "Doctor Review",
        "services": [
            {"name": "Tumor Marker Panel Review", "available": True, "description": "Tracking serum tumor markers and laboratory indicators."},
            {"name": "Biostatistical Screening", "available": True, "description": "Risk stratification based on clinical history and lab markers."},
            {"name": "Oncological Pathology Review", "available": True, "description": "Pathology report extraction and doctor validation pipeline."}
        ],
        "supported_reports": ["Tumor Marker Blood Tests", "Pathology & Biopsy Reports", "PET/CT Imaging Diagnostics", "Oncology Clinical History"],
        "supported_analysis": ["PSA, CEA, CA-125 biomarker levels", "Histopathology extraction metrics", "Risk trend history"]
    },
    "endocrinology": {
        "slug": "endocrinology",
        "name": "Endocrinology",
        "code": "ENDO",
        "icon": "Activity",
        "specialization": "Metabolic Health, Diabetes & Hormonal Systems",
        "description": "Glucose vector, insulin sensitivity & metabolic screening.",
        "detailed_overview": "The Endocrinology Department focuses on metabolic wellness, plasma glucose vector analysis, HbA1c monitoring, insulin sensitivity, and thyroid function evaluation.",
        "status": "Available",
        "services": [
            {"name": "Diabetes Vector Assessment", "available": True, "description": "Machine-learning pre-analysis of plasma glucose and insulin response."},
            {"name": "HbA1c & Glycemic Control", "available": True, "description": "Long-term blood sugar trend and metabolic risk analysis."},
            {"name": "Thyroid Function Screening", "available": True, "description": "TSH, T3, and T4 hormone level parameter tracking."}
        ],
        "supported_reports": ["HbA1c & Glucose Panels", "Thyroid Profile Reports", "Lipid & Metabolic Panels", "Insulin Sensitivity Tests"],
        "supported_analysis": ["Fasting & postprandial glucose", "BMI & insulin parameters", "Pedigree score metrics", "TSH hormone levels"]
    },
    "hematology": {
        "slug": "hematology",
        "name": "Hematology",
        "code": "HEMA",
        "icon": "Droplets",
        "specialization": "Blood Panels & Hematologic Diagnostics",
        "description": "Complete Blood Count (CBC), hemoglobin & platelet panels.",
        "detailed_overview": "The Hematology Department analyzes blood composition, red and white cell counts, hemoglobin concentrations, platelet levels, and coagulation profiles.",
        "status": "Available",
        "services": [
            {"name": "Complete Blood Count (CBC) Analysis", "available": True, "description": "Automated ML pre-analysis for anemia, infection, and blood health."},
            {"name": "Hemoglobin & Iron Profile", "available": True, "description": "Iron deficiency and oxygen-carrying capacity evaluation."},
            {"name": "Coagulation & Platelet Panel", "available": True, "description": "Platelet counts and blood clotting parameter tracking."}
        ],
        "supported_reports": ["Complete Blood Count (CBC)", "Hemoglobin Test", "Platelet Count Report", "Iron & Ferritin Panel"],
        "supported_analysis": ["Hemoglobin (g/dL)", "WBC count (/µL)", "RBC count (million/µL)", "Platelets (/µL)", "MCV & Hematocrit %"]
    },
    "gastroenterology": {
        "slug": "gastroenterology",
        "name": "Gastroenterology",
        "code": "GASTRO",
        "icon": "Stethoscope",
        "specialization": "Digestive System & Hepatic Health",
        "description": "Digestive enzyme panels & hepatic function support.",
        "detailed_overview": "The Gastroenterology Department addresses gastrointestinal wellness, liver enzyme panels (ALT/AST), gallbladder health, and digestive function.",
        "status": "Doctor Review",
        "services": [
            {"name": "Liver Function Panel (LFT)", "available": True, "description": "Bilirubin, ALT, AST, and alkaline phosphatase evaluation."},
            {"name": "Digestive Health Screening", "available": True, "description": "Gastrointestinal symptom and enzyme tracking."},
            {"name": "Endoscopic Imaging Support", "available": False, "description": "Specialized endoscopic procedure review (Doctor referral)."}
        ],
        "supported_reports": ["Liver Function Test (LFT)", "Stool & Digestive Panels", "Abdominal Ultrasound Reports", "GI Endoscopy Notes"],
        "supported_analysis": ["Bilirubin & ALT/AST ratios", "Digestive enzyme levels", "Hepatic vitals"]
    },
    "nephrology": {
        "slug": "nephrology",
        "name": "Nephrology",
        "code": "NEPHRO",
        "icon": "Activity",
        "specialization": "Renal Function & Electrolyte Balance",
        "description": "Renal filtration rates & electrolyte balance tracking.",
        "detailed_overview": "The Nephrology Department provides monitoring of kidney health, estimated glomerular filtration rate (eGFR), serum creatinine, urea nitrogen, and electrolyte equilibrium.",
        "status": "Coming Soon",
        "services": [
            {"name": "Renal Function Panel (KFT)", "available": True, "description": "Creatinine, blood urea nitrogen (BUN), and eGFR analysis."},
            {"name": "Electrolyte Balance Review", "available": True, "description": "Sodium, potassium, and chloride ion concentration tracking."},
            {"name": "Urinalysis Screening", "available": True, "description": "Urine protein, albumin, and microfiltration indicators."}
        ],
        "supported_reports": ["Kidney Function Test (KFT)", "Serum Creatinine Reports", "Electrolyte Panel", "24-Hour Urinalysis"],
        "supported_analysis": ["Serum Creatinine & BUN", "eGFR filtration rate", "Potassium & Sodium levels", "Urinary protein ratio"]
    },
    "dermatology": {
        "slug": "dermatology",
        "name": "Dermatology",
        "code": "DERM",
        "icon": "Shield",
        "specialization": "Skin Health & Cutaneous Tissue Diagnostics",
        "description": "Dermatological lesion categorization & tissue support.",
        "detailed_overview": "The Dermatology Department covers skin condition analysis, dermoscopy image pre-evaluation, rash identification, and lesion monitoring.",
        "status": "Doctor Review",
        "services": [
            {"name": "Skin Lesion Screening", "available": True, "description": "Visual dermoscopic pre-categorization of skin anomalies."},
            {"name": "Cutaneous Tissue Assessment", "available": True, "description": "Dermatological symptom and rash parameter logging."},
            {"name": "Allergy & Patch Test Review", "available": True, "description": "Cutaneous hypersensitivity and contact allergen tracking."}
        ],
        "supported_reports": ["Dermatology Exam Notes", "Skin Biopsy Reports", "Dermoscopy Imaging", "Allergy Patch Test Results"],
        "supported_analysis": ["Lesion asymmetry & color variance", "Cutaneous symptom score", "Tissue biopsy extraction"]
    },
    "pediatrics": {
        "slug": "pediatrics",
        "name": "Pediatrics",
        "code": "PEDI",
        "icon": "User",
        "specialization": "Pediatric Medicine & Child Growth Milestones",
        "description": "Pediatric growth milestones & vital thresholds.",
        "detailed_overview": "The Pediatrics Department offers age-adjusted vital parameter checking, developmental milestone tracking, and pediatric immunization records.",
        "status": "Doctor Review",
        "services": [
            {"name": "Pediatric Vital Threshold Check", "available": True, "description": "Age-appropriate heart rate, respiration, and temperature evaluation."},
            {"name": "Growth & Percentile Tracking", "available": True, "description": "Height, weight, and head circumference growth curve plotting."},
            {"name": "Immunization Schedule Management", "available": True, "description": "Vaccination history and pediatric booster tracking."}
        ],
        "supported_reports": ["Pediatric Growth Chart", "Child Immunization Record", "Pediatric Blood Vitals", "Developmental Assessment"],
        "supported_analysis": ["Age-adjusted heart & respiratory rates", "Height/Weight percentiles", "Vaccination completion index"]
    },
    "gynecology": {
        "slug": "gynecology",
        "name": "Gynecology",
        "code": "GYNE",
        "icon": "UserCheck",
        "specialization": "Reproductive Health & Maternal Wellness",
        "description": "Reproductive health & maternal wellness records.",
        "detailed_overview": "The Gynecology Department caters to female reproductive wellness, hormonal screening, prenatal care tracking, and routine pelvic health assessments.",
        "status": "Doctor Review",
        "services": [
            {"name": "Reproductive Hormone Panel", "available": True, "description": "Estrogen, progesterone, and LH/FSH balance evaluation."},
            {"name": "Maternal Wellness & Antenatal Check", "available": True, "description": "Routine pregnancy vitals and antenatal laboratory tracking."},
            {"name": "Pap Smear & Cervical Screening", "available": True, "description": "Cytology report extraction and routine screening logs."}
        ],
        "supported_reports": ["Hormonal Panel Report", "Antenatal Care Record", "Pelvic Ultrasound Report", "Cytology / Pap Smear Results"],
        "supported_analysis": ["Reproductive hormone balance", "Antenatal blood pressure & glucose", "Cytology extraction metrics"]
    },
    "general": {
        "slug": "general",
        "name": "General Medicine",
        "code": "GENMED",
        "icon": "Hospital",
        "specialization": "Primary Care & Comprehensive Vitals",
        "description": "Broad clinical vitals & holistic risk assessment.",
        "detailed_overview": "The General Medicine Department delivers holistic health assessments, preventative health checkups, routine physiological vital monitoring, and cross-department care coordination.",
        "status": "Available",
        "services": [
            {"name": "Holistic Vitals Assessment", "available": True, "description": "Comprehensive screening of blood pressure, pulse, temperature, and BMI."},
            {"name": "Annual Health Checkup Panel", "available": True, "description": "Multi-organ routine diagnostic review."},
            {"name": "Specialist Referral Coordination", "available": True, "description": "Direct routing to cardiology, endocrinology, or other subspecialties."}
        ],
        "supported_reports": ["Annual Health Checkup", "General Vital Signs Log", "Comprehensive Blood Work", "Physical Exam Summary"],
        "supported_analysis": ["Systolic/Diastolic BP", "Body Mass Index (BMI)", "Blood Glucose & Lipid Summary", "Overall wellness index"]
    },
    "emergency": {
        "slug": "emergency",
        "name": "Emergency Care",
        "code": "EMERG",
        "icon": "AlertOctagon",
        "specialization": "Triage & Urgent Priority Care",
        "description": "Instant emergency queue triage & critical care support.",
        "detailed_overview": "The Emergency Care Department provides 24/7 rapid triage assessment, critical vital stabilization tracking, and instant priority routing for acute medical conditions.",
        "status": "Available",
        "services": [
            {"name": "Priority Triage Assessment", "available": True, "description": "Instant emergency symptom severity grading and queue prioritization."},
            {"name": "Acute Vital Sign Monitoring", "available": True, "description": "Real-time tracking of critical pulse, blood pressure, and SpO2 levels."},
            {"name": "Rapid On-Duty Physician Dispatch", "available": True, "description": "Direct emergency notification to active emergency doctors."}
        ],
        "supported_reports": ["Emergency Triage Record", "Acute Vital Signs Log", "ER Doctor Consultation Summary", "Urgent Lab Panel"],
        "supported_analysis": ["Triage priority score (Level 1-5)", "Acute vital instability indicators", "Urgency time index"]
    }
}

class DepartmentCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None

@router.get("")
def list_departments(db: Session = Depends(get_db)):
    depts = db.query(Department).all()
    result = []
    for d in depts:
        # Match slug if possible
        slug = d.name.lower().replace(" ", "-").replace("-medicine", "").replace("-care", "")
        if slug not in DEPARTMENT_DETAILS_MAP:
            for k in DEPARTMENT_DETAILS_MAP.keys():
                if k in d.name.lower() or d.code.lower() in k:
                    slug = k
                    break

        meta = DEPARTMENT_DETAILS_MAP.get(slug, {})
        result.append({
            "id": d.id,
            "name": d.name,
            "code": d.code,
            "slug": slug,
            "description": d.description or meta.get("description", ""),
            "status": meta.get("status", "Available"),
            "icon": meta.get("icon", "Hospital")
        })
    return result

@router.post("")
def create_department(dept: DepartmentCreate, db: Session = Depends(get_db), current_user=Depends(get_current_admin)):
    existing = db.query(Department).filter(Department.code == dept.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department code already exists")
    
    new_dept = Department(name=dept.name, code=dept.code.upper(), description=dept.description)
    db.add(new_dept)
    db.commit()
    db.refresh(new_dept)
    return new_dept

@router.get("/{dept_identifier}")
def get_department_details(dept_identifier: str, db: Session = Depends(get_db)):
    """
    Returns full interactive details for a department, including database doctors,
    registered AI capabilities, services, supported report types, and workflow.
    `dept_identifier` can be integer ID, code (CARD), or slug/name (cardiology).
    """
    dept_obj = None
    if dept_identifier.isdigit():
        dept_obj = db.query(Department).filter(Department.id == int(dept_identifier)).first()
    else:
        dept_obj = db.query(Department).filter(
            (Department.code == dept_identifier.upper()) | 
            (Department.name.ilike(f"%{dept_identifier}%"))
        ).first()

    # Determine slug
    slug = dept_identifier.lower().replace(" ", "-")
    if dept_obj:
        for k in DEPARTMENT_DETAILS_MAP.keys():
            if k in dept_obj.name.lower() or dept_obj.code.lower() in k:
                slug = k
                break
    
    meta = DEPARTMENT_DETAILS_MAP.get(slug, {
        "slug": slug,
        "name": dept_obj.name if dept_obj else dept_identifier.title(),
        "code": dept_obj.code if dept_obj else dept_identifier[:4].upper(),
        "icon": "Hospital",
        "specialization": f"{dept_identifier.title()} Care",
        "description": dept_obj.description if dept_obj else f"Clinical services for {dept_identifier.title()}.",
        "detailed_overview": f"The {dept_identifier.title()} department focuses on evaluation, monitoring, and clinical decision support.",
        "status": "Available",
        "services": [
            {"name": f"{dept_identifier.title()} Evaluation", "available": True, "description": f"Standard clinical parameter review for {dept_identifier.title()}."}
        ],
        "supported_reports": [f"{dept_identifier.title()} Diagnostic Report"],
        "supported_analysis": ["Clinical parameters", "Uploaded reports"]
    })

    # Fetch active doctors from DB
    doctors_list = []
    if dept_obj:
        doctors = db.query(Doctor).filter(Doctor.department_id == dept_obj.id, Doctor.status == 'Active').all()
        for doc in doctors:
            user = db.query(User).filter(User.id == doc.user_id).first()
            doctors_list.append({
                "id": doc.id,
                "user_id": doc.user_id,
                "full_name": user.full_name if user else "Consultant Doctor",
                "email": user.email if user else "",
                "specialization": doc.specialization,
                "qualification": doc.qualification,
                "experience_years": doc.experience_years,
                "availability": doc.availability or {"days": "Mon - Fri", "hours": "09:00 AM - 04:00 PM"}
            })

    ai_models = []

    # Standard clinical report review workflow
    workflow_steps = [
        {"step": 1, "title": "Medical Report", "desc": "Patient uploads or enters medical report data."},
        {"step": 2, "title": "OCR / Extraction", "desc": "Health Analyzer extracts clinical parameters."},
        {"step": 3, "title": "Structured Data", "desc": "Extracted metrics formatted into standard schema."},
        {"step": 4, "title": "Validation", "desc": "Reference ranges & physiological validity verified."},
        {"step": 5, "title": "Department Routing", "desc": "Routed to selected medical specialty department."},
        {"step": 6, "title": "Doctor Review", "desc": "Consultant physician verifies & signs off."},
        {"step": 7, "title": "Final Medical Record", "desc": "Saved to permanent patient digital health file."}
    ]

    return {
        "id": dept_obj.id if dept_obj else None,
        "slug": meta.get("slug", slug),
        "name": dept_obj.name if dept_obj else meta.get("name", dept_identifier.title()),
        "code": dept_obj.code if dept_obj else meta.get("code", "DEPT"),
        "icon": meta.get("icon", "Hospital"),
        "specialization": meta.get("specialization", "Specialized Care"),
        "description": meta.get("description", dept_obj.description if dept_obj else ""),
        "detailed_overview": meta.get("detailed_overview", ""),
        "status": meta.get("status", "Available"),
        "services": meta.get("services", []),
        "supported_reports": meta.get("supported_reports", []),
        "supported_analysis": meta.get("supported_analysis", []),
        "doctors": doctors_list,
        "ai_models": ai_models,
        "workflow": workflow_steps
    }

@router.get("/{dept_id}/doctors")
def get_department_doctors(dept_id: int, db: Session = Depends(get_db)):
    doctors = db.query(Doctor).filter(Doctor.department_id == dept_id, Doctor.status == 'Active').all()
    result = []
    for doc in doctors:
        user = db.query(User).filter(User.id == doc.user_id).first()
        result.append({
            "id": doc.id,
            "user_id": doc.user_id,
            "full_name": user.full_name if user else "Doctor",
            "email": user.email if user else "",
            "specialization": doc.specialization,
            "qualification": doc.qualification,
            "experience_years": doc.experience_years,
            "availability": doc.availability
        })
    return result

