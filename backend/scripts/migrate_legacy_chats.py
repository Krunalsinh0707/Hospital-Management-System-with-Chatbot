"""
Legacy Chat Migration Script
Migrates historical chat_conversations and chat_messages to the new clinical_conversations
and clinical_messages schema with accurate origin tracking (source_legacy_id) and preserved timestamps.
Does NOT fabricate urgency, doctor assignments, or synthetic audit history.
"""

import sys
import os

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy.orm import Session
from src.database import SessionLocal, engine
from src.models import (
    User, ChatConversation, ChatMessage,
    ClinicalConversation, ClinicalMessage, ClinicalEvent
)

def migrate_legacy_chats(db: Session, dry_run: bool = False):
    print("=" * 60)
    print("Starting Legacy Chat Migration to Clinical Chat Subsystem...")
    print(f"Mode: {'DRY RUN' if dry_run else 'LIVE MIGRATION'}")
    print("=" * 60)

    # 1. Fetch all legacy conversations
    legacy_convs = db.query(ChatConversation).order_by(ChatConversation.id.asc()).all()
    print(f"Found {len(legacy_convs)} total legacy conversation(s) in chat_conversations.")

    migrated_conv_count = 0
    migrated_msg_count = 0
    skipped_count = 0

    for leg_conv in legacy_convs:
        # Check if already migrated
        existing = db.query(ClinicalConversation).filter(
            ClinicalConversation.source_legacy_id == leg_conv.id
        ).first()

        if existing:
            skipped_count += 1
            continue

        # Verify user exists
        user = db.query(User).filter(User.id == leg_conv.user_id).first()
        if not user:
            print(f"[SKIP] User ID {leg_conv.user_id} does not exist for legacy conversation #{leg_conv.id}")
            continue

        # Map to new clinical conversation schema
        new_conv = ClinicalConversation(
            patient_id=leg_conv.user_id,
            title=leg_conv.title or "Historical Consultation",
            status="RESOLVED",
            urgency="NORMAL",
            department_id=None,
            assigned_doctor_id=None,
            escalation_status="NONE",
            source_legacy_id=leg_conv.id,
            created_at=leg_conv.created_at,
            updated_at=leg_conv.updated_at,
            resolved_at=leg_conv.updated_at
        )

        if not dry_run:
            db.add(new_conv)
            db.flush()

            # Record migration event
            db.add(ClinicalEvent(
                conversation_id=new_conv.id,
                actor_user_id=None,
                event_type="LEGACY_CONVERSATION_MIGRATED",
                state_before=None,
                state_after={"source_legacy_id": leg_conv.id},
                reason="Migrated from legacy chat_conversations table",
                created_at=leg_conv.created_at
            ))

        migrated_conv_count += 1

        # Fetch messages for this legacy conversation
        leg_msgs = db.query(ChatMessage).filter(
            ChatMessage.conversation_id == leg_conv.id
        ).order_by(ChatMessage.created_at.asc()).all()

        for leg_m in leg_msgs:
            sender_type = "patient" if leg_m.sender == "user" else "assistant"
            sender_user_id = leg_conv.user_id if sender_type == "patient" else None

            if not dry_run:
                new_msg = ClinicalMessage(
                    conversation_id=new_conv.id,
                    sender_type=sender_type,
                    sender_user_id=sender_user_id,
                    body=leg_m.message,
                    created_at=leg_m.created_at
                )
                db.add(new_msg)

            migrated_msg_count += 1

    if not dry_run:
        db.commit()
        print("Changes committed to database successfully.")

    print("=" * 60)
    print("Migration Summary:")
    print(f"  - Conversations Migrated: {migrated_conv_count}")
    print(f"  - Messages Migrated:      {migrated_msg_count}")
    print(f"  - Conversations Skipped:  {skipped_count}")
    print("=" * 60)

if __name__ == "__main__":
    is_dry = "--dry-run" in sys.argv
    db = SessionLocal()
    try:
        migrate_legacy_chats(db, dry_run=is_dry)
    finally:
        db.close()
