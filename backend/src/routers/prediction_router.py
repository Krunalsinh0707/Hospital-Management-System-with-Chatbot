from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional
import os
import shutil

from src.auth import get_current_user
from src.ml_service import predict_diabetes, predict_heart_disease, predict_hypertension
from src.health_analysis import analyze_parameters
from src.risk_scoring import calculate_risk
from src.conditions import identify_conditions
from src.recommendation import recommend_specialist
from src.clinical_advice import generate_clinical_advice
from src.pdf_service import extract_parameters_from_pdf
from src.ml_trainer import train_and_test_csv

router = APIRouter(tags=["Predictions & ML"])

class PatientData(BaseModel):
    Glucose: int
    BloodPressure: int
    SkinThickness: int
    Insulin: int
    BMI: float
    DiabetesPedigreeFunction: float
    Age: int

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

class HypertensionData(BaseModel):
    age: int
    sex: int
    bmi: float
    heart_rate: int
    activity_level: int
    smoker: int
    family_history: int

@router.post("/predict")
def predict(patient: PatientData, current_user=Depends(get_current_user)):
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

@router.post("/predict/heart")
def predict_heart(data: HeartData, current_user=Depends(get_current_user)):
    prediction_output = predict_heart_disease(data.dict())
    prediction = prediction_output["prediction"]
    
    result = "High Risk of Heart Disease" if prediction == 1 else "Low Risk"
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

@router.post("/predict/hypertension")
def predict_htn(data: HypertensionData, current_user=Depends(get_current_user)):
    prediction_output = predict_hypertension(data.dict())
    prediction = prediction_output["prediction"]
    
    result = "High Risk of Hypertension" if prediction == 1 else "Low Risk"
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

@router.post("/upload-report")
async def upload_report(file: UploadFile = File(...), current_user=Depends(get_current_user)):
    os.makedirs("uploads", exist_ok=True)
    file_path = f"uploads/{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    extracted = extract_parameters_from_pdf(file_path)
    
    # Auto-index extracted PDF document content into ChromaDB vector store for RAG
    try:
        from src.clinical_chat.vector_store import vector_store
        text_summary = f"Uploaded PDF Report '{file.filename}': Extracted Vitals & Medical Parameters: {json.dumps(extracted)}"
        vector_store.add_document_chunks(
            user_id=current_user.user_id,
            doc_id=file.filename,
            chunks=[text_summary],
            metadata={"filename": file.filename, "type": "uploaded_pdf"}
        )
    except Exception as e:
        print(f"[WARNING] Failed to index uploaded PDF in ChromaDB: {e}")

    return {"extracted_parameters": extracted}

@router.post("/ml/train-custom")
async def train_custom_ml(file: UploadFile = File(...), current_user=Depends(get_current_user)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
    
    try:
        content = await file.read()
        results = train_and_test_csv(content)
        
        if "error" in results:
            raise HTTPException(status_code=400, detail=results["error"])
            
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
