from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional
import os
import shutil
import json

from src.database import get_db_connection
from src.auth import get_current_user
from src.pdf_service import extract_cbc_from_file
from src.cbc_analysis import interpret_cbc, process_manual_cbc
from src.clinical_advice import generate_clinical_advice

router = APIRouter(tags=["CBC Analysis"])

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

class CbcReportSave(BaseModel):
    cbc: dict
    interpretation: dict
    source: str = "manual"

@router.post("/cbc/upload-report")
async def upload_cbc_report(file: UploadFile = File(...), current_user=Depends(get_current_user)):
    os.makedirs("uploads", exist_ok=True)
    file_path = f"uploads/{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    cbc_data = extract_cbc_from_file(file_path)
    interpretation = interpret_cbc(cbc_data)
    
    # Auto-index extracted CBC document into ChromaDB vector store for RAG
    try:
        from src.chatbot.vector_store import vector_store
        text_summary = f"Uploaded CBC Report '{file.filename}': Extracted Hematology Data: {json.dumps(cbc_data)} | Health Score: {interpretation.get('health_score')}/100 | Urgency: {interpretation.get('urgency')}"
        vector_store.add_document_chunks(
            user_id=current_user.user_id,
            doc_id=file.filename,
            chunks=[text_summary],
            metadata={"filename": file.filename, "type": "cbc_report"}
        )
    except Exception as e:
        print(f"[WARNING] Failed to index CBC upload in ChromaDB: {e}")

    return {"cbc": cbc_data, "interpretation": interpretation}


@router.post("/cbc/analyze")
async def analyze_manual_cbc(data: ManualCbcInput, current_user=Depends(get_current_user)):
    input_data = {k: v for k, v in data.dict().items() if v is not None}
    cbc_data = process_manual_cbc(input_data)
    interpretation = interpret_cbc(cbc_data)
    
    prob = interpretation.get("ml_model_insights", {}).get("probability", 0)
    clinical_advice = generate_clinical_advice("Hematological Pattern", prob, input_data)
    interpretation["clinical_advice"] = clinical_advice

    return {"cbc": cbc_data, "interpretation": interpretation}


@router.post("/cbc/save")
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
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()


@router.get("/cbc/history")
async def get_cbc_history(limit: int = 50, offset: int = 0, current_user=Depends(get_current_user)):
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
            LIMIT %s OFFSET %s
        """, (current_user.user_id, limit, offset))
        reports = cursor.fetchall()
        
        for r in reports:
            if r.get('cbc_json'):
                r['cbc'] = json.loads(r['cbc_json']) if isinstance(r['cbc_json'], str) else r['cbc_json']
            if r.get('interpretation_json'):
                r['interpretation'] = json.loads(r['interpretation_json']) if isinstance(r['interpretation_json'], str) else r['interpretation_json']
            if 'cbc_json' in r: del r['cbc_json']
            if 'interpretation_json' in r: del r['interpretation_json']
            
        return {"reports": reports}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()
