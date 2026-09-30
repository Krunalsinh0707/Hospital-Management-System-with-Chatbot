import os
from typing import List, Dict, Any, Optional

CLINICAL_SYSTEM_PROMPT = """You are HealthBot Clinical Decision Support Assistant, an AI healthcare consultation assistant in a hospital management system.
You provide compassionate, accurate, and evidence-grounded health information to patients while they consult with clinicians.

CRITICAL CLINICAL SAFETY RULES:
1. You are an informational assistant, NOT a physician. You cannot formulate definitive medical diagnoses or prescribe medications.
2. Emphasize that all advice is informational and that hospital clinicians are reviewing their case.
3. If the patient describes severe, acute, or unstable symptoms (chest pain, severe breathlessness, sudden weakness, heavy bleeding), advise immediate in-person emergency care (calling 911 / 112 / 108).
4. Be clear, reassuring, structured, and easy to understand.
"""

class ClinicalLLMService:
    """
    Safe, bounded LLM orchestration service for patient consultations.
    Fails closed to deterministic clinical templates when external providers are offline.
    """
    def __init__(self):
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")
        self.openai_api_key = os.getenv("OPENAI_API_KEY")

    def generate_patient_reply(
        self,
        user_message: str,
        urgency: str,
        category: str,
        conversation_history: List[Dict[str, str]],
        rag_chunks: Optional[List[str]] = None,
        emergency_notice: Optional[str] = None
    ) -> str:
        """
        Generates an assistant reply grounded in the patient's message and context.
        If an emergency notice is provided, prepends the emergency directive prominently.
        """
        # If it's an emergency, prepend the emergency notice
        emergency_prefix = ""
        if emergency_notice:
            emergency_prefix = f"{emergency_notice}\n\n---\n\n"

        # Attempt to call configured LLM provider
        try:
            if self.gemini_api_key:
                response = self._call_gemini(user_message, urgency, category, conversation_history, rag_chunks)
                if response:
                    return f"{emergency_prefix}{response}"
            elif self.openai_api_key:
                response = self._call_openai(user_message, urgency, category, conversation_history, rag_chunks)
                if response:
                    return f"{emergency_prefix}{response}"
        except Exception as e:
            print(f"[WARNING] External LLM provider error: {e}. Falling back to clinical template.")

        # Fallback to bounded deterministic template
        fallback_reply = self._generate_fallback_template(user_message, urgency, category)
        return f"{emergency_prefix}{fallback_reply}"

    def _call_gemini(
        self,
        user_message: str,
        urgency: str,
        category: str,
        conversation_history: List[Dict[str, str]],
        rag_chunks: Optional[List[str]]
    ) -> Optional[str]:
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.gemini_api_key)
            configured_model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
            candidates = [configured_model, "gemini-3.8-flash", "gemini-2.5-flash", "gemini-flash-latest"]
            candidates = list(dict.fromkeys(candidates))

            # Limit history to last 6 turns
            recent_history = conversation_history[-6:] if conversation_history else []
            chat_messages = []
            for m in recent_history:
                role = "user" if m.get("sender") == "patient" else "model"
                chat_messages.append({"role": role, "parts": [m.get("body", "")]})

            rag_text = ""
            if rag_chunks:
                rag_text = f"\nRelevant medical context from records:\n" + "\n".join(rag_chunks[:2])

            prompt = (
                f"Clinical Context: Category={category}, Urgency={urgency}.\n"
                f"{rag_text}\n\n"
                f"Patient Message: {user_message}"
            )

            for cand in candidates:
                try:
                    model = genai.GenerativeModel(
                        model_name=cand,
                        system_instruction=CLINICAL_SYSTEM_PROMPT
                    )
                    chat = model.start_chat(history=chat_messages)
                    response = chat.send_message(prompt)
                    if response and response.text:
                        return response.text.strip()
                except Exception as model_err:
                    print(f"[WARNING] Gemini model '{cand}' failed: {model_err}")
                    continue
            return None
        except Exception as e:
            print(f"[WARNING] Gemini generation setup failed: {e}")
            return None

    def _call_openai(
        self,
        user_message: str,
        urgency: str,
        category: str,
        conversation_history: List[Dict[str, str]],
        rag_chunks: Optional[List[str]]
    ) -> Optional[str]:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=self.openai_api_key)
            model_name = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

            messages = [{"role": "system", "content": CLINICAL_SYSTEM_PROMPT}]
            recent_history = conversation_history[-6:] if conversation_history else []
            for m in recent_history:
                role = "user" if m.get("sender") == "patient" else "assistant"
                messages.append({"role": role, "content": m.get("body", "")})

            rag_text = ""
            if rag_chunks:
                rag_text = f"\nRelevant medical context from records:\n" + "\n".join(rag_chunks[:2])

            messages.append({
                "role": "user",
                "content": f"Category: {category}, Urgency: {urgency}.\n{rag_text}\n\nPatient Query: {user_message}"
            })

            res = client.chat.completions.create(
                model=model_name,
                messages=messages,
                temperature=0.3,
                max_tokens=400
            )
            return res.choices[0].message.content.strip()
        except Exception as e:
            print(f"[WARNING] OpenAI generation failed: {e}")
            return None

    def _generate_fallback_template(self, user_message: str, urgency: str, category: str) -> str:
        """
        Deterministic, safe medical advice template tailored to urgency tier and query.
        """
        if urgency == "EMERGENCY_REVIEW":
            return (
                "Your consultation has been routed to our Emergency clinical queue for immediate triage. "
                "A clinician has been notified. If your symptoms worsen or you are experiencing acute distress, "
                "please proceed directly to an emergency department or call emergency services immediately."
            )
        elif urgency == "HIGH_PRIORITY":
            return (
                f"Your consultation regarding potential {category.lower()} concerns has been flagged for prioritized review. "
                "Our clinical care team has received an alert and will review your conversation shortly. "
                "Please rest and avoid strenuous activity while awaiting clinician feedback."
            )
        elif urgency == "MODERATE":
            return (
                f"Thank you for sharing your symptoms regarding {category.lower()}. "
                "Your message has been assigned to our department clinical team for review. "
                "Keep track of any changes in your symptoms (such as temperature, pain intensity, or frequency) "
                "to discuss with your physician."
            )
        elif urgency == "LOW_PRIORITY":
            return (
                f"Thank you for reaching out regarding your {category.lower()} query. "
                "Your conversation is on file with your healthcare team. Make sure to stay hydrated, get adequate rest, "
                "and consult your doctor or schedule an appointment if your symptoms persist."
            )
        else:
            return (
                f"Thank you for your message regarding your healthcare inquiry. "
                "I am here to assist you with booking doctor appointments, reviewing your clinical reports, "
                "or answering questions about our medical departments. How can I best assist you today?"
            )

llm_service = ClinicalLLMService()
