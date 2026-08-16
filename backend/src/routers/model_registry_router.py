from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional, List

from src.auth import get_current_user
from src.ml.registry import model_registry

router = APIRouter(prefix="/ai", tags=["AI Intelligence Platform & Model Registry"])

class DynamicAnalysisRequest(BaseModel):
    model_slug: str
    parameters: Dict[str, Any]

@router.get("/models")
def get_ai_models(current_user=Depends(get_current_user)):
    """
    Returns list of extensible registered medical ML models.
    """
    return model_registry.get_registered_models()

@router.get("/models/{model_slug}")
def get_ai_model_detail(model_slug: str, current_user=Depends(get_current_user)):
    """
    Returns model details including schema.
    """
    models = model_registry.get_registered_models()
    model_info = next((m for m in models if m["slug"] == model_slug), None)
    if not model_info:
        raise HTTPException(status_code=404, detail=f"Model '{model_slug}' not found in registry")
    
    schema = model_registry.get_model_schema(model_slug)
    model_info["schema"] = schema
    return model_info

@router.get("/models/{model_slug}/schema")
def get_ai_model_schema(model_slug: str, current_user=Depends(get_current_user)):
    """
    Returns the dynamic input parameter schema for rendering forms.
    """
    schema = model_registry.get_model_schema(model_slug)
    if not schema:
        # Fallback empty schema for un-modeled departments
        return {
            "department": model_slug,
            "model_name": f"{model_slug.title()} Clinical Record Engine",
            "fields": [
                {"name": "notes", "label": "Clinical Observations / Key Parameters", "type": "text", "required": True}
            ]
        }
    return schema

@router.get("/departments")
def get_ai_departments(current_user=Depends(get_current_user)):
    """
    Returns scalable list of medical departments with model capabilities.
    """
    return model_registry.get_departments_with_models()

@router.post("/analyze")
def run_dynamic_ai_analysis(payload: DynamicAnalysisRequest, current_user=Depends(get_current_user)):
    """
    Runs AI pre-analysis dynamically based on selected model/department schema.
    """
    res = model_registry.predict(payload.model_slug, payload.parameters)
    return res
