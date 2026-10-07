from fastapi import APIRouter, Depends, HTTPException, Response, Request
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import logging

from src.auth import get_current_user
from src.chatbot.chatbot_engine import process_chat_message
from src.chatbot.memory_service import (
    create_conversation,
    get_user_conversations,
    get_conversation_messages,
    delete_conversation
)
from src.security.rate_limiter import rate_limit

logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["Legacy AI Healthcare Chatbot (Deprecated)"]
)

class ChatMessageInput(BaseModel):
    message: str
    conversation_id: Optional[int] = None

class CreateConversationInput(BaseModel):
    title: Optional[str] = "New Health Conversation"

@router.get("/chatbot/conversations", deprecated=True)
async def list_conversations(response: Response, current_user=Depends(get_current_user)):
    """Fetches all past chat sessions for the logged-in user (Deprecated: use /clinical-chat/conversations/my)."""
    response.headers["Warning"] = '299 - "Endpoint deprecated. Migrate to /clinical-chat/conversations/my"'
    try:
        conversations = get_user_conversations(current_user.user_id)
        return {"conversations": conversations, "_deprecated": "Migrate to /clinical-chat"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching chatbot conversations: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve conversations")

@router.post("/chatbot/conversations", deprecated=True)
async def create_new_session(input_data: CreateConversationInput, response: Response, current_user=Depends(get_current_user)):
    """Creates a new chat conversation session (Deprecated: use /clinical-chat/conversations)."""
    response.headers["Warning"] = '299 - "Endpoint deprecated. Migrate to /clinical-chat/conversations"'
    try:
        session = create_conversation(current_user.user_id, title=input_data.title or "New Health Conversation")
        return {"conversation": session, "_deprecated": "Migrate to /clinical-chat"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating chatbot session: {e}")
        raise HTTPException(status_code=500, detail="Failed to create conversation session")

@router.get("/chatbot/conversations/{conversation_id}/messages", deprecated=True)
async def get_session_messages(conversation_id: int, response: Response, current_user=Depends(get_current_user)):
    """Fetches all messages for a specific conversation session (Deprecated: use /clinical-chat/conversations/{id}/messages)."""
    response.headers["Warning"] = '299 - "Endpoint deprecated. Migrate to /clinical-chat/conversations/{id}/messages"'
    try:
        messages = get_conversation_messages(conversation_id, current_user.user_id)
        return {"messages": messages, "_deprecated": "Migrate to /clinical-chat"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching session messages: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve messages")

@router.delete("/chatbot/conversations/{conversation_id}", deprecated=True)
async def delete_session(conversation_id: int, response: Response, current_user=Depends(get_current_user)):
    """Deletes a specific chat session and its messages (Deprecated)."""
    response.headers["Warning"] = '299 - "Endpoint deprecated."'
    try:
        delete_conversation(conversation_id, current_user.user_id)
        return {"message": "Conversation deleted successfully", "_deprecated": "Migrate to /clinical-chat"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting session: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete conversation")

@router.post("/chatbot/message", deprecated=True)
async def send_chat_message(
    input_data: ChatMessageInput,
    response: Response,
    current_user=Depends(get_current_user),
    _limiter: None = Depends(rate_limit(max_requests=20, window_seconds=60, prefix="chatbot_msg"))
):
    """
    Primary RAG Chatbot endpoint (Deprecated: use /clinical-chat/conversations/{id}/messages).
    """
    response.headers["Warning"] = '299 - "Endpoint deprecated. Migrate to /clinical-chat/conversations/{id}/messages"'
    user_msg = (input_data.message or "").strip()
    if not user_msg:
        raise HTTPException(status_code=400, detail="Message content cannot be empty")

    try:
        result = process_chat_message(
            user_id=current_user.user_id,
            user_message=user_msg,
            conversation_id=input_data.conversation_id
        )
        return {
            "response": result["response"],
            "conversation_id": result["conversation_id"],
            "is_emergency": result["is_emergency"],
            "timestamp": datetime.now().strftime("%I:%M %p"),
            "_deprecated": "Migrate to /clinical-chat"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing chat message: {e}")
        raise HTTPException(status_code=500, detail="Failed to process chat message")
