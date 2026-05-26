def generate_clinical_advice(condition, risk_level, patient_data):
    """
    Generates structured, medically-aligned recommendations based on prediction outcomes.
    """
    risk_float = float(risk_level) if isinstance(risk_level, (int, float)) else 0.0
    is_high_risk = risk_float >= 0.7 or "Positive" in str(condition) or "High" in str(condition)
    
    advice = {
        "risk_summary": {
            "title": "Risk Assessment",
            "content": f"The system has identified a {condition} pattern with a confidence level of {round(risk_float * 100, 1)}%.",
            "urgency": "High" if is_high_risk else "Moderate",
            "explanation": f"Based on your biometrics, you fall into a {'High' if is_high_risk else 'Moderate'} Risk category for {condition}. This requires {'immediate' if is_high_risk else 'regular'} clinical monitoring."
        },
        "possible_causes": [],
        "precautions": {
            "lifestyle": [],
            "medical": [],
            "avoid": []
        },
        "action_plan": {
            "immediate": "",
            "short_term": "",
            "long_term": ""
        },
        "warning_signs": [],
        "ai_insight": ""
    }

    # Common logic for all conditions
    if float(patient_data.get('BMI', patient_data.get('bmi', 0))) > 30:
        advice["possible_causes"].append("Elevated Body Mass Index (BMI > 30)")
    if patient_data.get('Smoker', patient_data.get('smoker', 0)) == 1:
        advice["possible_causes"].append("Active Tobacco Consumption")
    if patient_data.get('FamilyHistory', patient_data.get('family_history', 0)) == 1:
        advice["possible_causes"].append("Genetic Predisposition / Family History")

    # Condition-Specific Content
    cond_lower = str(condition).lower()
    
    if "hypertension" in cond_lower:
        advice["precautions"]["lifestyle"] = ["Adopt DASH diet", "Low sodium intake (<1.5g/day)", "Daily brisk walking"]
        advice["precautions"]["medical"] = ["Daily BP monitoring", "Cardiology consultation", "ECG and Lipid profile"]
        advice["precautions"]["avoid"] = ["High-salt foods", "Tobacco", "Caffeine before monitoring"]
        advice["action_plan"]["immediate"] = "ER evaluation if BP > 180/120 or HR < 40/min."
        advice["action_plan"]["short_term"] = "Log BP readings for 7 days and see a specialist."
        advice["action_plan"]["long_term"] = "Sustain BMI reduction and nicotine cessation."
        advice["warning_signs"] = ["Severe headache", "Chest pain", "Blurred vision", "Shortness of breath"]
        advice["ai_insight"] = f"Model predicts high risk primarily due to {'BMI' if float(patient_data.get('bmi', 0)) > 30 else 'biometric markers'} and {'smoking' if patient_data.get('smoker') else 'vitals'}."

    elif "diabetes" in cond_lower:
        advice["precautions"]["lifestyle"] = ["Low glycemic index foods", "Consistent carb counting", "Regular physical activity"]
        advice["precautions"]["medical"] = ["HbA1c testing", "Fast and post-prandial glucose logs", "Annual eye exam"]
        advice["precautions"]["avoid"] = ["Refined sugars", "Processed snacks", "Prolonged sedentary behavior"]
        advice["action_plan"]["immediate"] = "Check ketones if glucose > 250 mg/dL."
        advice["action_plan"]["short_term"] = "Meet with a certified diabetes educator."
        advice["action_plan"]["long_term"] = "Maintain stable glucose levels to prevent neuropathy."
        advice["warning_signs"] = ["Excessive thirst", "Frequent urination", "Unexplained weight loss", "Slow-healing wounds"]
        advice["ai_insight"] = "Risk is elevated based on insulin sensitivity markers and metabolic history."

    elif "heart" in cond_lower or "cardio" in cond_lower:
        advice["precautions"]["lifestyle"] = ["Heart-healthy fats (Omega-3)", "Fiber-rich diet", "Stress management (Meditation)"]
        advice["precautions"]["medical"] = ["Stress Test / Echo", "Regular Heart Rate monitoring", "Medication adherence"]
        advice["precautions"]["avoid"] = ["Saturated fats", "Excessive sodium", "High-stress environments"]
        advice["action_plan"]["immediate"] = "Rest immediately if experiencing chest tightness."
        advice["action_plan"]["short_term"] = "Consult cardiologist for a comprehensive cardiac workup."
        advice["action_plan"]["long_term"] = "Cardiac rehabilitation or sustained aerobic exercise."
        advice["warning_signs"] = ["Chest pressure", "Pain radiating to left arm/jaw", "Dizziness", "Cold sweats"]
        advice["ai_insight"] = "Multiple cardiac risk factors (age, cholesterol, activity) converged in the predictive model."

    else:
        # Default Hematology/Other
        advice["precautions"]["lifestyle"] = ["Iron-rich or Vitamin-rich diet (if applicable)", "Hydration"]
        advice["precautions"]["medical"] = ["Follow-up blood smear", "Consult Hematologist", "Monitor fatigue levels"]
        advice["precautions"]["avoid"] = ["Strenuous activity if anemic", "Alcohol"]
        advice["action_plan"]["immediate"] = "Review results with a physician."
        advice["action_plan"]["short_term"] = "Repeat tests in 4-6 weeks to observe trends."
        advice["action_plan"]["long_term"] = "Address underlying nutritional or chronic deficiencies."
        advice["warning_signs"] = ["Extreme pallor", "Fainting", "Unusual bruising", "Persistent infection"]
        advice["ai_insight"] = "CBC parameters indicate systemic deviations from standard reference ranges."

    return advice
