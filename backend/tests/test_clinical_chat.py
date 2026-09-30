import pytest
import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy.orm import Session
from src.database import SessionLocal, engine
from src.models import (
    Base, User, Doctor, Department,
    ClinicalConversation, ClinicalMessage, ClinicalAlert,
    ClinicalEvent, ClinicalAIAnalysis, ClinicalRoutingRule,
    DoctorDepartmentMembership
)
from src.auth import create_access_token, TokenData
from src.clinical_chat.classification import classifier
from src.clinical_chat.routing import clinical_router
from src.clinical_chat.notification_service import notification_service
from src.clinical_chat.orchestration import orchestrator
from src.clinical_chat.access_policy import (
    can_patient_access_conversation, can_doctor_access_conversation,
    can_doctor_modify_conversation
)


@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="module")
def setup_test_entities(db_session: Session):
    """
    Creates test departments, users, and doctors for integration tests.
    """
    # 1. Departments
    dept_emerg = db_session.query(Department).filter(Department.code == "EMERG").first()
    if not dept_emerg:
        dept_emerg = Department(name="Emergency Medicine Test", code="EMERG", description="Emergency care")
        db_session.add(dept_emerg)

    dept_card = db_session.query(Department).filter(Department.code == "CARD").first()
    if not dept_card:
        dept_card = Department(name="Cardiology Test", code="CARD", description="Heart care")
        db_session.add(dept_card)

    dept_ortho = db_session.query(Department).filter(Department.code == "ORTHO").first()
    if not dept_ortho:
        dept_ortho = Department(name="Orthopedics Test", code="ORTHO", description="Bone care")
        db_session.add(dept_ortho)

    db_session.commit()
    db_session.refresh(dept_emerg)
    db_session.refresh(dept_card)
    db_session.refresh(dept_ortho)

    # 2. Patients
    patient_a = db_session.query(User).filter(User.email == "patient_a_test@hospital.com").first()
    if not patient_a:
        patient_a = User(
            email="patient_a_test@hospital.com",
            mobile_no="9999000001",
            blood_group="A+",
            password_hash="testhash",
            full_name="Patient Alice",
            role="patient"
        )
        db_session.add(patient_a)

    patient_b = db_session.query(User).filter(User.email == "patient_b_test@hospital.com").first()
    if not patient_b:
        patient_b = User(
            email="patient_b_test@hospital.com",
            mobile_no="9999000002",
            blood_group="B+",
            password_hash="testhash",
            full_name="Patient Bob",
            role="patient"
        )
        db_session.add(patient_b)

    # 3. Doctors
    doc_user_card = db_session.query(User).filter(User.email == "doc_card_test@hospital.com").first()
    if not doc_user_card:
        doc_user_card = User(
            email="doc_card_test@hospital.com",
            mobile_no="9999000003",
            blood_group="O+",
            password_hash="testhash",
            full_name="Dr. Cardiologist",
            role="doctor"
        )
        db_session.add(doc_user_card)
        db_session.flush()

    doctor_card = db_session.query(Doctor).filter(Doctor.user_id == doc_user_card.id).first()
    if not doctor_card:
        doctor_card = Doctor(
            user_id=doc_user_card.id,
            department_id=dept_card.id,
            specialization="Cardiology",
            qualification="MD",
            status="Active"
        )
        db_session.add(doctor_card)

    doc_user_ortho = db_session.query(User).filter(User.email == "doc_ortho_test@hospital.com").first()
    if not doc_user_ortho:
        doc_user_ortho = User(
            email="doc_ortho_test@hospital.com",
            mobile_no="9999000004",
            blood_group="O+",
            password_hash="testhash",
            full_name="Dr. Orthopedic",
            role="doctor"
        )
        db_session.add(doc_user_ortho)
        db_session.flush()

    doctor_ortho = db_session.query(Doctor).filter(Doctor.user_id == doc_user_ortho.id).first()
    if not doctor_ortho:
        doctor_ortho = Doctor(
            user_id=doc_user_ortho.id,
            department_id=dept_ortho.id,
            specialization="Orthopedics",
            qualification="MS",
            status="Active"
        )
        db_session.add(doctor_ortho)

    db_session.commit()
    db_session.refresh(patient_a)
    db_session.refresh(patient_b)
    db_session.refresh(doctor_card)
    db_session.refresh(doctor_ortho)

    return {
        "dept_emerg": dept_emerg,
        "dept_card": dept_card,
        "dept_ortho": dept_ortho,
        "patient_a": patient_a,
        "patient_b": patient_b,
        "doctor_card": doctor_card,
        "doctor_ortho": doctor_ortho,
        "doc_user_card": doc_user_card,
        "doc_user_ortho": doc_user_ortho
    }


# =========================================================================
# Unit Tests: Classifier & Triage
# =========================================================================

def test_classifier_emergency_review():
    res1 = classifier.classify("I have severe crushing chest pain radiating to my arm and shortness of breath")
    assert res1["urgency"] == "EMERGENCY_REVIEW"
    assert res1["escalation_needed"] is True
    assert "RULE_CHEST_PAIN" in res1["evidence_codes"]
    assert res1["emergency_notice"] is not None

    res2 = classifier.classify("My mother is having a stroke, her face is drooping and speech is slurred")
    assert res2["urgency"] == "EMERGENCY_REVIEW"
    assert "RULE_STROKE_SYMPTOMS" in res2["evidence_codes"]


def test_classifier_high_priority():
    res = classifier.classify("Patient has high fever 104 with confusion and stiff neck")
    assert res["urgency"] == "HIGH_PRIORITY"
    assert res["escalation_needed"] is True
    assert res["human_review_required"] is True


def test_classifier_moderate():
    res = classifier.classify("I have had a chronic cough for 3 weeks and blood in stool")
    assert res["urgency"] == "MODERATE"
    assert res["escalation_needed"] is False


def test_classifier_low_priority_and_normal():
    res_low = classifier.classify("I have a mild tension headache and need a prescription refill")
    assert res_low["urgency"] == "LOW_PRIORITY"

    res_normal = classifier.classify("Hello, what are the visiting hours for the hospital?")
    assert res_normal["urgency"] == "NORMAL"
    assert res_normal["escalation_needed"] is False


# =========================================================================
# Unit Tests: Department Routing
# =========================================================================

def test_clinical_routing_fallback_and_emergency(db_session: Session, setup_test_entities):
    entities = setup_test_entities
    dept_emerg = entities["dept_emerg"]

    # Emergency review should route to Emergency department
    dept_id, doc_id, version = clinical_router.route_conversation(
        db=db_session,
        urgency="EMERGENCY_REVIEW",
        category="Cardiology / Emergency",
        evidence_codes=["RULE_CHEST_PAIN"]
    )
    assert dept_id is not None


# =========================================================================
# Integration Tests: End-to-End Clinical Escalation Workflow
# =========================================================================

def test_patient_conversation_creation_and_escalation(db_session: Session, setup_test_entities):
    entities = setup_test_entities
    patient_a = entities["patient_a"]

    # 1. Patient creates conversation with an emergency trigger
    conv = orchestrator.create_conversation(
        db=db_session,
        patient_id=patient_a.id,
        title="Emergency Chest Pain Consultation",
        initial_message="I have acute severe chest pain and cannot breathe properly!"
    )

    assert conv.id is not None
    assert conv.patient_id == patient_a.id
    assert conv.urgency == "EMERGENCY_REVIEW"
    assert conv.escalation_status == "PENDING_ACK"

    # Verify messages persisted: 1 patient message, 1 assistant message
    msgs = db_session.query(ClinicalMessage).filter(ClinicalMessage.conversation_id == conv.id).all()
    assert len(msgs) == 2
    assert msgs[0].sender_type == "patient"
    assert msgs[1].sender_type == "assistant"
    # Assistant message contains emergency life-safety notice
    assert "EMERGENCY" in msgs[1].body

    # Verify ClinicalAlert was triggered
    alerts = db_session.query(ClinicalAlert).filter(ClinicalAlert.conversation_id == conv.id).all()
    assert len(alerts) == 1
    assert alerts[0].status == "TRIGGERED"
    assert alerts[0].urgency == "EMERGENCY_REVIEW"

    # Verify ClinicalEvent audit trail
    events = db_session.query(ClinicalEvent).filter(ClinicalEvent.conversation_id == conv.id).all()
    event_types = [e.event_type for e in events]
    assert "CONVERSATION_CREATED" in event_types
    assert "MESSAGE_SENT_PATIENT" in event_types
    assert "URGENCY_CLASSIFIED" in event_types
    assert "ALERT_TRIGGERED" in event_types


def test_alert_deduplication(db_session: Session, setup_test_entities):
    entities = setup_test_entities
    patient_a = entities["patient_a"]

    conv = orchestrator.create_conversation(
        db=db_session,
        patient_id=patient_a.id,
        title="Deduplication Test",
        initial_message="Chest pain episode 1"
    )

    initial_alert_count = db_session.query(ClinicalAlert).filter(ClinicalAlert.conversation_id == conv.id).count()
    assert initial_alert_count == 1

    # Send a second message with chest pain to the same conversation
    orchestrator.process_patient_message(
        db=db_session,
        conversation=conv,
        patient_id=patient_a.id,
        message_text="Still having chest pain, severe heart attack symptoms!"
    )

    # Count of active alerts should NOT double due to dedupe_key
    second_alert_count = db_session.query(ClinicalAlert).filter(ClinicalAlert.conversation_id == conv.id).count()
    assert second_alert_count == 1


# =========================================================================
# Security & Authorization Tests: Scoping & RBAC
# =========================================================================

def test_patient_access_isolation(db_session: Session, setup_test_entities):
    entities = setup_test_entities
    patient_a = entities["patient_a"]
    patient_b = entities["patient_b"]

    conv_a = orchestrator.create_conversation(
        db=db_session,
        patient_id=patient_a.id,
        title="Alice Confidential Conversation"
    )

    # Patient A can access own conversation
    assert can_patient_access_conversation(conv_a, patient_a.id) is True

    # Patient B CANNOT access Patient A's conversation
    assert can_patient_access_conversation(conv_a, patient_b.id) is False


def test_doctor_department_scoping_and_workflow(db_session: Session, setup_test_entities):
    entities = setup_test_entities
    patient_a = entities["patient_a"]
    dept_card = entities["dept_card"]
    doctor_card = entities["doctor_card"]
    doc_user_card = entities["doc_user_card"]
    doctor_ortho = entities["doctor_ortho"]
    doc_user_ortho = entities["doc_user_ortho"]

    # Create a conversation in Cardiology department
    conv = ClinicalConversation(
        patient_id=patient_a.id,
        title="Cardiac Arrhythmia Inquiry",
        status="AWAITING_DOCTOR",
        urgency="HIGH_PRIORITY",
        department_id=dept_card.id,
        assigned_doctor_id=doctor_card.id,
        escalation_status="PENDING_ACK"
    )
    db_session.add(conv)
    db_session.commit()
    db_session.refresh(conv)

    token_card = TokenData(email=doc_user_card.email, user_id=doc_user_card.id, role="doctor")
    token_ortho = TokenData(email=doc_user_ortho.email, user_id=doc_user_ortho.id, role="doctor")

    # 1. Cardiology doctor has access to Cardiology conversation
    can_card, _ = can_doctor_access_conversation(db_session, conv, token_card)
    assert can_card is True

    # 2. Orthopedics doctor does NOT have access to unassigned Cardiology conversation
    can_ortho, _ = can_doctor_access_conversation(db_session, conv, token_ortho)
    assert can_ortho is False

    # 3. Cardiology doctor acknowledges alert
    orchestrator.acknowledge_alert(
        db=db_session,
        conversation=conv,
        doctor_user_id=doc_user_card.id,
        notes="Reviewed ECG and vital signs. Patient is stable."
    )
    assert conv.escalation_status == "ACKNOWLEDGED"

    # 4. Cardiology doctor replies
    doc_msg = orchestrator.process_doctor_reply(
        db=db_session,
        conversation=conv,
        doctor_user_id=doc_user_card.id,
        message_text="Hello Alice, please continue your prescribed beta-blocker and visit clinic tomorrow."
    )
    assert doc_msg.id is not None
    assert conv.status == "DOCTOR_RESPONDED"

    # 5. Doctor resolves the consultation
    orchestrator.resolve_conversation(
        db=db_session,
        conversation=conv,
        actor_user_id=doc_user_card.id,
        resolution_notes="Patient followed up successfully."
    )
    assert conv.status == "RESOLVED"
    assert conv.resolved_at is not None


def test_healthbot_intent_and_context_responses(db_session: Session, setup_test_entities):
    """
    Verifies Issue 1 requirements:
    - Chatbot processes actual current user message
    - Never blindly returns repeated default greeting
    - Correctly handles appointments, departments, medical info, reports, cancellations
    - Preserves multi-turn context (booking flow)
    - Directly interacts with database models
    """
    patient = setup_test_entities["patient_a"]
    from src.models import Appointment
    db_session.query(Appointment).filter(Appointment.patient_id == patient.id).delete()
    db_session.commit()

    DEFAULT_GREETING_BUG = "Hello! I am HealthBot, your clinical decision support assistant. Your message has been securely logged in your patient chart."

    # 1. New chat session starts with initial greeting
    new_conv = orchestrator.create_conversation(db_session, patient.id, title="Test New Chat")
    initial_msgs = (
        db_session.query(ClinicalMessage)
        .filter(ClinicalMessage.conversation_id == new_conv.id)
        .order_by(ClinicalMessage.created_at.asc())
        .all()
    )
    assert len(initial_msgs) == 1
    assert "Hello! I'm HealthBot" in initial_msgs[0].body

    # 2. "hello" does NOT return repeated fallback
    res_hello = orchestrator.process_patient_message(db_session, new_conv, patient.id, "hello")
    bot_hello = res_hello["assistant_message"]["body"]
    assert DEFAULT_GREETING_BUG not in bot_hello
    assert "HealthBot, your hospital clinical assistant" in bot_hello

    # 3. "book appointment" asks for department
    res_book = orchestrator.process_patient_message(db_session, new_conv, patient.id, "book appointment")
    bot_book = res_book["assistant_message"]["body"]
    assert DEFAULT_GREETING_BUG not in bot_book
    assert "Which department" in bot_book
    assert "Cardiology" in bot_book

    # 4. Multi-turn continuation: "Cardiology" answers the previous question
    res_card = orchestrator.process_patient_message(db_session, new_conv, patient.id, "Cardiology")
    bot_card = res_card["assistant_message"]["body"]
    assert DEFAULT_GREETING_BUG not in bot_card
    assert "Cardiology" in bot_card
    assert "Available slots:" in bot_card

    # 5. Multi-turn slot selection: "Tomorrow at 10:00 AM" schedules appointment in database
    res_slot = orchestrator.process_patient_message(db_session, new_conv, patient.id, "Tomorrow at 10:00 AM")
    bot_slot = res_slot["assistant_message"]["body"]
    assert DEFAULT_GREETING_BUG not in bot_slot
    assert "Appointment Successfully Scheduled" in bot_slot
    assert "10:00 AM" in bot_slot

    # Verify real Appointment record in database
    from src.models import Appointment
    booked_app = (
        db_session.query(Appointment)
        .filter(Appointment.patient_id == patient.id, Appointment.time_slot == "10:00 AM")
        .order_by(Appointment.created_at.desc())
        .first()
    )
    assert booked_app is not None
    assert booked_app.status == "REQUESTED"

    # 6. "what are my appointments?" queries actual database records
    res_list = orchestrator.process_patient_message(db_session, new_conv, patient.id, "what are my appointments?")
    bot_list = res_list["assistant_message"]["body"]
    assert DEFAULT_GREETING_BUG not in bot_list
    assert "Here are your scheduled appointments on file" in bot_list
    assert "10:00 AM" in bot_list

    # 7. "what departments are available?" queries Department records
    res_dept = orchestrator.process_patient_message(db_session, new_conv, patient.id, "what departments are available?")
    bot_dept = res_dept["assistant_message"]["body"]
    assert DEFAULT_GREETING_BUG not in bot_dept
    assert "Cardiology" in bot_dept

    # 8. "what is hypertension?" gives comprehensive clinical medical information
    res_hyp = orchestrator.process_patient_message(db_session, new_conv, patient.id, "what is hypertension?")
    bot_hyp = res_hyp["assistant_message"]["body"]
    assert DEFAULT_GREETING_BUG not in bot_hyp
    assert "Hypertension" in bot_hyp
    assert "120/80" in bot_hyp or "blood pressure" in bot_hyp.lower()

    # 9. "Neurology" department options
    res_neuro = orchestrator.process_patient_message(db_session, new_conv, patient.id, "Neurology")
    bot_neuro = res_neuro["assistant_message"]["body"]
    assert DEFAULT_GREETING_BUG not in bot_neuro
    assert "Neurology" in bot_neuro
    assert "Available slots:" in bot_neuro

    # 10. "memory concerns" provides neurological and cognitive guidance
    res_mem = orchestrator.process_patient_message(db_session, new_conv, patient.id, "memory concerns")
    bot_mem = res_mem["assistant_message"]["body"]
    assert DEFAULT_GREETING_BUG not in bot_mem
    assert "Memory" in bot_mem or "Cognitive" in bot_mem
    assert "Neurology" in bot_mem

    # 11. "cancel my appointment" cancels active appointment in DB
    res_cancel = orchestrator.process_patient_message(db_session, new_conv, patient.id, "cancel my appointment")
    bot_cancel = res_cancel["assistant_message"]["body"]
    assert DEFAULT_GREETING_BUG not in bot_cancel
    assert "successfully cancelled" in bot_cancel.lower()

    db_session.refresh(booked_app)
    assert booked_app.status == "CANCELLED"
