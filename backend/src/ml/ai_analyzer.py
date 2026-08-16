from src.ml.registry import model_registry
from src.ml.department_detector import detect_department

def run_ai_pre_analysis(extracted_parameters: dict, raw_text: str = ""):
    """
    Executes end-to-end AI Pre-Analysis pipeline:
    1. Detects relevant department
    2. Maps to relevant ML model
    3. Runs model inference if available
    4. Formats structured AI Decision Support Output
    """
    dept_slug = detect_department(extracted_parameters, raw_text)
    
    # Map department slug to primary model slug
    dept_model_map = {
        "endocrinology": "diabetes",
        "cardiology": "heart" if ("chol" in extracted_parameters or "trestbps" in extracted_parameters) else "hypertension",
        "hematology": "cbc"
    }

    model_slug = dept_model_map.get(dept_slug)

    if model_slug:
        prediction_res = model_registry.predict(model_slug, extracted_parameters)
        if prediction_res.get("available"):
            return {
                "department_slug": dept_slug,
                "model_name": prediction_res["model_name"],
                "model_version": prediction_res["model_version"],
                "prediction": prediction_res["prediction"],
                "probability": prediction_res["probability"],
                "risk_level": prediction_res["risk_level"],
                "important_factors": prediction_res["important_factors"],
                "explanation": prediction_res["explanation"],
                "requires_doctor_review": True
            }

    # Fallback if no specific model trained for this department
    return {
        "department_slug": dept_slug,
        "model_name": f"{dept_slug.title()} Pre-Analysis Rule Engine",
        "model_version": "1.0",
        "prediction": "Routined for Specialist Doctor Review",
        "probability": 0.5,
        "risk_level": "MODERATE",
        "important_factors": [f"{k}: {v}" for k, v in list(extracted_parameters.items())[:3]],
        "explanation": f"Model currently unavailable for department '{dept_slug}'. Report has been routed directly for doctor review.",
        "requires_doctor_review": True
    }
