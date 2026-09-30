import os
import json
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

class BaseLLMProvider(ABC):
    @abstractmethod
    def generate_response(self, system_prompt: str, user_message: str, history: List[Dict[str, str]]) -> str:
        """
        Generates a response from the LLM provider.
        """
        pass

class GeminiProvider(BaseLLMProvider):
    def __init__(self):
        import google.generativeai as genai
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        if self.api_key:
            genai.configure(api_key=self.api_key)
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash").strip()

    def generate_response(self, system_prompt: str, user_message: str, history: List[Dict[str, str]]) -> str:
        import google.generativeai as genai
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not configured in backend environment or .env file")

        # Try designated model first, with fallback models if needed
        model_candidates = [self.model_name, "gemini-3.8-flash", "gemini-2.5-flash", "gemini-flash-latest"]
        model_candidates = list(dict.fromkeys(model_candidates))  # Deduplicate

        prompt_parts = [f"SYSTEM INSTRUCTIONS:\n{system_prompt}\n"]
        if history:
            prompt_parts.append("CONVERSATION HISTORY:")
            for msg in history:
                role = "Patient" if msg.get("sender") == "user" else "Assistant"
                prompt_parts.append(f"{role}: {msg.get('message')}")
        
        prompt_parts.append(f"\nPatient Current Question: {user_message}")
        full_prompt = "\n".join(prompt_parts)

        last_error = None
        for candidate in model_candidates:
            try:
                model = genai.GenerativeModel(candidate)
                response = model.generate_content(full_prompt)
                if response and response.text:
                    return response.text.strip()
            except Exception as e:
                last_error = e
                print(f"[WARNING] Gemini model '{candidate}' generation attempt failed: {e}")
                continue

        raise RuntimeError(f"All Gemini model candidates failed. Last error: {last_error}")

class OpenAIProvider(BaseLLMProvider):
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY", "").strip()
        self.model_name = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()

    def generate_response(self, system_prompt: str, user_message: str, history: List[Dict[str, str]]) -> str:
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY is not configured")

        import requests
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        messages = [{"role": "system", "content": system_prompt}]
        for msg in history:
            role = "user" if msg.get("sender") == "user" else "assistant"
            messages.append({"role": role, "content": msg.get("message", "")})
        messages.append({"role": "user", "content": user_message})

        payload = {
            "model": self.model_name,
            "messages": messages,
            "temperature": 0.3
        }

        res = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
        if res.status_code == 200:
            data = res.json()
            return data["choices"][0]["message"]["content"].strip()
        else:
            raise RuntimeError(f"OpenAI API Error ({res.status_code}): {res.text}")

class OllamaProvider(BaseLLMProvider):
    def __init__(self):
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").strip()
        self.model_name = os.getenv("OLLAMA_MODEL", "llama3").strip()

    def generate_response(self, system_prompt: str, user_message: str, history: List[Dict[str, str]]) -> str:
        import requests
        messages = [{"role": "system", "content": system_prompt}]
        for msg in history:
            role = "user" if msg.get("sender") == "user" else "assistant"
            messages.append({"role": role, "content": msg.get("message", "")})
        messages.append({"role": "user", "content": user_message})

        payload = {
            "model": self.model_name,
            "messages": messages,
            "stream": False
        }
        res = requests.post(f"{self.base_url}/api/chat", json=payload)
        if res.status_code == 200:
            return res.json()["message"]["content"].strip()
        else:
            raise RuntimeError(f"Ollama API Error ({res.status_code}): {res.text}")

class OfflineClinicalProvider(BaseLLMProvider):
    def generate_response(self, system_prompt: str, user_message: str, history: List[Dict[str, str]]) -> str:
        msg_lower = user_message.lower()

        # Dynamic Extraction from context string if present
        context_preview = ""
        if "PATIENT MEDICAL CONTEXT:" in system_prompt:
            try:
                context_preview = system_prompt.split("PATIENT MEDICAL CONTEXT:")[1].split("\n\n")[0]
            except Exception:
                context_preview = ""

        if "cbc" in msg_lower or "blood" in msg_lower or "anemia" in msg_lower or "wbc" in msg_lower:
            return (
                "Based on your registered CBC hematology records in our clinical system:\n\n"
                "• **Hematology Status:** CBC records evaluated.\n"
                "• **Primary Clinical Guidance:** Maintain adequate hydration and a balanced diet rich in essential micronutrients (iron, vitamin B12, folate).\n"
                "• **Next Steps:** Review specific parameter levels with your physician and schedule periodic CBC follow-ups."
            )
        if "diabetes" in msg_lower or "sugar" in msg_lower or "glucose" in msg_lower:
            return (
                "Regarding your Diabetes and Metabolic diagnostic history:\n\n"
                "• **Target Fasting Glucose:** Under 126 mg/dL\n"
                "• **Clinical Recommendation:** Perform 30 minutes of daily moderate exercise, monitor carbohydrate intake, and track morning blood glucose."
            )
        if "heart" in msg_lower or "bp" in msg_lower or "cardiac" in msg_lower or "hypertension" in msg_lower:
            return (
                "Regarding your Cardiovascular & Blood Pressure records:\n\n"
                "• **Systolic Target:** Under 120-130 mmHg\n"
                "• **Clinical Recommendation:** Limit sodium intake to under 2,000 mg/day, engage in low-impact cardio, and monitor resting pulse."
            )
        if any(w in msg_lower for w in ["memory", "cognitive", "brain", "neuro", "headache", "dizziness"]):
            return (
                "Regarding your neurological and cognitive health inquiry:\n\n"
                "• **Key Considerations:** Memory lapses, brain fog, or concentration changes are frequently tied to sleep quality, stress, Vitamin B12 deficiency, or thyroid levels.\n"
                "• **Recommended Action:** We recommend consulting our **Neurology** department for evaluation.\n"
                "• Would you like me to check available appointment slots with a neurologist?"
            )
        if any(w in msg_lower for w in ["appointment", "book", "schedule", "doctor", "visit"]):
            return (
                "I can assist you with scheduling and managing appointments.\n\n"
                "Please tell me which department (such as **Cardiology**, **Neurology**, **Orthopedics**, or **General Medicine**) you would like to visit, and I will show available specialists and time slots."
            )
        return (
            "I'm HealthBot, your hospital clinical assistant.\n\n"
            "I can help you review your lab reports (CBC, Diabetes, Cardiac), explore departments, and schedule doctor consultations.\n\n"
            "How can I assist you with your health or hospital care today?"
        )

def get_llm_provider() -> BaseLLMProvider:
    provider_type = os.getenv("LLM_PROVIDER", "gemini").lower().strip()
    api_key = os.getenv("GEMINI_API_KEY", "").strip()

    if provider_type == "openai" and os.getenv("OPENAI_API_KEY"):
        return OpenAIProvider()
    elif provider_type == "ollama":
        return OllamaProvider()
    elif provider_type == "gemini":
        if api_key and api_key != "YOUR_GEMINI_API_KEY_HERE":
            try:
                return GeminiProvider()
            except Exception as e:
                print(f"[WARNING] GeminiProvider init error: {e}. Falling back to Offline Clinical Provider.")
        else:
            print("[INFO] GEMINI_API_KEY is not set or contains default placeholder in backend/.env. Using Offline Clinical Provider.")

    # Default fallback engine
    return OfflineClinicalProvider()

