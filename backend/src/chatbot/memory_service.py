from typing import List, Dict, Any, Optional
from src.database import get_db_connection

def create_conversation(user_id: int, title: str = "New Health Conversation") -> Dict[str, Any]:
    conn = get_db_connection()
    if not conn:
        raise RuntimeError("Database connection failed")
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "INSERT INTO chat_conversations (user_id, title) VALUES (%s, %s)",
            (user_id, title)
        )
        conn.commit()
        conv_id = cursor.lastrowid
        return {"id": conv_id, "user_id": user_id, "title": title}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

def get_user_conversations(user_id: int) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    if not conn:
        return []
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT id, title, created_at, updated_at FROM chat_conversations WHERE user_id = %s ORDER BY updated_at DESC",
            (user_id,)
        )
        return cursor.fetchall()
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

def get_conversation_messages(conversation_id: int, user_id: int) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    if not conn:
        return []
    try:
        cursor = conn.cursor(dictionary=True)
        # Verify ownership
        cursor.execute("SELECT user_id FROM chat_conversations WHERE id = %s", (conversation_id,))
        conv = cursor.fetchone()
        if not conv or conv["user_id"] != user_id:
            return []

        cursor.execute(
            "SELECT id, sender, message, created_at FROM chat_messages WHERE conversation_id = %s ORDER BY created_at ASC",
            (conversation_id,)
        )
        return cursor.fetchall()
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

def save_chat_message(conversation_id: int, sender: str, message: str):
    conn = get_db_connection()
    if not conn:
        return
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO chat_messages (conversation_id, sender, message) VALUES (%s, %s, %s)",
            (conversation_id, sender, message)
        )
        cursor.execute(
            "UPDATE chat_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = %s",
            (conversation_id,)
        )
        conn.commit()
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

def update_conversation_title(conversation_id: int, user_id: int, title: str):
    conn = get_db_connection()
    if not conn:
        return
    try:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE chat_conversations SET title = %s WHERE id = %s AND user_id = %s",
            (title, conversation_id, user_id)
        )
        conn.commit()
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

def delete_conversation(conversation_id: int, user_id: int):
    conn = get_db_connection()
    if not conn:
        return
    try:
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM chat_conversations WHERE id = %s AND user_id = %s",
            (conversation_id, user_id)
        )
        conn.commit()
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()
