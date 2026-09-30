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
from src.database import SessionLocal
from src.clinical_chat.intent_service import intent_service
import re
import logging

logger = logging.getLogger(__name__)

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

    # 3. Retrieve DB Medical Context safely (RAG removed from chatbot response path)
    medical_context = "Patient medical records on file."
    rag_chunks = []

    # 4. Build System Prompt (RAG removed)
    system_prompt = build_system_prompt(medical_context, rag_chunks)

    # 5. Fetch Session Chat History for Multi-Turn Context
    try:
        history_messages = get_conversation_messages(conversation_id, user_id)
    except Exception:
        history_messages = []

    # 6. Intent Understanding & Execution or LLM Generation
    assistant_response = None
    try:
        db = SessionLocal()
        try:
            formatted_history = [{"sender": m.get("sender"), "body": m.get("message")} for m in history_messages]
            assistant_response = intent_service.process_intent(
                db=db,
                patient_id=user_id,
                message_text=user_message,
                conv_history=formatted_history
            )
        finally:
            db.close()
    except Exception as e:
        logger.error(f"[ERROR] Intent processing error in legacy engine: {e}", exc_info=True)

    if not assistant_response:
        try:
            provider = get_llm_provider()
            assistant_response = provider.generate_response(system_prompt, user_message, history_messages)
        except Exception as e:
            logger.error(f"[WARNING] LLM Provider exception: {e}. Executing clinical fallback.", exc_info=True)
            fallback = OfflineClinicalProvider()
            assistant_response = fallback.generate_response(system_prompt, user_message, history_messages)

    if not assistant_response:
        assistant_response = "I'm having trouble processing that request right now. Please try again."

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
