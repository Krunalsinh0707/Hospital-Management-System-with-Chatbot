import os
import json
import joblib
import pandas as pd
import numpy as np

class MLModelRegistry:
    def __init__(self, models_dir="models"):
        self.models_dir = models_dir
        self.models = {}
        self.scalers = {}
        self.metadata = {}
        self.department_map = {
            "cardiology": ["heart", "hypertension"],
            "endocrinology": ["diabetes"],
            "hematology": ["cbc"],
            "pulmonology": [],
            "oncology": [],
            "orthopedics": [],
            "neurology": [],
            "gastroenterology": [],
            "nephrology": [],
            "dermatology": [],
            "pediatrics": [],
            "gynecology": [],
            "general": [],
            "emergency": []
        }
        self.schemas = {
            "diabetes": {
                "department": "endocrinology",
                "model_name": "Diabetes Vector Risk Model",
                "fields": [
                    {"name": "Glucose", "label": "Plasma Glucose Concentration", "type": "number", "required": True, "unit": "mg/dL", "default": 120, "description": "2-hour plasma glucose concentration in an oral glucose tolerance test"},
                    {"name": "BloodPressure", "label": "Diastolic Blood Pressure", "type": "number", "required": True, "unit": "mmHg", "default": 70, "description": "Diastolic blood pressure"},
                    {"name": "SkinThickness", "label": "Triceps Skin Fold Thickness", "type": "number", "required": False, "unit": "mm", "default": 20, "description": "Skin fold thickness for body fat estimate"},
                    {"name": "Insulin", "label": "2-Hour Serum Insulin", "type": "number", "required": False, "unit": "mu U/ml", "default": 79, "description": "2-hour serum insulin"},
                    {"name": "BMI", "label": "Body Mass Index (BMI)", "type": "number", "required": True, "unit": "kg/m²", "default": 25.0, "description": "Weight in kg/(height in m)^2"},
                    {"name": "DiabetesPedigreeFunction", "label": "Diabetes Pedigree Score", "type": "number", "required": False, "unit": "index", "default": 0.47, "description": "Genetic likelihood score based on family history"},
                    {"name": "Age", "label": "Age", "type": "number", "required": True, "unit": "years", "default": 33, "description": "Patient age in years"}
                ]
            },
            "heart": {
                "department": "cardiology",
                "model_name": "Cardiology Risk Assessment",
                "fields": [
                    {"name": "age", "label": "Age", "type": "number", "required": True, "unit": "years", "default": 55},
                    {"name": "sex", "label": "Biological Sex", "type": "select", "options": [{"label": "Female", "value": 0}, {"label": "Male", "value": 1}], "required": True},
                    {"name": "cp", "label": "Chest Pain Type", "type": "select", "options": [
                        {"label": "Typical Angina", "value": 0},
                        {"label": "Atypical Angina", "value": 1},
                        {"label": "Non-anginal Pain", "value": 2},
                        {"label": "Asymptomatic", "value": 3}
                    ], "required": True},
                    {"name": "trestbps", "label": "Resting Blood Pressure", "type": "number", "required": True, "unit": "mmHg", "default": 130},
                    {"name": "chol", "label": "Serum Cholesterol", "type": "number", "required": True, "unit": "mg/dL", "default": 240},
                    {"name": "fbs", "label": "Fasting Blood Sugar > 120 mg/dL", "type": "select", "options": [{"label": "No (<= 120)", "value": 0}, {"label": "Yes (> 120)", "value": 1}], "required": True},
                    {"name": "restecg", "label": "Resting ECG Results", "type": "select", "options": [
                        {"label": "Normal", "value": 0},
                        {"label": "ST-T Wave Abnormality", "value": 1},
                        {"label": "Left Ventricular Hypertrophy", "value": 2}
                    ], "required": True},
                    {"name": "thalach", "label": "Max Heart Rate Achieved", "type": "number", "required": True, "unit": "bpm", "default": 150},
                    {"name": "exang", "label": "Exercise Induced Angina", "type": "select", "options": [{"label": "No", "value": 0}, {"label": "Yes", "value": 1}], "required": True},
                    {"name": "oldpeak", "label": "ST Depression (Exercise vs Rest)", "type": "number", "required": False, "unit": "mm", "default": 1.0},
                    {"name": "slope", "label": "Slope of Peak Exercise ST Segment", "type": "select", "options": [
                        {"label": "Upsloping", "value": 0},
                        {"label": "Flat", "value": 1},
                        {"label": "Downsloping", "value": 2}
                    ], "required": False},
                    {"name": "ca", "label": "Number of Major Vessels Colored by Fluoroscopy", "type": "select", "options": [
                        {"label": "0 Vessels", "value": 0},
                        {"label": "1 Vessel", "value": 1},
                        {"label": "2 Vessels", "value": 2},
                        {"label": "3 Vessels", "value": 3}
                    ], "required": False},
                    {"name": "thal", "label": "Thalassemia Scan Result", "type": "select", "options": [
                        {"label": "Normal", "value": 1},
                        {"label": "Fixed Defect", "value": 2},
                        {"label": "Reversible Defect", "value": 3}
                    ], "required": False}
                ]
            },
            "hypertension": {
                "department": "cardiology",
                "model_name": "Blood Pressure & Hypertension Classifier",
                "fields": [
                    {"name": "age", "label": "Age", "type": "number", "required": True, "unit": "years", "default": 45},
                    {"name": "sex", "label": "Biological Sex", "type": "select", "options": [{"label": "Female", "value": 0}, {"label": "Male", "value": 1}], "required": True},
                    {"name": "bmi", "label": "Body Mass Index", "type": "number", "required": True, "unit": "kg/m²", "default": 27.5},
                    {"name": "heart_rate", "label": "Resting Heart Rate", "type": "number", "required": True, "unit": "bpm", "default": 75},
                    {"name": "activity_level", "label": "Physical Activity Level", "type": "select", "options": [
                        {"label": "Sedentary", "value": 0},
                        {"label": "Moderate", "value": 1},
                        {"label": "Active", "value": 2}
                    ], "required": True},
                    {"name": "smoker", "label": "Smoking Status", "type": "select", "options": [{"label": "Non-Smoker", "value": 0}, {"label": "Smoker", "value": 1}], "required": True},
                    {"name": "family_history", "label": "Family History of Hypertension", "type": "select", "options": [{"label": "No", "value": 0}, {"label": "Yes", "value": 1}], "required": True}
                ]
            },
            "cbc": {
                "department": "hematology",
                "model_name": "Complete Blood Count (CBC) Hematology Model",
                "fields": [
                    {"name": "hemoglobin", "label": "Hemoglobin", "type": "number", "required": True, "unit": "g/dL", "default": 14.0},
                    {"name": "wbc", "label": "White Blood Cell Count (WBC)", "type": "number", "required": True, "unit": "/µL", "default": 7500},
                    {"name": "rbc", "label": "Red Blood Cell Count (RBC)", "type": "number", "required": True, "unit": "million/µL", "default": 4.8},
                    {"name": "platelets", "label": "Platelet Count", "type": "number", "required": True, "unit": "/µL", "default": 250000},
                    {"name": "hematocrit", "label": "Hematocrit", "type": "number", "required": False, "unit": "%", "default": 42.0},
                    {"name": "mcv", "label": "Mean Corpuscular Volume (MCV)", "type": "number", "required": False, "unit": "fL", "default": 90.0}
                ]
            }
        }
        self.load_all_models()

    def load_all_models(self):
        for name in ["diabetes", "heart", "hypertension", "cbc"]:
            model_path = os.path.join(self.models_dir, f"{name}_model.pkl")
            scaler_path = os.path.join(self.models_dir, f"{name}_scaler.pkl")
            meta_path = os.path.join(self.models_dir, f"{name}_metadata.json")

            if os.path.exists(model_path):
                try:
                    self.models[name] = joblib.load(model_path)
                except Exception as e:
                    print(f"[MLRegistry] Error loading {name}: {e}")
                    self.models[name] = None
            
            if os.path.exists(scaler_path):
                try:
                    self.scalers[name] = joblib.load(scaler_path)
                except Exception as e:
                    self.scalers[name] = None

            if os.path.exists(meta_path):
                try:
                    with open(meta_path, "r") as f:
                        self.metadata[name] = json.load(f)
                except Exception:
                    self.metadata[name] = {}

    def get_registered_models(self):
        result = []
        for name, model in self.models.items():
            meta = self.metadata.get(name, {})
            result.append({
                "slug": name,
                "name": meta.get("model_name", f"{name.title()} Diagnostic Model"),
                "algorithm": meta.get("algorithm", type(model).__name__ if model else "Pretrained Model"),
                "accuracy": meta.get("accuracy", 0.95),
                "status": "Available" if model else "Doctor Review Required",
                "department": self._get_department_for_slug(name),
                "version": meta.get("version", "1.0"),
                "description": f"Clinical pre-analysis model for {self._get_department_for_slug(name).title()}."
            })
        return result

    def get_model_schema(self, model_slug):
        if model_slug in self.schemas:
            return self.schemas[model_slug]
        return None

    def get_departments_with_models(self):
        dept_info = [
            {"slug": "cardiology", "name": "Cardiology", "icon": "Heart", "description": "Heart disease, arrhythmia, and hypertension risk pre-analysis", "status": "Available"},
            {"slug": "endocrinology", "name": "Endocrinology", "icon": "Activity", "description": "Diabetes, thyroid, and metabolic assessment", "status": "Available"},
            {"slug": "hematology", "name": "Hematology", "icon": "Droplets", "description": "CBC, blood panels, and anemia analysis", "status": "Available"},
            {"slug": "pulmonology", "name": "Pulmonology", "icon": "Wind", "description": "Respiratory panels, chest X-ray and SpO2 pre-analysis", "status": "Coming Soon"},
            {"slug": "oncology", "name": "Oncology", "icon": "Dna", "description": "Tumorous markers and biostatistical screening", "status": "Coming Soon"},
            {"slug": "neurology", "name": "Neurology", "icon": "Brain", "description": "Neurological status and cognitive risk support", "status": "Coming Soon"},
            {"slug": "orthopedics", "name": "Orthopedics", "icon": "Bone", "description": "Bone density, joint parameters, and imaging", "status": "Doctor Review Required"},
            {"slug": "gastroenterology", "name": "Gastroenterology", "icon": "Stethoscope", "description": "Digestive panels, liver enzymes, and gut health", "status": "Doctor Review Required"},
            {"slug": "nephrology", "name": "Nephrology", "icon": "Activity", "description": "Renal function, kidney panels, and electrolyte balance", "status": "Coming Soon"},
            {"slug": "dermatology", "name": "Dermatology", "icon": "Shield", "description": "Skin lesion and tissue diagnostics", "status": "Doctor Review Required"},
            {"slug": "pediatrics", "name": "Pediatrics", "icon": "User", "description": "Child growth, pediatric vital thresholds", "status": "Doctor Review Required"},
            {"slug": "gynecology", "name": "Gynecology", "icon": "UserCheck", "description": "Women's reproductive health and maternity", "status": "Doctor Review Required"},
            {"slug": "general", "name": "General Medicine", "icon": "Hospital", "description": "Broad clinical vitals and wellness assessment", "status": "Available"},
            {"slug": "emergency", "name": "Emergency Care", "icon": "AlertOctagon", "description": "Triage and critical care risk support", "status": "Available"}
        ]
        return dept_info

    def _get_department_for_slug(self, slug):
        for dept, slugs in self.department_map.items():
            if slug in slugs:
                return dept
        return "general"

    def predict(self, model_slug, input_dict):
        model = self.models.get(model_slug)
        scaler = self.scalers.get(model_slug)
        meta = self.metadata.get(model_slug, {})

        if not model:
            return {
                "available": False,
                "message": f"Model '{model_slug}' currently unavailable. Report routed for doctor review."
            }

        df = pd.DataFrame([input_dict])
        feature_names = meta.get("features", list(df.columns))
        df_reindexed = df.reindex(columns=feature_names, fill_value=0)

        if scaler:
            scaled_input = scaler.transform(df_reindexed)
        else:
            scaled_input = df_reindexed.values

        prediction_raw = model.predict(scaled_input)[0]
        
        probability = 0.5
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(scaled_input)[0]
            if len(proba) == 2:
                probability = float(proba[1])
            else:
                probability = float(max(proba))

        # Risk level assessment
        risk_level = "LOW"
        if probability > 0.75 or prediction_raw == 1:
            risk_level = "HIGH"
        elif probability > 0.4:
            risk_level = "MODERATE"

        # Factors computation
        important_factors = []
        if hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
            feature_imp = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)
            important_factors = [f"{feat} (weight {imp:.2f})" for feat, imp in feature_imp[:3]]
        else:
            for k, v in input_dict.items():
                if v and isinstance(v, (int, float)) and v > 0:
                    important_factors.append(f"{k}: {v}")

        return {
            "available": True,
            "model_name": meta.get("model_name", f"{model_slug.title()} Risk Model"),
            "model_version": meta.get("version", "1.0"),
            "prediction": "Positive Risk Detected" if prediction_raw == 1 or prediction_raw == "Positive" else "Normal / Low Risk",
            "probability": round(probability, 4),
            "risk_level": risk_level,
            "important_factors": important_factors[:4],
            "explanation": f"AI decision-support analysis based on {meta.get('algorithm', 'Machine Learning')} model. Subject to clinical verification.",
            "requires_doctor_review": True
        }

model_registry = MLModelRegistry()

