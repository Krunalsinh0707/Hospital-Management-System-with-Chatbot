from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from typing import Optional
import json

from src.database import get_db_connection
from src.auth import get_current_user
from src.pdf_generator import generate_pdf_report

router = APIRouter(tags=["Patient Reports & History"])

class ReportSave(BaseModel):
    inputs: dict
    outputs: dict
    source: str = "manual"

class HeartReportSave(BaseModel):
    age: Optional[int] = None
    sex: Optional[int] = None
    cp: Optional[int] = None
    trestbps: Optional[float] = None
    chol: Optional[float] = None
    fbs: Optional[int] = None
    restecg: Optional[int] = None
    thalach: Optional[float] = None
    exang: Optional[int] = None
    oldpeak: Optional[float] = None
    slope: Optional[int] = None
    ca: Optional[int] = None
    thal: Optional[int] = None
    prediction: Optional[str] = None
    probability: Optional[float] = None

class HypertensionReportSave(BaseModel):
    age: Optional[int] = None
    sex: Optional[int] = None
    bmi: Optional[float] = None
    heart_rate: Optional[float] = None
    activity_level: Optional[int] = None
    smoker: Optional[int] = None
    family_history: Optional[int] = None
    prediction: Optional[str] = None
    probability: Optional[float] = None

@router.post("/reports/save")
async def save_report(report: ReportSave, current_user=Depends(get_current_user)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = conn.cursor()
    inputs = report.inputs
    outputs = report.outputs
    
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

    try:
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
        return {"status": "saved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.get("/reports/history")
async def get_user_history(limit: int = 50, offset: int = 0, current_user=Depends(get_current_user)):
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
            LIMIT %s OFFSET %s
        """, (current_user.user_id, limit, offset))
        
        reports = cursor.fetchall()
        return {"reports": reports}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()


@router.post("/heart/save")
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
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()


@router.get("/heart/history")
async def get_heart_history(limit: int = 50, offset: int = 0, current_user=Depends(get_current_user)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM heart_reports WHERE user_id = %s ORDER BY created_at DESC LIMIT %s OFFSET %s", (current_user.user_id, limit, offset))
        reports = cursor.fetchall()
        return {"reports": reports}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()


@router.post("/hypertension/save")
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
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()


@router.get("/hypertension/history")
async def get_htn_history(limit: int = 50, offset: int = 0, current_user=Depends(get_current_user)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM hypertension_reports WHERE user_id = %s ORDER BY created_at DESC LIMIT %s OFFSET %s", (current_user.user_id, limit, offset))
        reports = cursor.fetchall()
        return {"reports": reports}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

@router.get("/reports/pdf/{report_type}/{report_id}")
async def export_report_pdf(report_type: str, report_id: int, current_user=Depends(get_current_user)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    try:
        cursor = conn.cursor(dictionary=True)
        table_map = {
            "diabetes": "patient_reports",
            "heart": "heart_reports",
            "hypertension": "hypertension_reports",
            "cbc": "cbc_reports"
        }
        table = table_map.get(report_type.lower())
        if not table:
            raise HTTPException(status_code=400, detail="Invalid report type")
            
        cursor.execute(f"SELECT * FROM {table} WHERE id = %s AND user_id = %s", (report_id, current_user.user_id))
        report_data = cursor.fetchone()
        
        if not report_data:
            raise HTTPException(status_code=404, detail="Report record not found")
            
        cursor.execute("SELECT full_name, email, blood_group FROM users WHERE id = %s", (current_user.user_id,))
        user_data = cursor.fetchone() or {}
        
        pdf_bytes = generate_pdf_report(report_type, report_data, user_data)
        
        filename = f"{report_type}_report_{report_id}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

