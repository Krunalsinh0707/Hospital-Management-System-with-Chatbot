from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from src.models import ClinicalEvent

class ClinicalAuditService:
    """
    Append-only clinical audit and workflow event logging service.
    Tracks every state transition, routing decision, triage classification, and clinician action.
    """
    def log_event(
        self,
        db: Session,
        conversation_id: int,
        event_type: str,
        actor_user_id: Optional[int] = None,
        state_before: Optional[Dict[str, Any]] = None,
        state_after: Optional[Dict[str, Any]] = None,
        reason: Optional[str] = None
    ) -> ClinicalEvent:
        event = ClinicalEvent(
            conversation_id=conversation_id,
            actor_user_id=actor_user_id,
            event_type=event_type,
            state_before=state_before,
            state_after=state_after,
            reason=reason
        )
        db.add(event)
        return event

audit_service = ClinicalAuditService()
