from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# ----------------- Requests -----------------

class CreateConversationRequest(BaseModel):
    title: Optional[str] = "Clinical Consultation"
    initial_message: Optional[str] = None

class SendMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)

class AssignDoctorRequest(BaseModel):
    doctor_id: Optional[int] = None
    department_id: Optional[int] = None
    reason: Optional[str] = None

class AcknowledgeAlertRequest(BaseModel):
    notes: Optional[str] = None

class EscalateConversationRequest(BaseModel):
    urgency: str = Field(..., pattern="^(NORMAL|LOW_PRIORITY|MODERATE|HIGH_PRIORITY|EMERGENCY_REVIEW)$")
    reason: str = Field(..., min_length=3)
    department_id: Optional[int] = None

class ResolveConversationRequest(BaseModel):
    resolution_notes: Optional[str] = None

class RoutingRuleCreateRequest(BaseModel):
    category_or_indicator: str = Field(..., min_length=2)
    department_id: int
    priority: str = Field("NORMAL", pattern="^(NORMAL|LOW_PRIORITY|MODERATE|HIGH_PRIORITY|EMERGENCY_REVIEW)$")
    is_enabled: bool = True
    version: str = "1.0"

class RoutingRuleUpdateRequest(BaseModel):
    category_or_indicator: Optional[str] = None
    department_id: Optional[int] = None
    priority: Optional[str] = Field(None, pattern="^(NORMAL|LOW_PRIORITY|MODERATE|HIGH_PRIORITY|EMERGENCY_REVIEW)$")
    is_enabled: Optional[bool] = None

class DoctorDepartmentMembershipCreateRequest(BaseModel):
    doctor_id: int
    department_id: int
    role: str = Field("MEMBER", pattern="^(MEMBER|RESPONDER|LEAD)$")
    is_active: bool = True

# ----------------- Responses -----------------

class ClinicalMessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_type: str
    sender_user_id: Optional[int] = None
    sender_name: Optional[str] = None
    body: str
    created_at: datetime

    class Config:
        from_attributes = True

class PatientSafeConversationResponse(BaseModel):
    id: int
    title: str
    status: str
    urgency: str
    escalation_status: str
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    messages: List[ClinicalMessageResponse] = []

    class Config:
        from_attributes = True

class ClinicalEventResponse(BaseModel):
    id: int
    conversation_id: int
    event_type: str
    actor_user_id: Optional[int] = None
    actor_name: Optional[str] = None
    state_before: Optional[Dict[str, Any]] = None
    state_after: Optional[Dict[str, Any]] = None
    reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ClinicalAIAnalysisResponse(BaseModel):
    id: int
    category: Optional[str] = None
    confidence: Optional[float] = None
    evidence_codes: Optional[List[str]] = None
    model_rule_version: str
    human_review_required: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ClinicalAlertResponse(BaseModel):
    id: int
    status: str
    reason: str
    urgency: str
    escalated_at: datetime
    acknowledged_at: Optional[datetime] = None
    acknowledged_by_user_id: Optional[int] = None

    class Config:
        from_attributes = True

class DoctorConversationDetailResponse(BaseModel):
    id: int
    title: str
    status: str
    urgency: str
    escalation_status: str
    patient_id: int
    patient_name: str
    patient_email: Optional[str] = None
    patient_blood_group: Optional[str] = None
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    assigned_doctor_id: Optional[int] = None
    assigned_doctor_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    messages: List[ClinicalMessageResponse] = []
    alerts: List[ClinicalAlertResponse] = []
    ai_analyses: List[ClinicalAIAnalysisResponse] = []

    class Config:
        from_attributes = True

class DoctorInboxItem(BaseModel):
    id: int
    title: str
    patient_id: int
    patient_name: str
    status: str
    urgency: str
    escalation_status: str
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    assigned_doctor_id: Optional[int] = None
    assigned_doctor_name: Optional[str] = None
    latest_message_snippet: Optional[str] = None
    has_active_alert: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DoctorInboxResponse(BaseModel):
    conversations: List[DoctorInboxItem]
    total: int
    unread_alerts_count: int

class RoutingRuleResponse(BaseModel):
    id: int
    category_or_indicator: str
    department_id: int
    department_name: Optional[str] = None
    priority: str
    is_enabled: bool
    version: str
    created_at: datetime

    class Config:
        from_attributes = True

class DoctorDepartmentMembershipResponse(BaseModel):
    id: int
    doctor_id: int
    doctor_name: Optional[str] = None
    department_id: int
    department_name: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
