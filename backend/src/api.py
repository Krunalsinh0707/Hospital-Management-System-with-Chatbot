from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional, List
import os
import shutil
import json
from datetime import timedelta
from datetime import datetime
import random
import re
# import smtplib
# from email.message import EmailMessage

# ---------------- IMPORT INTERNAL MODULES ----------------

from src.database import get_db_connection, init_db
from src.auth import (
    Token, User, get_current_user, get_password_hash,
    verify_password, create_access_token, get_current_admin,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

from src.ml_service import predict_diabetes
from src.health_analysis import analyze_parameters
from src.risk_scoring import calculate_risk
from src.conditions import identify_conditions
from src.recommendation import recommend_specialist
from src.pdf_service import extract_parameters_from_pdf, extract_cbc_from_file
from src.cbc_analysis import interpret_cbc
from src.clinical_advice import generate_clinical_advice
from src.ml_trainer import train_and_test_csv

from src.database import SessionLocal
from src.models import User as DBUser
from contextlib import asynccontextmanager

def create_default_admin():
    db = SessionLocal()
    try:
        admin = db.query(DBUser).filter(DBUser.email == "admin@gmail.com").first()
        if not admin:
            hashed_password = get_password_hash("Admin@123")
            new_admin = DBUser(
                email="admin@gmail.com",
                mobile_no="0000000000",
                blood_group="O+",
                password_hash=hashed_password,
                full_name="System Admin",
                role="admin"
            )
            db.add(new_admin)
            db.commit()
            print("✅ Default admin user created successfully.")
        else:
            print("ℹ️ Default admin user already exists. Skipping creation.")
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating default admin user: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_default_admin()
    yield

# ---------------- INITIALIZE DATABASE ----------------

init_db()

# ---------------- APP CONFIG ----------------

app = FastAPI(
    title="Health Analyzer API",
    description="AI-powered Healthcare Analytics & Decision Support System",
    version="2.0",
    lifespan=lifespan
)

# ---------------- CORS ----------------

def _get_allowed_origins() -> List[str]:
    default_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ]
    extra_origins = [
        origin.strip()
        for origin in os.getenv("CORS_ALLOW_ORIGINS", "").split(",")
        if origin.strip()
    ]

    return list(dict.fromkeys(default_origins + extra_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=_get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- DATA MODELS ----------------

class PatientData(BaseModel):
    Glucose: int
    BloodPressure: int
    SkinThickness: int
    Insulin: int
    BMI: float
    DiabetesPedigreeFunction: float
    Age: int


class UserCreate(BaseModel):
    email: str
    mobile_no: str
    blood_group: str
    password: str
    full_name: str


class ReportSave(BaseModel):
    inputs: dict
    outputs: dict
    source: str = "manual"


class ForgotPasswordRequest(BaseModel):
    email: str
    mobile_no: str
    full_name: str
    blood_group: str


class ResetPasswordRequest(BaseModel):
    mobile_no: str
    otp: str
    new_password: str


def _is_valid_email(email: str) -> bool:
    return re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email) is not None


def _normalize_mobile(mobile_no: str) -> str:
    return re.sub(r"\D", "", mobile_no or "")


def _is_valid_mobile(mobile_no: str) -> bool:
    normalized = _normalize_mobile(mobile_no)
    return 10 <= len(normalized) <= 15


# ---------------- AUTH ROUTES ----------------

@app.post("/register", response_model=Token)
async def register(user: UserCreate):
    email = (user.email or "").strip().lower()
    mobile_no = _normalize_mobile(user.mobile_no)

    if not _is_valid_email(email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    if not _is_valid_mobile(mobile_no):
        raise HTTPException(status_code=400, detail="Valid mobile number is required")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="Email already registered")

    cursor.execute("SELECT id FROM users WHERE mobile_no = %s", (mobile_no,))
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="Mobile number already registered")

    hashed_password = get_password_hash(user.password)

    cursor.execute(
        """
        INSERT INTO users (email, mobile_no, blood_group, password_hash, full_name, role)
        VALUES (%s, %s, %s, %s, %s, 'user')
        """,
        (email, mobile_no, user.blood_group, hashed_password, user.full_name)
    )
    conn.commit()
    user_id = cursor.lastrowid

    access_token = create_access_token(
        data={"sub": email, "user_id": user_id, "role": "user"},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    cursor.close()
    conn.close()

    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    login_id_raw = (form_data.username or "").strip()
    login_id_email = login_id_raw.lower()
    login_id_mobile = _normalize_mobile(login_id_raw)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Decide whether to search by email or by mobile_no
    if "@" in login_id_raw:
        cursor.execute(
            "SELECT * FROM users WHERE email = %s",
            (login_id_email,),
        )
    else:
        cursor.execute(
            "SELECT * FROM users WHERE mobile_no = %s",
            (login_id_mobile,),
        )
    user = cursor.fetchone()

    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    access_token = create_access_token(
        data={"sub": user["email"], "user_id": user["id"], "role": user["role"]},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    cursor.close()
    conn.close()

    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    email = (request.email or "").strip().lower()
    mobile_no = _normalize_mobile(request.mobile_no)
    full_name = (request.full_name or "").strip()
    blood_group = (request.blood_group or "").strip()

    if not _is_valid_email(email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    if not _is_valid_mobile(mobile_no):
        raise HTTPException(status_code=400, detail="Valid mobile number is required")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Verify ALL details match
    cursor.execute(
        "SELECT id FROM users WHERE email = %s AND mobile_no = %s AND full_name = %s AND blood_group = %s",
        (email, mobile_no, full_name, blood_group)
    )
    user = cursor.fetchone()

    if not user:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Identity verification failed. Information does not match our clinical records.")

    # Generate a random 6-digit OTP
    otp = str(random.randint(100000, 999999))
    expires_at = datetime.now() + timedelta(minutes=10)

    # Invalidate any existing OTPs for this mobile number
    cursor.execute(
        "UPDATE verification_codes SET is_verified = 1 WHERE target_type = 'mobile' AND target_value = %s AND is_verified = 0",
        (mobile_no,)
    )

    # Save the new OTP
    cursor.execute(
        """
        INSERT INTO verification_codes (target_type, target_value, code, expires_at)
        VALUES ('mobile', %s, %s, %s)
        """,
        (mobile_no, otp, expires_at)
    )
    conn.commit()
    cursor.close()
    conn.close()

    # NOTE: In a real application, you would send this OTP via SMS here!
    print(f"OTP for {mobile_no} is: {otp}")

    return {"message": "Identity verified. OTP sent successfully to your mobile number."}


@app.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    mobile_no = _normalize_mobile(request.mobile_no)

    if not _is_valid_mobile(mobile_no):
        raise HTTPException(status_code=400, detail="Valid mobile number is required")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Validate OTP
    cursor.execute(
        """
        SELECT id FROM verification_codes 
        WHERE target_type = 'mobile' AND target_value = %s AND code = %s AND is_verified = 0 AND expires_at > NOW()
        ORDER BY created_at DESC LIMIT 1
        """,
        (mobile_no, request.otp)
    )
    verification = cursor.fetchone()

    if not verification:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    # Hash the new password
    hashed_password = get_password_hash(request.new_password)

    # Update password
    cursor.execute(
        "UPDATE users SET password_hash = %s WHERE mobile_no = %s",
        (hashed_password, mobile_no)
    )

    # Mark OTP as verified
    cursor.execute(
        "UPDATE verification_codes SET is_verified = 1 WHERE id = %s",
        (verification['id'],)
    )

    conn.commit()
    cursor.close()
    conn.close()

    return {"message": "Password reset successfully"}

# ---------------- BASIC ROUTES ----------------

@app.get("/")
def root():
    return {"message": "Health Analyzer API running successfully"}

@app.get("/users/me", response_model=User)
async def read_users_me(current_user=Depends(get_current_user)):
    print(f"DEBUG: /users/me requested for user_id: {current_user.user_id}")
    
    conn = get_db_connection()
    if not conn:
        print("ERROR: Database connection failed in read_users_me")
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE id = %s", (current_user.user_id,))
        user = cursor.fetchone()
        
        if user is None:
            print(f"ERROR: User ID {current_user.user_id} not found in DB")
            raise HTTPException(status_code=404, detail="User not found")
            
        return user
    except Exception as e:
        print(f"ERROR: Exception in read_users_me: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    blood_group: Optional[str] = None
    mobile_no: Optional[str] = None

@app.put("/users/me", response_model=User)
async def update_user_me(user_update: UserUpdate, current_user=Depends(get_current_user)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor(dictionary=True)
        # Build update query dynamically
        update_data = user_update.dict(exclude_unset=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields provided for update")
        
        # Normalize mobile if present
        if "mobile_no" in update_data:
            update_data["mobile_no"] = _normalize_mobile(update_data["mobile_no"])
            if not _is_valid_mobile(update_data["mobile_no"]):
                raise HTTPException(status_code=400, detail="Invalid mobile number format")

        columns = ", ".join([f"{k} = %s" for k in update_data.keys()])
        values = list(update_data.values())
        values.append(current_user.user_id)
        
        query = f"UPDATE users SET {columns} WHERE id = %s"
        cursor.execute(query, tuple(values))
        conn.commit()
        
        # Get updated user
        cursor.execute("SELECT * FROM users WHERE id = %s", (current_user.user_id,))
        updated_user = cursor.fetchone()
        return updated_user
        
    except Exception as e:
        print(f"Error updating user: {e}")
        if "Duplicate entry" in str(e):
            raise HTTPException(status_code=400, detail="Mobile number already registered by another user")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

# ---------------- PREDICTION ----------------

@app.post("/predict")
def predict(patient: PatientData):
    data = patient.dict()

    diabetes_output = predict_diabetes(data)
    diabetes = diabetes_output["prediction"]
    ml_insights = {
        "algorithm": diabetes_output.get("algorithm", "Unknown"),
        "probability": diabetes_output.get("probability", 0.0)
    }
    if "feature_importances" in diabetes_output:
        ml_insights["feature_importances"] = diabetes_output["feature_importances"]
    if "top_features" in diabetes_output:
        ml_insights["top_features"] = diabetes_output["top_features"]

    analysis = analyze_parameters(data)
    risk = calculate_risk(analysis, diabetes)
    conditions = identify_conditions(analysis, diabetes)
    specialists = recommend_specialist(conditions)

    # Generate structured advice
    clinical_advice = generate_clinical_advice("Diabetes", ml_insights.get("probability", 0), data)

    return {
        "diabetes_prediction": "Positive" if diabetes == 1 else "Negative",
        "risk_level": risk,
        "analysis": analysis,
        "possible_conditions": conditions,
        "recommended_specialists": specialists,
        "ml_model_insights": ml_insights,
        "clinical_advice": clinical_advice
    }

# ---------------- HEART DISEASE PREDICTION ----------------

class HeartData(BaseModel):
    age: int
    sex: int
    cp: int
    trestbps: int
    chol: int
    fbs: int
    restecg: int
    thalach: int
    exang: int
    oldpeak: float
    slope: int
    ca: int
    thal: int

@app.post("/predict/heart")
def predict_heart(data: HeartData):
    from src.ml_service import predict_heart_disease
    prediction_output = predict_heart_disease(data.dict())
    prediction = prediction_output["prediction"]
    
    result = "High Risk of Heart Disease" if prediction == 1 else "Low Risk"
    
    # Generate structured advice
    clinical_advice = generate_clinical_advice("Cardiovascular Disease", prediction_output.get("probability", 0), data.dict())

    return {
        "prediction": result, 
        "raw": prediction,
        "ml_model_insights": {
            "algorithm": prediction_output.get("algorithm", "Unknown"),
            "probability": prediction_output.get("probability", 0.0),
            "feature_importances": prediction_output.get("feature_importances"),
            "top_features": prediction_output.get("top_features")
        },
        "clinical_advice": clinical_advice
    }

class HeartReportSave(HeartData):
    prediction: str
    probability: Optional[float] = None

@app.post("/heart/save")
async def save_heart_report(report: HeartReportSave, current_user=Depends(get_current_user)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO heart_reports 
            (user_id, age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal, prediction, probability)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            current_user.user_id,
            report.age, report.sex, report.cp, report.trestbps, report.chol, report.fbs, report.restecg, 
            report.thalach, report.exang, report.oldpeak, report.slope, report.ca, report.thal,
            report.prediction, report.probability
        ))
        conn.commit()
        return {"status": "saved"}
    except Exception as e:
        print(f"Error saving heart report: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

@app.get("/heart/history")
async def get_heart_history(current_user=Depends(get_current_user)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM heart_reports WHERE user_id = %s ORDER BY created_at DESC", (current_user.user_id,))
        reports = cursor.fetchall()
        return {"reports": reports}
    except Exception as e:
        print(f"Error fetching heart history: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

# ---------------- HYPERTENSION PREDICTION ----------------

class HypertensionData(BaseModel):
    age: int
    sex: int
    bmi: float
    heart_rate: int
    activity_level: int
    smoker: int
    family_history: int

@app.post("/predict/hypertension")
def predict_htn(data: HypertensionData):
    from src.ml_service import predict_hypertension
    prediction_output = predict_hypertension(data.dict())
    prediction = prediction_output["prediction"]
    
    result = "High Risk of Hypertension" if prediction == 1 else "Low Risk"
    
    # Generate structured advice
    clinical_advice = generate_clinical_advice("Hypertension", prediction_output.get("probability", 0), data.dict())

    return {
        "prediction": result, 
        "raw": prediction,
        "ml_model_insights": {
            "algorithm": prediction_output.get("algorithm", "Unknown"),
            "probability": prediction_output.get("probability", 0.0),
            "feature_importances": prediction_output.get("feature_importances"),
            "top_features": prediction_output.get("top_features")
        },
        "clinical_advice": clinical_advice
    }

class HypertensionReportSave(HypertensionData):
    prediction: str
    probability: Optional[float] = None

@app.post("/hypertension/save")
async def save_htn_report(report: HypertensionReportSave, current_user=Depends(get_current_user)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO hypertension_reports 
            (user_id, age, sex, bmi, heart_rate, activity_level, smoker, family_history, prediction, probability)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            current_user.user_id,
            report.age, report.sex, report.bmi, report.heart_rate, 
            report.activity_level, report.smoker, report.family_history,
            report.prediction, report.probability
        ))
        conn.commit()
        return {"status": "saved"}
    except Exception as e:
        print(f"Error saving hypertension report: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

@app.get("/hypertension/history")
async def get_htn_history(current_user=Depends(get_current_user)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM hypertension_reports WHERE user_id = %s ORDER BY created_at DESC", (current_user.user_id,))
        reports = cursor.fetchall()
        return {"reports": reports}
    except Exception as e:
        print(f"Error fetching hypertension history: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

# ---------------- UPDATE CBC ANALYSIS ----------------

# ---------------- SAVE REPORT ----------------

@app.post("/reports/save")
async def save_report(report: ReportSave, current_user=Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Extract inputs and outputs safely
    inputs = report.inputs
    outputs = report.outputs
    
    # helper to get value or None
    def get_val(data, key, cast=None):
        val = data.get(key)
        if val == "" or val is None:
            return None
        if cast:
            try:
                return cast(val)
            except:
                return None
        return val

    cursor.execute(
        """
        INSERT INTO patient_reports
        (
            user_id, 
            glucose, blood_pressure, skin_thickness, insulin, bmi, diabetes_pedigree_function, age,
            diabetes_prediction, risk_level, probability,
            abnormal_json, conditions_json, specialists_json, source
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            current_user.user_id,
            get_val(inputs, 'Glucose', float),
            get_val(inputs, 'BloodPressure', float),
            get_val(inputs, 'SkinThickness', float),
            get_val(inputs, 'Insulin', float),
            get_val(inputs, 'BMI', float),
            get_val(inputs, 'DiabetesPedigreeFunction', float),
            get_val(inputs, 'Age', int),
            get_val(outputs, 'diabetes_prediction', str),
            get_val(outputs, 'risk_level', str),
            outputs.get("ml_model_insights", {}).get("probability"),
            json.dumps(outputs.get("analysis", [])),
            json.dumps(outputs.get("possible_conditions", [])),
            json.dumps(outputs.get("recommended_specialists", [])),
            report.source
        )
    )

    conn.commit()
    cursor.close()
    conn.close()

    return {"status": "saved"}

# ---------------- HISTORY ROUTE ----------------

@app.get("/reports/history")
async def get_user_history(current_user=Depends(get_current_user)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT 
                id, created_at, 
                diabetes_prediction, risk_level, probability,
                bmi, glucose, blood_pressure, insulin, age
            FROM patient_reports 
            WHERE user_id = %s
            ORDER BY created_at DESC
        """, (current_user.user_id,))
        
        reports = cursor.fetchall()
        return {"reports": reports}
        
    except Exception as e:
        print(f"Error in /reports/history: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

# ---------------- ADMIN ROUTES ----------------

@app.get("/reports/admin")
async def get_admin_data(current_user=Depends(get_current_admin)):
    print(f"DEBUG: /reports/admin requested by {current_user.email}")
    conn = get_db_connection()
    if not conn:
        print("ERROR: Database connection failed in /reports/admin")
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        # 1. Fetch all users (patients)
        cursor.execute("SELECT id, email, full_name, created_at FROM users WHERE role = 'user' ORDER BY created_at DESC")
        users = cursor.fetchall()
        
        # 2. Fetch all reports from all 4 tables
        cursor.execute("SELECT id, user_id, created_at, diabetes_prediction, risk_level, probability, bmi, glucose, blood_pressure, skin_thickness, insulin, diabetes_pedigree_function, age, 'diabetes' as type FROM patient_reports")
        diabetes_reports = cursor.fetchall()
        
        cursor.execute("SELECT id, user_id, created_at, prediction as heart_disease_prediction, probability, age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal, 'heart' as type FROM heart_reports")
        heart_reports = cursor.fetchall()

        cursor.execute("SELECT id, user_id, created_at, prediction as hypertension_prediction, probability, age, sex, bmi, heart_rate, activity_level, smoker, family_history, 'hypertension' as type FROM hypertension_reports")
        hypertension_reports = cursor.fetchall()

        cursor.execute("SELECT id, user_id, created_at, cbc_json, interpretation_json, probability, 'cbc' as type FROM cbc_reports")
        cbc_reports = cursor.fetchall()

        # Combine all reports into one pool
        all_reports = diabetes_reports + heart_reports + hypertension_reports + cbc_reports

        # Parse JSON for CBC reports if needed (for frontend processing)
        for r in all_reports:
             if r.get('type') == 'cbc':
                 if r.get('cbc_json'):
                     r['cbc'] = json.loads(r['cbc_json'])
                 if r.get('interpretation_json'):
                     r['interpretation'] = json.loads(r['interpretation_json'])
                 if 'cbc_json' in r: del r['cbc_json']
                 if 'interpretation_json' in r: del r['interpretation_json']

        # Group reports by user_id
        reports_by_user = {}
        for r in all_reports:
            uid = r['user_id']
            if not uid: continue
            if uid not in reports_by_user:
                reports_by_user[uid] = []
            reports_by_user[uid].append(r)

        # Build final patient-centric response
        patients_data = []
        for u in users:
            uid = u['id']
            user_history = reports_by_user.get(uid, [])
            
            # Sort history newest first
            user_history.sort(key=lambda x: x['created_at'], reverse=True)

            # Determine latest risk level and age from latest reports
            latest_risk = "Low"
            age = None
            for r in user_history:
                if r.get('type') == 'diabetes' and r.get('risk_level'):
                    if not latest_risk or latest_risk == "Low": # prioritize if we find a higher one or just take the latest
                        latest_risk = r['risk_level']
                
                # Try to get age from any report that has it
                if not age and r.get('age'):
                    age = r['age']

            # Check if they have ANY positive predictions lately
            has_diabetes = any(r.get('diabetes_prediction') == 'Positive' for r in user_history if r.get('type') == 'diabetes')
            has_heart = any(r.get('heart_disease_prediction') == 'Positive' for r in user_history if r.get('type') == 'heart')
            has_htn = any(r.get('hypertension_prediction') == 'Positive' for r in user_history if r.get('type') == 'hypertension')

            patients_data.append({
                "id": uid,
                "full_name": u['full_name'],
                "email": u['email'],
                "joined_at": u['created_at'],
                "latest_risk_level": latest_risk,
                "age": age,
                "has_diabetes": has_diabetes,
                "has_heart": has_heart,
                "has_hypertension": has_htn,
                "total_assessments": len(user_history),
                "history": user_history
            })
            
        return {
            "patients": patients_data
        }
        
    except Exception as e:
        print(f"ERROR: Exception in /reports/admin: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

# ---------------- PDF UPLOAD ----------------

@app.post("/upload-report")
async def upload_report(file: UploadFile = File(...)):
    os.makedirs("uploads", exist_ok=True)
    file_path = f"uploads/{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    extracted = extract_parameters_from_pdf(file_path)
    return {"extracted_parameters": extracted}

# ---------------- CUSTOM ML TRAINING ----------------

@app.post("/ml/train-custom")
async def train_custom_ml(file: UploadFile = File(...)):
    """
    Accepts a CSV file and placeholder for training results.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
    
    try:
        content = await file.read()
        results = train_and_test_csv(content)
        
        if "error" in results:
            raise HTTPException(status_code=400, detail=results["error"])
            
        return results
    except Exception as e:
        print(f"Error in custom ML training: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ---------------- CBC UPLOAD ----------------

@app.post("/cbc/upload-report")
async def upload_cbc_report(file: UploadFile = File(...)):
    os.makedirs("uploads", exist_ok=True)
    file_path = f"uploads/{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    cbc_data = extract_cbc_from_file(file_path)
    interpretation = interpret_cbc(cbc_data)

    return {"cbc": cbc_data, "interpretation": interpretation}


class ManualCbcInput(BaseModel):
    Hemoglobin: Optional[float] = None
    RBC: Optional[float] = None
    WBC: Optional[float] = None
    Platelets: Optional[float] = None
    ESR: Optional[float] = None
    MCV: Optional[float] = None
    MCH: Optional[float] = None
    RDW: Optional[float] = None
    Neutrophils: Optional[float] = None
    Lymphocytes: Optional[float] = None
    Monocytes: Optional[float] = None
    Eosinophils: Optional[float] = None
    Basophils: Optional[float] = None


@app.post("/cbc/analyze")
async def analyze_manual_cbc(data: ManualCbcInput):
    # Convert Pydantic model to dict, removing None values
    input_data = {k: v for k, v in data.dict().items() if v is not None}
    
    # Process using the shared logic
    from src.cbc_analysis import process_manual_cbc, interpret_cbc
    
    cbc_data = process_manual_cbc(input_data)
    interpretation = interpret_cbc(cbc_data)
    
    # Generate structured advice for CBC
    prob = interpretation.get("ml_model_insights", {}).get("probability", 0)
    clinical_advice = generate_clinical_advice("Hematological Pattern", prob, input_data)
    interpretation["clinical_advice"] = clinical_advice

    return {"cbc": cbc_data, "interpretation": interpretation}

# ---------------- CBC DATABASE ROUTES ----------------

class CbcReportSave(BaseModel):
    cbc: dict
    interpretation: dict
    source: str = "manual"

@app.post("/cbc/save")
async def save_cbc_report(report: CbcReportSave, current_user=Depends(get_current_user)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO cbc_reports (user_id, cbc_json, interpretation_json, probability, source)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            current_user.user_id,
            json.dumps(report.cbc),
            json.dumps(report.interpretation),
            report.interpretation.get("ml_model_insights", {}).get("probability"),
            report.source
        ))
        conn.commit()
        return {"status": "saved"}
    except Exception as e:
        print(f"Error saving CBC report: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

@app.get("/cbc/history")
async def get_cbc_history(current_user=Depends(get_current_user)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, created_at, cbc_json, interpretation_json, probability, source
            FROM cbc_reports
            WHERE user_id = %s
            ORDER BY created_at DESC
        """, (current_user.user_id,))
        reports = cursor.fetchall()
        
        # Parse JSON strings back to objects
        for r in reports:
            if r['cbc_json']:
                r['cbc'] = json.loads(r['cbc_json'])
            if r['interpretation_json']:
                r['interpretation'] = json.loads(r['interpretation_json'])
            del r['cbc_json']
            del r['interpretation_json']
            
        return {"reports": reports}
    except Exception as e:
        print(f"Error fetching CBC history: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()
