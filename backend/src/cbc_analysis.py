import re
from typing import Dict, List, Optional, Tuple


def _normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _find_value_line(lines: List[str], patterns: List[str]) -> Optional[str]:
    for idx, line in enumerate(lines):
        if any(re.search(pattern, line, re.IGNORECASE) for pattern in patterns):
            combined = line
            # Some reports split label and value across lines.
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


def _status_from_range(value: Optional[float], ref_range: Optional[Tuple[float, float]]) -> str:
    if value is None:
        return "Unknown"
    if not ref_range:
        return "Unknown"

    low, high = ref_range
    if value < low:
        return "Low"
    if value > high:
        return "High"
    return "Normal"


MEASUREMENTS = {
    "Hemoglobin": {
        "patterns": [r"Hemoglobin", r"\bHb\b", r"\bHGB\b"],
        "unit": "g/dL",
        "default_range": (12.0, 17.0),
    },
    "RBC": {
        "patterns": [r"RBC\s*COUNT", r"Total\s*RBC", r"\bRBC\b"],
        "unit": "mill/cumm",
        "default_range": (4.0, 5.9),
    },
    "WBC": {
        "patterns": [r"WBC\s*COUNT", r"Total\s*WBC", r"\bWBC\b", r"\bTLC\b"],
        "unit": "cumm",
        "default_range": (4000.0, 11000.0),
    },
    "Platelets": {
        "patterns": [r"Platelet\s*Count", r"Platelets", r"\bPLT\b"],
        "unit": "cumm",
        "default_range": (150000.0, 410000.0),
    },
    "ESR": {
        "patterns": [r"\bESR\b"],
        "unit": "mm/hr",
        "default_range": (0.0, 20.0),
    },
    "MCV": {
        "patterns": [r"\bMCV\b"],
        "unit": "fL",
        "default_range": (80.0, 100.0),
    },
    "MCH": {
        "patterns": [r"\bMCH\b"],
        "unit": "pg",
        "default_range": (27.0, 33.0),
    },
    "RDW": {
        "patterns": [r"\bRDW\b"],
        "unit": "%",
        "default_range": (11.5, 14.5),
    },
    "Neutrophils": {
        "patterns": [r"Neutrophils"],
        "unit": "%",
        "default_range": (40.0, 70.0),
    },
    "Lymphocytes": {
        "patterns": [r"Lymphocytes"],
        "unit": "%",
        "default_range": (20.0, 40.0),
    },
    "Monocytes": {
        "patterns": [r"Monocytes"],
        "unit": "%",
        "default_range": (2.0, 8.0),
    },
    "Eosinophils": {
        "patterns": [r"Eosinophils"],
        "unit": "%",
        "default_range": (1.0, 6.0),
    },
    "Basophils": {
        "patterns": [r"Basophils"],
        "unit": "%",
        "default_range": (0.0, 2.0),
    },
}


def extract_cbc_from_text(text: str) -> Dict[str, Dict[str, object]]:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    data: Dict[str, Dict[str, object]] = {}

    for name, meta in MEASUREMENTS.items():
        line = _find_value_line(lines, meta["patterns"])
        value, ref_range = _extract_value_and_range(line or "")
        if value is None:
            continue

        if not ref_range:
            ref_range = meta.get("default_range")

        status = _status_from_range(value, ref_range)
        data[name] = {
            "value": value,
            "unit": meta.get("unit"),
            "range": ref_range,
            "status": status,
        }

    return data


def process_manual_cbc(data: Dict[str, float]) -> Dict[str, Dict[str, object]]:
    """
    Process manually entered CBC data.
    """
    processed_data = {}

    for name, value in data.items():
        if value is None:
            continue

        meta = MEASUREMENTS.get(name)
        if not meta:
            continue

        ref_range = meta.get("default_range")
        unit = meta.get("unit")
        status = _status_from_range(value, ref_range)

        processed_data[name] = {
            "value": value,
            "unit": unit,
            "range": ref_range,
            "status": status,
        }

    return processed_data


def interpret_cbc(cbc_data: Dict[str, Dict[str, object]]) -> Dict[str, object]:
    flags: List[str] = []
    conditions: List[str] = []

    def _is_low(name: str) -> bool:
        return cbc_data.get(name, {}).get("status") == "Low"

    def _is_high(name: str) -> bool:
        return cbc_data.get(name, {}).get("status") == "High"

    def _value(name: str) -> Optional[float]:
        val = cbc_data.get(name, {}).get("value")
        return float(val) if isinstance(val, (int, float)) else None

    for name, payload in cbc_data.items():
        status = payload.get("status")
        if status in {"Low", "High"}:
            flags.append(f"{name}: {status}")

    from src.ml_service import predict_cbc_condition

    # 1. Run Rule-Based Interpretation
    if _is_low("Hemoglobin") or _is_low("RBC"):
        conditions.append("Possible Anemia")
    if _is_low("MCV") or _is_low("MCH") or _is_high("RDW"):
        conditions.append("Possible Iron Deficiency Pattern")
    if _is_high("WBC") or _is_high("Neutrophils"):
        conditions.append("Possible Infection")
    if _is_low("WBC"):
        conditions.append("Possible Leukopenia")
    if _is_low("Platelets"):
        conditions.append("Possible Thrombocytopenia")
    if _is_high("Platelets"):
        conditions.append("Possible Thrombocytosis")
    if _is_high("Hemoglobin") or _is_high("RBC"):
        conditions.append("Possible Polycythemia")
    if _is_high("ESR"):
        conditions.append("Possible Inflammation")

    wbc_value = _value("WBC")
    if wbc_value is not None:
        if wbc_value >= 50000:
            conditions.append("Possible Leukemia (needs clinical confirmation)")
        elif wbc_value >= 25000 and (_is_low("Platelets") or _is_low("Hemoglobin")):
            conditions.append("Possible Leukemia (needs clinical confirmation)")

    # 2. Run ML-Based Interpretation
    ml_input = {
        'Hemoglobin': _value("Hemoglobin") or 14.0,
        'RBC': _value("RBC") or 5.0,
        'WBC': wbc_value or 7000,
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
    ml_prediction = ml_output["prediction"]
    ml_insights = {
        "algorithm": ml_output["algorithm"],
        "probability": ml_output["probability"]
    }
    
    if ml_prediction and ml_prediction != "Normal" and ml_prediction != "Unknown":
        conditions.append(f"You may have: {ml_prediction}")

    if not flags:
        summary = "All parsed CBC values are within reference ranges."
    else:
        summary = "Abnormal findings: " + ", ".join(flags) + "."
        if ml_prediction and ml_prediction != "Normal" and ml_prediction != "Unknown":
            summary += f" You may have {ml_prediction}."

    return {
        "flags": flags,
        "possible_conditions": sorted(set(conditions)),
        "summary": summary,
        "ml_prediction": ml_prediction,
        "ml_model_insights": ml_insights,
        "note": "This interpretation is informational and not a medical diagnosis.",
    }
