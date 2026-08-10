import joblib
import pandas as pd
import numpy as np
import os
import json

models = {}
scalers = {}
metadata = {}

MODELS_DIR = "models"

for name in ["diabetes", "heart", "hypertension", "cbc"]:
    model_path = os.path.join(MODELS_DIR, f"{name}_model.pkl")
    scaler_path = os.path.join(MODELS_DIR, f"{name}_scaler.pkl")
    meta_path = os.path.join(MODELS_DIR, f"{name}_metadata.json")
    
    if os.path.exists(model_path):
        try:
            models[name] = joblib.load(model_path)
        except Exception as e:
            print(f"[ERROR] Failed to load {name} model: {e}")
            models[name] = None
    else:
        print(f"[WARNING] Model {name} not found at {model_path}")
        models[name] = None
        
    if os.path.exists(scaler_path):
        try:
            scalers[name] = joblib.load(scaler_path)
        except Exception as e:
            print(f"[ERROR] Failed to load {name} scaler: {e}")
            scalers[name] = None
    else:
        scalers[name] = None

    if os.path.exists(meta_path):
        try:
            with open(meta_path, "r") as f:
                metadata[name] = json.load(f)
        except Exception:
            metadata[name] = {}
    else:
        metadata[name] = {}


def get_prediction_insights(name, input_df):
    model = models.get(name)
    scaler = scalers.get(name)
    meta = metadata.get(name, {})
    
    if not model:
        return {"prediction": -1, "probability": 0.0, "algorithm": "Unknown"}

    feature_names = meta.get("features", list(input_df.columns))
    
    # Reorder columns to match model training order
    df = input_df.reindex(columns=feature_names, fill_value=0)
    
    # Apply scaler if present
    if scaler:
        scaled_input = scaler.transform(df)
    else:
        scaled_input = df.values

    prediction = model.predict(scaled_input)[0]
    
    probability = 0.0
    if hasattr(model, "predict_proba"):
        proba_array = model.predict_proba(scaled_input)[0]
        # If binary classification, take probability of positive class (index 1)
        if len(proba_array) == 2:
            probability = float(proba_array[1])
        else:
            probability = float(max(proba_array))
        
    algorithm = meta.get("algorithm", type(model).__name__)
    
    insights = {
        "prediction": prediction,
        "probability": round(probability, 4),
        "algorithm": algorithm,
        "accuracy": meta.get("accuracy"),
        "auc_roc": meta.get("auc_roc")
    }

    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
        feature_importance_dict = {col: float(imp) for col, imp in zip(feature_names, importances)}
        sorted_importances = dict(sorted(feature_importance_dict.items(), key=lambda item: item[1], reverse=True))
        insights["feature_importances"] = sorted_importances
        insights["top_features"] = list(sorted_importances.keys())[:3]
        
    return insights


def predict_diabetes(patient):
    df = pd.DataFrame([patient])
    insights = get_prediction_insights("diabetes", df)
    if "prediction" in insights and isinstance(insights["prediction"], (int, np.integer, float)):
        insights["prediction"] = int(insights["prediction"])
    return insights


def predict_heart_disease(patient):
    df = pd.DataFrame([patient])
    insights = get_prediction_insights("heart", df)
    if "prediction" in insights and isinstance(insights["prediction"], (int, np.integer, float)):
        insights["prediction"] = int(insights["prediction"])
    return insights


def predict_hypertension(patient):
    df = pd.DataFrame([patient])
    insights = get_prediction_insights("hypertension", df)
    if "prediction" in insights and isinstance(insights["prediction"], (int, np.integer, float)):
        insights["prediction"] = int(insights["prediction"])
    return insights


def predict_cbc_condition(cbc_data):
    df = pd.DataFrame([cbc_data])
    insights = get_prediction_insights("cbc", df)
    return insights
