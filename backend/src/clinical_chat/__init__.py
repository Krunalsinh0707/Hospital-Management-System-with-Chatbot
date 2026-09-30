"""
Clinical Chat Subsystem Package
Provides persistent patient-doctor clinical conversations, deterministic triage classification,
configurable department routing, in-app clinician alerting, and audit logging.
"""
from src.clinical_chat.classification import classifier
from src.clinical_chat.routing import clinical_router
from src.clinical_chat.notification_service import notification_service
from src.clinical_chat.audit_service import audit_service
from src.clinical_chat.llm_service import llm_service
from src.clinical_chat.orchestration import orchestrator
from src.clinical_chat.vector_store import vector_store

__all__ = [
    "classifier",
    "clinical_router",
    "notification_service",
    "audit_service",
    "llm_service",
    "orchestrator",
    "vector_store"
]
