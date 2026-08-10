from typing import Dict, Any, Optional
from src.chatbot.llm_provider import get_llm_provider, OfflineClinicalProvider
from src.chatbot.context_builder import build_patient_medical_context
from src.chatbot.vector_store import vector_store
from src.chatbot.prompt_builder import build_system_prompt
from src.chatbot.memory_service import (
    create_conversation,
    get_conversation_messages,
    save_chat_message,
    update_conversation_title
)
import re

EMERGENCY_KEYWORDS = [
    r"\bchest\s*pain\b", r"\bshortness\s*of\s*breath\b", r"\bdifficulty\s*breathing\b",
    r"\bheart\s*attack\b", r"\bstroke\b", r"\barm\s*numbness\b", r"\bsevere\s*bleeding\b",
    r"\bblurry\s*vision\s*sudden\b", r"\bpass\s*out\b", r"\blose\s*consciousness\b",
    r"\bsuicid(e|al)\b", r"\bpoison(ed|ing)\b"
]

def scan_emergency_trigger(user_message: str) -> Optional[str]:
    msg_lower = user_message.lower()
    for pattern in EMERGENCY_KEYWORDS:
        if re.search(pattern, msg_lower):
            return (
                "⚠️ **EMERGENCY MEDICAL NOTICE**\n\n"
                "Your message indicates symptoms that may require immediate emergency medical evaluation (such as severe chest pain, shortness of breath, acute numbness, or sudden distress).\n\n"
                "**Immediate Action Steps:**\n"
                "• Call emergency medical services immediately (e.g. **911** / **112** / **108**).\n"
                "• Go to the nearest Emergency Room or Urgent Care center.\n"
                "• Do not rely on automated AI tools for acute life-threatening situations."
            )
    return None

def process_chat_message(user_id: int, user_message: str, conversation_id: Optional[int] = None) -> Dict[str, Any]:
    # 1. Emergency Safety Check
    emergency_response = scan_emergency_trigger(user_message)
    if emergency_response:
        return {
            "response": emergency_response,
            "conversation_id": conversation_id,
            "is_emergency": True
        }

    # 2. Get or Create Conversation Session safely
    try:
        if not conversation_id:
            title = user_message[:35] + "..." if len(user_message) > 35 else user_message
            new_conv = create_conversation(user_id, title=title)
            conversation_id = new_conv["id"]
        else:
            existing_msgs = get_conversation_messages(conversation_id, user_id)
            if len(existing_msgs) == 0:
                title = user_message[:35] + "..." if len(user_message) > 35 else user_message
                update_conversation_title(conversation_id, user_id, title)
    except Exception as e:
        print(f"[WARNING] Session memory error: {e}")
        conversation_id = conversation_id or 1

    # 3. Retrieve DB Medical Context & RAG Vector Chunks safely
    try:
        medical_context = build_patient_medical_context(user_id)
    except Exception as e:
        print(f"[WARNING] Context builder error: {e}")
        medical_context = "Patient lab records on file."

    try:
        rag_chunks = vector_store.query_relevant_chunks(user_id, user_message, n_results=3)
    except Exception as e:
        print(f"[WARNING] RAG vector search error: {e}")
        rag_chunks = []

    # 4. Build System Prompt
    system_prompt = build_system_prompt(medical_context, rag_chunks)

    # 5. Fetch Session Chat History for Multi-Turn Context
    try:
        history_messages = get_conversation_messages(conversation_id, user_id)
    except Exception:
        history_messages = []

    # 6. Execute LLM Provider with automatic fallback
    try:
        provider = get_llm_provider()
        assistant_response = provider.generate_response(system_prompt, user_message, history_messages)
    except Exception as e:
        print(f"[WARNING] LLM Provider exception: {e}. Executing clinical fallback.")
        fallback = OfflineClinicalProvider()
        assistant_response = fallback.generate_response(system_prompt, user_message, history_messages)

    # 7. Persist Messages to Memory safely
    try:
        save_chat_message(conversation_id, "user", user_message)
        save_chat_message(conversation_id, "assistant", assistant_response)
    except Exception as e:
        print(f"[WARNING] Save chat message error: {e}")

    return {
        "response": assistant_response,
        "conversation_id": conversation_id,
        "is_emergency": False
    }
