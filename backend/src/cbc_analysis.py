import re
from typing import Dict, List, Optional, Tuple

def _normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()

def _find_value_line(lines: List[str], patterns: List[str]) -> Optional[str]:
    for idx, line in enumerate(lines):
        if any(re.search(pattern, line, re.IGNORECASE) for pattern in patterns):
            combined = line
            if idx + 1 < len(lines):
                combined = f"{line} {lines[idx + 1]}"
            return _normalize_text(combined)
    return None

def _extract_value_and_range(line: str) -> Tuple[Optional[float], Optional[Tuple[float, float]]]:
    if not line:
        return None, None

    numbers = re.findall(r"\d+(?:\.\d+)?", line)
    if not numbers:
        return None, None

    value = float(numbers[0])
    range_match = re.search(r"(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)", line)
    if range_match:
        low = float(range_match.group(1))
        high = float(range_match.group(2))
        return value, (low, high)

    return value, None

# ---------------- GENDER & AGE REFERENCE RANGES ----------------
REFERENCE_RANGES = {
    "Hemoglobin": {
        "unit": "g/dL",
        "male": (13.5, 17.5),
        "female": (12.0, 15.5),
        "default": (12.0, 17.0),
        "patterns": [r"Hemoglobin", r"\bHb\b", r"\bHGB\b"]
    },
    "RBC": {
        "unit": "mill/cumm",
        "male": (4.3, 5.9),
        "female": (3.8, 5.2),
        "default": (4.0, 5.9),
        "patterns": [r"RBC\s*COUNT", r"Total\s*RBC", r"\bRBC\b"]
    },
    "WBC": {
        "unit": "cumm",
        "default": (4000.0, 11000.0),
        "patterns": [r"WBC\s*COUNT", r"Total\s*WBC", r"\bWBC\b", r"\bTLC\b"]
    },
    "Platelets": {
        "unit": "cumm",
        "default": (150000.0, 450000.0),
        "patterns": [r"Platelet\s*Count", r"Platelets", r"\bPLT\b"]
    },
    "ESR": {
        "unit": "mm/hr",
        "male": (0.0, 15.0),
        "female": (0.0, 20.0),
        "default": (0.0, 20.0),
        "patterns": [r"\bESR\b"]
    },
    "MCV": {
        "unit": "fL",
        "default": (80.0, 100.0),
        "patterns": [r"\bMCV\b"]
    },
    "MCH": {
        "unit": "pg",
        "default": (27.0, 33.0),
        "patterns": [r"\bMCH\b"]
    },
    "RDW": {
        "unit": "%",
        "default": (11.5, 14.5),
        "patterns": [r"\bRDW\b"]
    },
    "Neutrophils": {
        "unit": "%",
        "default": (40.0, 70.0),
        "patterns": [r"Neutrophils"]
    },
    "Lymphocytes": {
        "unit": "%",
        "default": (20.0, 40.0),
        "patterns": [r"Lymphocytes"]
    },
    "Monocytes": {
        "unit": "%",
        "default": (2.0, 8.0),
        "patterns": [r"Monocytes"]
    },
    "Eosinophils": {
        "unit": "%",
        "default": (1.0, 6.0),
        "patterns": [r"Eosinophils"]
    },
    "Basophils": {
        "unit": "%",
        "default": (0.0, 2.0),
        "patterns": [r"Basophils"]
    }
}

def get_ref_range(param: str, gender: str = "male") -> Tuple[float, float]:
    meta = REFERENCE_RANGES.get(param, {})
    g = gender.lower() if gender else "male"
    if g in meta:
        return meta[g]
    return meta.get("default", (0.0, 100.0))

def classify_severity(value: float, ref_range: Tuple[float, float]) -> str:
    if value is None or not ref_range:
        return "Unknown"
    low, high = ref_range
    span = high - low if high > low else 1.0
    
    if value < low - (0.25 * span):
        return "Critical Low"
    elif value < low:
        return "Low"
    elif value > high + (0.25 * span):
        return "Critical High"
    elif value > high:
        return "High"
    return "Normal"

def extract_cbc_from_text(text: str, gender: str = "male") -> Dict[str, Dict[str, object]]:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    data: Dict[str, Dict[str, object]] = {}

    for name, meta in REFERENCE_RANGES.items():
        line = _find_value_line(lines, meta["patterns"])
        value, ref_range = _extract_value_and_range(line or "")
        if value is None:
            continue

        if not ref_range:
            ref_range = get_ref_range(name, gender)

        status = classify_severity(value, ref_range)
        data[name] = {
            "value": value,
            "unit": meta.get("unit"),
            "range": ref_range,
            "status": status,
        }

    return data

def process_manual_cbc(data: Dict[str, float], gender: str = "male") -> Dict[str, Dict[str, object]]:
    processed_data = {}

    for name, value in data.items():
        if value is None:
            continue

        meta = REFERENCE_RANGES.get(name)
        if not meta:
            continue

        ref_range = get_ref_range(name, gender)
        unit = meta.get("unit")
        status = classify_severity(value, ref_range)

        processed_data[name] = {
            "value": value,
            "unit": unit,
            "range": ref_range,
            "status": status,
        }

    return processed_data

def calculate_cbc_health_score(cbc_data: Dict[str, Dict[str, object]]) -> int:
    score = 100
    for name, item in cbc_data.items():
        st = item.get("status", "Normal")
        if "Critical" in st:
            score -= 18
        elif st in {"Low", "High"}:
            score -= 8
    return max(0, min(100, score))

def interpret_cbc(cbc_data: Dict[str, Dict[str, object]], gender: str = "male") -> Dict[str, object]:
    flags: List[str] = []
    critical_flags: List[str] = []
    conditions: List[str] = []

    def _is_status(name: str, target: str) -> bool:
        return target.lower() in cbc_data.get(name, {}).get("status", "").lower()

    def _value(name: str) -> Optional[float]:
        val = cbc_data.get(name, {}).get("value")
        return float(val) if isinstance(val, (int, float)) else None

    for name, payload in cbc_data.items():
        status = payload.get("status", "Normal")
        if "Critical" in status:
            critical_flags.append(f"{name}: {status}")
            flags.append(f"{name}: {status}")
        elif status in {"Low", "High"}:
            flags.append(f"{name}: {status}")

    # Rule-Based Diagnostics
    if _is_status("Hemoglobin", "Low") or _is_status("RBC", "Low"):
        if _is_status("MCV", "Low") or _is_status("MCH", "Low"):
            conditions.append("Microcytic Hypochromic Pattern (Possible Iron Deficiency Anemia)")
        elif _is_status("MCV", "High"):
            conditions.append("Macrocytic Pattern (Possible B12/Folate Deficiency)")
        else:
            conditions.append("Normocytic Anemia Pattern")

    if _is_status("WBC", "High") or _is_status("Neutrophils", "High"):
        conditions.append("Leukocytosis (Possible Bacterial Infection or Acute Inflammation)")
    elif _is_status("WBC", "Low"):
        conditions.append("Leukopenia (Possible Viral Infection or Bone Marrow Suppression)")

    if _is_status("Platelets", "Low"):
        conditions.append("Thrombocytopenia (Low Platelet Count - Risk of Bruising/Bleeding)")
    elif _is_status("Platelets", "High"):
        conditions.append("Thrombocytosis (Reactive or Primary High Platelets)")

    if _is_status("ESR", "High"):
        conditions.append("Elevated Inflammatory Marker (ESR)")

    wbc_val = _value("WBC")
    if wbc_val is not None and wbc_val >= 30000:
        conditions.append("Severe Leukocytosis (Requires Urgent Hematology Evaluation)")

    # Run ML Model Classifier
    from src.ml_service import predict_cbc_condition
    ml_input = {
        'Hemoglobin': _value("Hemoglobin") or 14.0,
        'RBC': _value("RBC") or 4.8,
        'WBC': wbc_val or 7000,
        'Platelets': _value("Platelets") or 250000,
        'MCV': _value("MCV") or 90,
        'MCH': _value("MCH") or 30,
        'RDW': _value("RDW") or 13,
        'Neutrophils': _value("Neutrophils") or 55,
        'Lymphocytes': _value("Lymphocytes") or 30,
        'Monocytes': _value("Monocytes") or 5,
        'Eosinophils': _value("Eosinophils") or 3,
        'Basophils': _value("Basophils") or 0.5
    }
    
    ml_output = predict_cbc_condition(ml_input)
    ml_prediction = ml_output.get("prediction", "Normal")
    
    if ml_prediction and ml_prediction not in {"Normal", "Unknown"}:
        conditions.append(f"AI ML Model Finding: {ml_prediction}")

    health_score = calculate_cbc_health_score(cbc_data)

    # Patient-Friendly Explanation
    if not flags:
        patient_explanation = "Great news! All your Complete Blood Count parameters are within healthy normal ranges. Your blood cells are functioning normally."
    else:
        abnormal_names = [f.split(":")[0] for f in flags]
        patient_explanation = f"Your lab results show deviations in {len(flags)} parameter(s): {', '.join(abnormal_names)}. "
        if any("Hemoglobin" in f or "RBC" in f for f in flags):
            patient_explanation += "Your red blood cell markers indicate reduced oxygen-carrying capacity. "
        if any("WBC" in f or "Neutrophils" in f for f in flags):
            patient_explanation += "Your white blood cell count suggests your immune system may be actively responding to an infection or stress. "
        if any("Platelets" in f for f in flags):
            patient_explanation += "Your platelet count is abnormal, which affects blood clotting. "
        patient_explanation += "Please consult your doctor to discuss these findings."

    # Doctor-Friendly Summary
    doctor_explanation = f"CLINICAL IMPRESSION: CBC Health Score = {health_score}/100. "
    if critical_flags:
        doctor_explanation += f"CRITICAL VALUES: {'; '.join(critical_flags)}. "
    if flags:
        doctor_explanation += f"ABNORMAL PARAMS: {'; '.join(flags)}. "
    doctor_explanation += f"DIAGNOSTIC PATTERNS: {'; '.join(set(conditions)) if conditions else 'Unremarkable'}. "
    doctor_explanation += f"ML CLASSIFIER PATTERN: {ml_prediction} (Confidence: {round(ml_output.get('probability', 0)*100, 1)}%)."

    # Urgency Stratification
    if critical_flags or (wbc_val and wbc_val > 30000):
        urgency = "Urgent / Emergency Evaluation"
    elif len(flags) >= 2:
        urgency = "Prompt Medical Review (1-2 weeks)"
    elif flags:
        urgency = "Routine Clinical Consultation"
    else:
        urgency = "Routine Annual Checkup"

    return {
        "health_score": health_score,
        "urgency": urgency,
        "flags": flags,
        "critical_flags": critical_flags,
        "possible_conditions": sorted(set(conditions)),
        "summary": doctor_explanation,
        "patient_explanation": patient_explanation,
        "doctor_explanation": doctor_explanation,
        "ml_prediction": ml_prediction,
        "ml_model_insights": ml_output,
        "recommendations": {
            "lifestyle": ["Maintain hydration", "Balanced diet rich in leafy greens and lean protein", "Adequate rest"],
            "medical": ["Repeat CBC in 3-4 weeks to observe trend", "Consult Primary Care Physician or Hematologist"],
            "avoid": ["Heavy strenuous activity if anemic", "Self-medication with unprescribed iron supplements"]
        },
        "note": "Informational Decision Support System. Not a substitute for formal clinical diagnosis."
    }
