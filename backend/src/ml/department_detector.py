def detect_department(extracted_data: dict, text_content: str = "") -> str:
    """
    Analyzes structured parameters or raw text to detect relevant hospital department.
    Returns department slug (e.g., 'cardiology', 'endocrinology', 'hematology', 'pulmonology', 'general').
    """
    text_lower = (text_content or "").lower()
    keys_lower = [str(k).lower() for k in extracted_data.keys()]
    
    # Hematology / CBC parameters
    cbc_keywords = ["hemoglobin", "wbc", "rbc", "platelets", "hematocrit", "mcv", "mch", "neutrophils", "lymphocytes", "cbc"]
    if any(k in keys_lower or k in text_lower for k in cbc_keywords):
        return "hematology"

    # Endocrinology / Diabetes parameters
    endo_keywords = ["glucose", "insulin", "hba1c", "diabetes", "pedigree", "thyroid", "tsh"]
    if any(k in keys_lower or k in text_lower for k in endo_keywords):
        return "endocrinology"

    # Cardiology parameters
    cardio_keywords = ["blood_pressure", "trestbps", "chol", "cholesterol", "ecg", "heart_rate", "cardiac", "thalach", "angina"]
    if any(k in keys_lower or k in text_lower for k in cardio_keywords):
        return "cardiology"

    # Pulmonology parameters
    pulmo_keywords = ["chest x-ray", "spo2", "respiratory", "lungs", "asthma", "copd", "fev1"]
    if any(k in keys_lower or k in text_lower for k in pulmo_keywords):
        return "pulmonology"

    # Oncology
    onco_keywords = ["biopsy", "tumor", "carcinoma", "oncology", "chemo"]
    if any(k in keys_lower or k in text_lower for k in onco_keywords):
        return "oncology"

    # Orthopedics
    ortho_keywords = ["bone", "fracture", "joint", "mri knee", "spine", "ortho"]
    if any(k in keys_lower or k in text_lower for k in ortho_keywords):
        return "orthopedics"

    return "general"
