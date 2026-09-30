import re
from typing import Dict, Any, List, Optional

EMERGENCY_PATTERNS = [
    (r"\bchest\s*(?:pain|pressure|tightness|heaviness)\b", "RULE_CHEST_PAIN", "Cardiology / Emergency"),
    (r"\bheart\s*attack\b", "RULE_HEART_ATTACK", "Cardiology / Emergency"),
    (r"\bshortness\s*of\s*breath\b|\bcan(?:'?t|not)\s*breathe\b|\bdifficulty\s*breathing\b|\bsevere\s*dyspnea\b", "RULE_RESPIRATORY_DISTRESS", "Emergency / Pulmonology"),
    (r"\bstroke\b|\bface\s*droop(?:ing)?\b|\bslurred\s*speech\b|\bsudden\s*(?:numbness|paralysis)\b|\barm\s*weakness\b", "RULE_STROKE_SYMPTOMS", "Neurology / Emergency"),
    (r"\bsevere\s*bleeding\b|\buncontrolled\s*bleeding\b|\bhemorrhag(?:e|ing)\b", "RULE_ACUTE_HEMORRHAGE", "Emergency"),
    (r"\bpass(?:ed)?\s*out\b|\blose\s*consciousness\b|\blost\s*consciousness\b|\bunresponsive\b|\bsyncope\b", "RULE_LOSS_OF_CONSCIOUSNESS", "Emergency"),
    (r"\banaphylax(?:is|tic)\b|\bthroat\s*closing\b|\bswelling\s*(?:of\s*)?(?:tongue|throat)\b", "RULE_ANAPHYLAXIS", "Emergency / Allergy"),
    (r"\bsuicid(?:e|al)\b|\bwant\s*to\s*(?:die|end\s*my\s*life|kill\s*myself)\b", "RULE_SUICIDAL_CRISIS", "Emergency / Psychiatry"),
    (r"\bpoison(?:ed|ing)?\b|\boverdose\b|\btoxic\s*ingestion\b", "RULE_TOXIC_EXPOSURE", "Emergency / Toxicology")
]

HIGH_PRIORITY_PATTERNS = [
    (r"\bhigh\s*fever\b|\bfever\s*(?:above|>)\s*(?:103|104|39\.5|40)\b|\bfever\s*with\s*(?:confusion|stiff\s*neck)\b", "RULE_HIGH_FEVER_COMPLICATION", "General Medicine / Infectious"),
    (r"\bsevere\s*abdominal\s*pain\b|\bacute\s*belly\b|\bappendicitis\b", "RULE_ACUTE_ABDOMEN", "Gastroenterology / Emergency"),
    (r"\bdiabetic\s*ketoacidosis\b|\bdka\b|\bglucose\s*(?:above|>)\s*(?:350|400)\b|\bextreme\s*thirst\s*and\s*confusion\b", "RULE_METABOLIC_CRISIS", "Endocrinology"),
    (r"\bhypertensive\s*crisis\b|\bblood\s*pressure\s*(?:above|>)\s*(?:180|200)\b", "RULE_HYPERTENSIVE_CRISIS", "Cardiology"),
    (r"\bsevere\s*asthma\b|\binhaler\s*not\s*working\b|\bstatus\s*asthmaticus\b", "RULE_SEVERE_ASTHMA", "Pulmonology"),
    (r"\bacute\s*confusion\b|\bdelirium\b|\bhallucinating\b", "RULE_ACUTE_MENTAL_STATUS_CHANGE", "Neurology / Psychiatry")
]

MODERATE_PATTERNS = [
    (r"\bchronic\s*cough\b|\bcough\s*(?:lasting|for)\s*(?:weeks?|months?)\b|\bcoughing\s*up\s*blood\b|\bhemoptysis\b", "RULE_PERSISTENT_COUGH", "Pulmonology"),
    (r"\bfever\b|\btemperature\s*(?:10[0-2]|38)\b|\bchills\b", "RULE_MODERATE_FEVER", "General Medicine"),
    (r"\bblood\s*in\s*(?:stool|urine)\b|\bhematuria\b|\brectal\s*bleeding\b", "RULE_BLOOD_IN_EXCRETA", "Gastroenterology / Nephrology"),
    (r"\bdiabetes\b|\bhigh\s*sugar\b|\bhba1c\b|\binsulin\b", "RULE_DIABETES_MANAGEMENT", "Endocrinology"),
    (r"\bhypertension\b|\bhigh\s*bp\b|\bblood\s*pressure\b", "RULE_BLOOD_PRESSURE", "Cardiology"),
    (r"\brash\s*spreading\b|\bblister(?:s|ing)?\b|\beczema\s*flare\b", "RULE_SPREADING_DERMATITIS", "Dermatology"),
    (r"\bjoint\s*(?:swelling|pain)\b|\barthr(?:itis|algia)\b|\bsprain\b|\bfracture\b", "RULE_MUSCULOSKELETAL", "Orthopedics")
]

LOW_PRIORITY_PATTERNS = [
    (r"\bmild\s*(?:headache|ache|pain)\b|\btension\s*headache\b", "RULE_MILD_PAIN", "General Medicine"),
    (r"\bsore\s*throat\b|\brunny\s*nose\b|\bmild\s*cold\b|\bsneezing\b", "RULE_COLD_SYMPTOMS", "General Medicine"),
    (r"\bprescription\s*(?:refill|renewal)\b|\brefill\s*my\s*medication\b", "RULE_REFILL_REQUEST", "General Medicine"),
    (r"\bdiet\b|\blifestyle\b|\bexercise\b|\bvitamin\b|\bsupplement\b", "RULE_WELLNESS_ADVICE", "General Medicine"),
    (r"\bchild\b|\btoddler\b|\binfant\b|\bbaby\b|\bpediatric\b", "RULE_PEDIATRIC_QUERY", "Pediatrics")
]

EMERGENCY_DISCLAIMER = (
    "⚠️ **CRITICAL EMERGENCY MEDICAL NOTICE**\n\n"
    "Your message indicates symptoms that may constitute a time-sensitive medical emergency "
    "(such as suspected heart attack, respiratory failure, acute stroke, uncontrolled hemorrhage, "
    "or severe trauma).\n\n"
    "**Immediate Life-Safety Protocol:**\n"
    "1. **Immediately call local emergency services** (e.g., **911** in the US, **112** in Europe, or **108** in India).\n"
    "2. If safe, have someone transport you to the nearest **Emergency Room / Hospital Trauma Center**.\n"
    "3. **Do not wait for an online reply.** Online chat cannot replace in-person acute resuscitation or physician intervention."
)

class ClinicalClassifier:
    """
    Deterministic rule-based clinical classification and triage engine.
    Ensures safe, auditable urgency detection that cannot be silently overridden by generative LLMs.
    """
    def __init__(self, version: str = "1.0-deterministic"):
        self.version = version

    def classify(self, message: str) -> Dict[str, Any]:
        """
        Classifies an incoming clinical message into one of 5 strict urgency tiers:
        - EMERGENCY_REVIEW
        - HIGH_PRIORITY
        - MODERATE
        - LOW_PRIORITY
        - NORMAL
        """
        msg_clean = message.lower().strip()
        evidence_codes = []
        category = "General Medicine"

        # 1. Tier 1: Emergency Review Check
        for pattern, code, cat in EMERGENCY_PATTERNS:
            if re.search(pattern, msg_clean, re.IGNORECASE):
                evidence_codes.append(code)
                category = cat

        if evidence_codes:
            return {
                "urgency": "EMERGENCY_REVIEW",
                "category": category,
                "confidence": 0.99,
                "evidence_codes": evidence_codes,
                "human_review_required": True,
                "escalation_needed": True,
                "emergency_notice": EMERGENCY_DISCLAIMER,
                "model_rule_version": self.version
            }

        # 2. Tier 2: High Priority Check
        for pattern, code, cat in HIGH_PRIORITY_PATTERNS:
            if re.search(pattern, msg_clean, re.IGNORECASE):
                evidence_codes.append(code)
                category = cat

        if evidence_codes:
            return {
                "urgency": "HIGH_PRIORITY",
                "category": category,
                "confidence": 0.90,
                "evidence_codes": evidence_codes,
                "human_review_required": True,
                "escalation_needed": True,
                "emergency_notice": None,
                "model_rule_version": self.version
            }

        # 3. Tier 3: Moderate Priority Check
        for pattern, code, cat in MODERATE_PATTERNS:
            if re.search(pattern, msg_clean, re.IGNORECASE):
                evidence_codes.append(code)
                category = cat

        if evidence_codes:
            return {
                "urgency": "MODERATE",
                "category": category,
                "confidence": 0.80,
                "evidence_codes": evidence_codes,
                "human_review_required": False,
                "escalation_needed": False,
                "emergency_notice": None,
                "model_rule_version": self.version
            }

        # 4. Tier 4: Low Priority Check
        for pattern, code, cat in LOW_PRIORITY_PATTERNS:
            if re.search(pattern, msg_clean, re.IGNORECASE):
                evidence_codes.append(code)
                category = cat

        if evidence_codes:
            return {
                "urgency": "LOW_PRIORITY",
                "category": category,
                "confidence": 0.75,
                "evidence_codes": evidence_codes,
                "human_review_required": False,
                "escalation_needed": False,
                "emergency_notice": None,
                "model_rule_version": self.version
            }

        # 5. Default Tier 5: Normal
        return {
            "urgency": "NORMAL",
            "category": "General Medicine",
            "confidence": 0.70,
            "evidence_codes": ["DEFAULT_NORMAL_ROUTING"],
            "human_review_required": False,
            "escalation_needed": False,
            "emergency_notice": None,
            "model_rule_version": self.version
        }

classifier = ClinicalClassifier()
