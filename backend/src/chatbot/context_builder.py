import json
from typing import Dict, Any
from src.database import get_db_connection

def build_patient_medical_context(user_id: int) -> str:
    """
    Fetches patient profile and all recent health assessment reports from MySQL,
    formatting them into a structured text context block for LLM prompts.
    """
    conn = get_db_connection()
    if not conn:
        return "Patient records unavailable."

    context_lines = []

    try:
        cursor = conn.cursor(dictionary=True)
        
        # 1. User Profile
        cursor.execute("SELECT full_name, email, blood_group, mobile_no FROM users WHERE id = %s", (user_id,))
        user_row = cursor.fetchone()
        if user_row:
            context_lines.append(f"### PATIENT PROFILE")
            context_lines.append(f"- Name: {user_row.get('full_name', 'Patient')}")
            context_lines.append(f"- Blood Group: {user_row.get('blood_group', 'N/A')}")
            context_lines.append(f"- Email: {user_row.get('email', 'N/A')}\n")

        # Total Reports Count Summary for Trend Analysis
        cursor.execute("SELECT COUNT(*) AS count FROM patient_reports WHERE user_id = %s", (user_id,))
        d_count = cursor.fetchone().get('count', 0)
        cursor.execute("SELECT COUNT(*) AS count FROM heart_reports WHERE user_id = %s", (user_id,))
        h_count = cursor.fetchone().get('count', 0)
        cursor.execute("SELECT COUNT(*) AS count FROM cbc_reports WHERE user_id = %s", (user_id,))
        cbc_count = cursor.fetchone().get('count', 0)
        
        context_lines.append("### PATIENT RECORD SUMMARY")
        context_lines.append(f"- Total Diabetes Scans: {d_count} | Cardiac Scans: {h_count} | CBC Reports: {cbc_count}\n")

        # 2. Latest Diabetes Report
        cursor.execute("SELECT * FROM patient_reports WHERE user_id = %s ORDER BY created_at DESC LIMIT 1", (user_id,))
        d_row = cursor.fetchone()
        if d_row:
            context_lines.append("### LATEST DIABETES ASSESSMENT")
            context_lines.append(f"- Glucose Level: {d_row.get('glucose', 'N/A')} mg/dL")
            context_lines.append(f"- Blood Pressure (Systolic): {d_row.get('blood_pressure', 'N/A')} mmHg")
            context_lines.append(f"- BMI: {d_row.get('bmi', 'N/A')}")
            context_lines.append(f"- Prediction Result: {d_row.get('diabetes_prediction', 'N/A')}")
            context_lines.append(f"- Risk Level: {d_row.get('risk_level', 'N/A')}")
            context_lines.append(f"- Confidence Probability: {d_row.get('probability', 'N/A')}\n")

        # 3. Latest Heart Disease Report
        cursor.execute("SELECT * FROM heart_reports WHERE user_id = %s ORDER BY created_at DESC LIMIT 1", (user_id,))
        h_row = cursor.fetchone()
        if h_row:
            context_lines.append("### LATEST CARDIAC RISK ASSESSMENT")
            context_lines.append(f"- Resting Blood Pressure: {h_row.get('trestbps', 'N/A')} mmHg")
            context_lines.append(f"- Serum Cholesterol: {h_row.get('chol', 'N/A')} mg/dL")
            context_lines.append(f"- Max Heart Rate: {h_row.get('thalach', 'N/A')} BPM")
            context_lines.append(f"- Prediction Result: {h_row.get('prediction', 'N/A')}")
            context_lines.append(f"- Confidence Probability: {h_row.get('probability', 'N/A')}\n")

        # 4. Latest Hypertension Report
        cursor.execute("SELECT * FROM hypertension_reports WHERE user_id = %s ORDER BY created_at DESC LIMIT 1", (user_id,))
        htn_row = cursor.fetchone()
        if htn_row:
            context_lines.append("### LATEST HYPERTENSION ASSESSMENT")
            context_lines.append(f"- Resting Heart Rate: {htn_row.get('heart_rate', 'N/A')} BPM")
            context_lines.append(f"- BMI: {htn_row.get('bmi', 'N/A')}")
            context_lines.append(f"- Prediction Result: {htn_row.get('prediction', 'N/A')}")
            context_lines.append(f"- Confidence Probability: {htn_row.get('probability', 'N/A')}\n")

        # 5. Latest CBC Report
        cursor.execute("SELECT * FROM cbc_reports WHERE user_id = %s ORDER BY created_at DESC LIMIT 1", (user_id,))
        cbc_row = cursor.fetchone()
        if cbc_row and cbc_row.get("interpretation_json"):
            raw_interp = cbc_row.get("interpretation_json")
            interp = json.loads(raw_interp) if isinstance(raw_interp, str) else (raw_interp or {})
            raw_cbc = cbc_row.get("cbc_json")
            cbc_vals = json.loads(raw_cbc) if isinstance(raw_cbc, str) else (raw_cbc or {})
            context_lines.append("### LATEST COMPLETE BLOOD COUNT (CBC)")
            context_lines.append(f"- Health Score: {interp.get('health_score', 'N/A')}/100")
            context_lines.append(f"- Clinical Urgency: {interp.get('urgency', 'N/A')}")
            context_lines.append(f"- Abnormal Parameter Flags: {', '.join(interp.get('flags', [])) if isinstance(interp.get('flags'), list) else 'None (All Normal)'}")
            context_lines.append(f"- Hematology Pattern Prediction: {interp.get('ml_prediction', 'N/A')}")
            if cbc_vals:
                context_lines.append(f"- Key Values: {json.dumps(cbc_vals) if isinstance(cbc_vals, dict) else str(cbc_vals)}")
            context_lines.append("")

        if len(context_lines) <= 2:
            return "No previous lab or diagnostic reports recorded in database."

        return "\n".join(context_lines)

    except Exception as e:
        print(f"[ERROR] Error building medical context: {e}")
        return "Error loading patient medical context."
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

