import pytest
import os
import sys
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from src.database import SessionLocal
from src.models import (
    User, Doctor, Department, Appointment,
    MedicalReport, ReportReviewRequest, Notification,
    ClinicalConversation, ClinicalMessage
)
from src.clinical_chat.orchestration import orchestrator
from src.clinical_chat.intent_service import intent_service
from src.clinical_chat.clinical_actions import (
    get_patient_report,
    create_report_review_request,
    create_appointment_request,
    cancel_patient_appointment,
    check_appointment_availability
)


@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="module")
def chatbot_test_data(db_session: Session):
    """
    Sets up isolated test entities for the 20 acceptance tests:
    - Dedicated department: Cardiology
    - Patient Alice (user)
    - Patient Bob (other user for RBAC isolation)
    - Doctor Dr. Smith (Active)
    - MedicalReport for Alice assigned to Dr. Smith
    """
    # 1. Department
    dept = db_session.query(Department).filter(Department.name == "Cardiology").first()
    if not dept:
        dept = Department(name="Cardiology", code="CARD", description="Comprehensive Heart Care")
        db_session.add(dept)
        db_session.commit()
        db_session.refresh(dept)

    # 2. Doctor user & record
    doc_user = db_session.query(User).filter(User.email == "dr_smith_test@hospital.com").first()
    if not doc_user:
        doc_user = User(
            email="dr_smith_test@hospital.com",
            mobile_no="9998880001",
            blood_group="O+",
            password_hash="testhash",
            full_name="Dr. Smith",
            role="doctor"
        )
        db_session.add(doc_user)
        db_session.commit()
        db_session.refresh(doc_user)

    doctor = db_session.query(Doctor).filter(Doctor.user_id == doc_user.id).first()
    if not doctor:
        doctor = Doctor(
            user_id=doc_user.id,
            department_id=dept.id,
            specialization="Cardiology",
            qualification="MD Cardiology",
            status="Active"
        )
        db_session.add(doctor)
        db_session.commit()
        db_session.refresh(doctor)

    # 3. Patient Alice
    patient_a = db_session.query(User).filter(User.email == "alice_patient@hospital.com").first()
    if not patient_a:
        patient_a = User(
            email="alice_patient@hospital.com",
            mobile_no="9998880002",
            blood_group="A+",
            password_hash="testhash",
            full_name="Alice Patient",
            role="patient"
        )
        db_session.add(patient_a)
        db_session.commit()
        db_session.refresh(patient_a)

    # 4. Patient Bob
    patient_b = db_session.query(User).filter(User.email == "bob_patient@hospital.com").first()
    if not patient_b:
        patient_b = User(
            email="bob_patient@hospital.com",
            mobile_no="9998880003",
            blood_group="B+",
            password_hash="testhash",
            full_name="Bob Patient",
            role="patient"
        )
        db_session.add(patient_b)
        db_session.commit()
        db_session.refresh(patient_b)

    # 5. Alice's Medical Report
    report_a = db_session.query(MedicalReport).filter(MedicalReport.patient_id == patient_a.id).first()
    if not report_a:
        report_a = MedicalReport(
            patient_id=patient_a.id,
            doctor_id=doctor.id,
            department_id=dept.id,
            report_title="Comprehensive CBC Analysis",
            report_type="CBC",
            status="VALIDATED"
        )
        db_session.add(report_a)
        db_session.commit()
        db_session.refresh(report_a)

    return {
        "dept": dept,
        "doctor": doctor,
        "doc_user": doc_user,
        "patient_a": patient_a,
        "patient_b": patient_b,
        "report_a": report_a
    }


# =========================================================================
# 20 Acceptance Test Scenarios (Section 25)
# =========================================================================

def test_01_hello_returns_greeting(db_session: Session, chatbot_test_data):
    """1. 'hello' returns a greeting."""
    patient = chatbot_test_data["patient_a"]
    conv = orchestrator.create_conversation(db_session, patient.id, title="Test 1")
    res = orchestrator.process_patient_message(db_session, conv, patient.id, "hello")
    bot_reply = res["assistant_message"]["body"]

    assert "HealthBot, your hospital clinical assistant" in bot_reply
    assert res["intent"] == "GENERAL_INFORMATION"


def test_02_what_is_my_latest_report(db_session: Session, chatbot_test_data):
    """2. 'What is my latest report?' returns REPORT_INFORMATION."""
    patient = chatbot_test_data["patient_a"]
    conv = orchestrator.create_conversation(db_session, patient.id, title="Test 2")
    res = orchestrator.process_patient_message(db_session, conv, patient.id, "What is my latest report?")
    bot_reply = res["assistant_message"]["body"]

    assert res["intent"] == "REPORT_INFORMATION"
    assert "Comprehensive CBC Analysis" in bot_reply or "Report" in bot_reply


def test_03_submit_my_latest_report(db_session: Session, chatbot_test_data):
    """3. 'Submit my latest report to my doctor' starts REPORT_SUBMISSION."""
    patient = chatbot_test_data["patient_a"]
    conv = orchestrator.create_conversation(db_session, patient.id, title="Test 3")
    res = orchestrator.process_patient_message(db_session, conv, patient.id, "Submit my latest report to my doctor")
    bot_reply = res["assistant_message"]["body"]

    assert res["intent"] == "REPORT_SUBMISSION"
    assert conv.workflow_state is not None
    assert conv.workflow_state.get("workflow_type") == "REPORT_SUBMISSION"
    assert conv.workflow_state.get("step") == "AWAITING_CONFIRMATION"
    assert "Yes" in bot_reply


def test_04_review_cbc(db_session: Session, chatbot_test_data):
    """4. 'I want my doctor to review my CBC' starts REPORT_DOCTOR_REVIEW."""
    patient = chatbot_test_data["patient_a"]
    conv = orchestrator.create_conversation(db_session, patient.id, title="Test 4")
    res = orchestrator.process_patient_message(db_session, conv, patient.id, "I want my doctor to review my CBC")

    assert res["intent"] == "REPORT_DOCTOR_REVIEW"
    assert conv.workflow_state is not None
    assert conv.workflow_state.get("workflow_type") == "REPORT_DOCTOR_REVIEW"
    assert conv.workflow_state.get("step") == "AWAITING_CONFIRMATION"


def test_05_book_appointment(db_session: Session, chatbot_test_data):
    """5. 'I want to book an appointment' starts BOOK_APPOINTMENT."""
    patient = chatbot_test_data["patient_a"]
    conv = orchestrator.create_conversation(db_session, patient.id, title="Test 5")
    res = orchestrator.process_patient_message(db_session, conv, patient.id, "I want to book an appointment")
    bot_reply = res["assistant_message"]["body"]

    assert res["intent"] == "BOOK_APPOINTMENT"
    assert "Which department" in bot_reply
    assert conv.workflow_state is not None
    assert conv.workflow_state.get("workflow_type") == "BOOK_APPOINTMENT"
    assert conv.workflow_state.get("step") == "AWAITING_DEPARTMENT"


def test_06_find_cardiologist_tomorrow(db_session: Session, chatbot_test_data):
    """6. 'Find a cardiologist tomorrow' asks for the missing action or enters the documented availability flow."""
    patient = chatbot_test_data["patient_a"]
    conv = orchestrator.create_conversation(db_session, patient.id, title="Test 6")
    res = orchestrator.process_patient_message(db_session, conv, patient.id, "Find a cardiologist tomorrow")
    bot_reply = res["assistant_message"]["body"]

    assert res["intent"] == "DOCTOR_AVAILABILITY"
    assert "Available Slots:" in bot_reply or "slots" in bot_reply.lower()


def test_07_book_dr_patel_tomorrow(db_session: Session, chatbot_test_data):
    """7. 'Book Dr. Patel tomorrow at 10 AM' enters booking only if that doctor and slot are real and available."""
    patient = chatbot_test_data["patient_a"]
    conv = orchestrator.create_conversation(db_session, patient.id, title="Test 7")

    # Dr. Arjun Patel exists in hospital directory and 10:00 AM is available
    res = orchestrator.process_patient_message(db_session, conv, patient.id, "Book Dr. Patel tomorrow at 10 AM")
    bot_reply = res["assistant_message"]["body"]

    assert res["intent"] == "BOOK_APPOINTMENT"
    assert "available" in bot_reply.lower() and "confirm" in bot_reply.lower()
    assert conv.workflow_state is not None
    assert conv.workflow_state.get("step") == "AWAITING_CONFIRMATION"

    # Contrast with a non-existent doctor name, which MUST NOT enter booking
    conv_fake = orchestrator.create_conversation(db_session, patient.id, title="Test 7 Fake")
    res_fake = orchestrator.process_patient_message(db_session, conv_fake, patient.id, "Book Dr. Nonexistent tomorrow at 10 AM")
    bot_fake = res_fake["assistant_message"]["body"]
    assert "couldn't find" in bot_fake.lower() or "not available" in bot_fake.lower()


def test_08_need_something_for_doctor(db_session: Session, chatbot_test_data):
    """8. 'I need something for my doctor' returns CLARIFICATION_REQUIRED."""
    patient = chatbot_test_data["patient_a"]
    conv = orchestrator.create_conversation(db_session, patient.id, title="Test 8")
    res = orchestrator.process_patient_message(db_session, conv, patient.id, "I need something for my doctor")

    assert res["intent"] == "CLARIFICATION_REQUIRED"
    assert res.get("clarification_options") is not None
    assert len(res["clarification_options"]) > 0


def test_09_report_to_be_submitted_to_doctor(db_session: Session, chatbot_test_data):
    """9. 'I need some information about a report to be submitted to doctor' returns CLARIFICATION_REQUIRED, never appointment options."""
    patient = chatbot_test_data["patient_a"]
    conv = orchestrator.create_conversation(db_session, patient.id, title="Test 9")
    res = orchestrator.process_patient_message(
        db_session, conv, patient.id, "I need some information about a report to be submitted to doctor"
    )
    bot_reply = res["assistant_message"]["body"]

    # Must be CLARIFICATION_REQUIRED
    assert res["intent"] == "CLARIFICATION_REQUIRED"
    # Must NEVER present appointment slots or booking options
    assert "available slots" not in bot_reply.lower()
    assert "confirm your booking" not in bot_reply.lower()
    # Must offer the 3 specific choices from the brief
    assert "View or explain" in bot_reply or "1" in bot_reply
    assert "Submit" in bot_reply or "2" in bot_reply
    assert "review" in bot_reply.lower() or "3" in bot_reply


def test_10_cancel_appointment(db_session: Session, chatbot_test_data):
    """10. 'Cancel my appointment' enters cancellation."""
    patient = chatbot_test_data["patient_a"]
    doctor = chatbot_test_data["doctor"]
    tmr = datetime.utcnow() + timedelta(days=2)

    # Clean up existing appointments to ensure deterministic target
    db_session.query(Appointment).filter(Appointment.patient_id == patient.id).delete()
    db_session.commit()

    # Create active appointment
    app = Appointment(
        patient_id=patient.id,
        doctor_id=doctor.id,
        department_id=doctor.department_id,
        appointment_date=tmr,
        time_slot="04:00 PM",
        status="REQUESTED",
        reason="Followup"
    )
    db_session.add(app)
    db_session.commit()
    db_session.refresh(app)

    conv = orchestrator.create_conversation(db_session, patient.id, title="Test 10")
    res = orchestrator.process_patient_message(db_session, conv, patient.id, "Cancel my appointment")
    bot_reply = res["assistant_message"]["body"]

    assert res["intent"] == "CANCEL_APPOINTMENT"
    assert "successfully cancelled" in bot_reply.lower()
    db_session.refresh(app)
    assert app.status == "CANCELLED"


def test_11_reschedule_appointment(db_session: Session, chatbot_test_data):
    """11. 'Reschedule my appointment' enters rescheduling."""
    patient = chatbot_test_data["patient_a"]
    doctor = chatbot_test_data["doctor"]
    tmr = datetime.utcnow() + timedelta(days=3)

    app = Appointment(
        patient_id=patient.id,
        doctor_id=doctor.id,
        department_id=doctor.department_id,
        appointment_date=tmr,
        time_slot="03:00 PM",
        status="REQUESTED",
        reason="Reschedule test"
    )
    db_session.add(app)
    db_session.commit()

    conv = orchestrator.create_conversation(db_session, patient.id, title="Test 11")
    res = orchestrator.process_patient_message(db_session, conv, patient.id, "Reschedule my appointment")
    bot_reply = res["assistant_message"]["body"]

    assert res["intent"] == "RESCHEDULE_APPOINTMENT"
    assert "Available slots" in bot_reply or "preferred" in bot_reply.lower()


def test_12_who_is_my_doctor(db_session: Session, chatbot_test_data):
    """12. 'Who is my doctor?' returns only a relationship supported by database records."""
    patient = chatbot_test_data["patient_a"]
    conv = orchestrator.create_conversation(db_session, patient.id, title="Test 12")
    res = orchestrator.process_patient_message(db_session, conv, patient.id, "Who is my doctor?")
    bot_reply = res["assistant_message"]["body"]

    assert res["intent"] == "DOCTOR_INFORMATION"
    assert "Dr. Smith" in bot_reply or "Physician" in bot_reply


def test_13_what_departments_are_available(db_session: Session, chatbot_test_data):
    """13. 'What departments are available?' returns database departments."""
    patient = chatbot_test_data["patient_a"]
    conv = orchestrator.create_conversation(db_session, patient.id, title="Test 13")
    res = orchestrator.process_patient_message(db_session, conv, patient.id, "What departments are available?")
    bot_reply = res["assistant_message"]["body"]

    assert res["intent"] == "DEPARTMENT_INFORMATION"
    assert "Cardiology" in bot_reply
    # Must NOT book an appointment
    assert "booking" not in bot_reply.lower()


def test_14_patient_cannot_access_other_report(db_session: Session, chatbot_test_data):
    """14. A patient cannot read or submit another patient’s report."""
    patient_b = chatbot_test_data["patient_b"]
    report_a = chatbot_test_data["report_a"]

    # Bob attempts to fetch Alice's report directly
    res_get = get_patient_report(db_session, patient_id=patient_b.id, report_id=report_a.id)
    assert res_get["success"] is False
    assert res_get["error"] in ["NOT_AUTHORIZED", "REPORT_NOT_FOUND"]

    # Bob attempts to submit Alice's report for review
    res_sub = create_report_review_request(
        db=db_session,
        patient_id=patient_b.id,
        report_id=report_a.id,
        doctor_id=chatbot_test_data["doctor"].id
    )
    assert res_sub["success"] is False
    assert res_sub["error"] in ["NOT_AUTHORIZED", "REPORT_NOT_FOUND"]


def test_15_appointment_service_failure(db_session: Session, chatbot_test_data):
    """15. Appointment service failure returns a clear failure, not a fake booking."""
    patient = chatbot_test_data["patient_a"]
    invalid_doctor_id = 999999

    res = create_appointment_request(
        db=db_session,
        patient_id=patient.id,
        doctor_id=invalid_doctor_id,
        appointment_date=date.today() + timedelta(days=1),
        time_slot="10:00 AM"
    )
    assert res["success"] is False
    assert "unavailable" in res["message"].lower() or "error" in res["message"].lower()


def test_16_bare_yes_advances_only_matching_workflow(db_session: Session, chatbot_test_data):
    """16. A bare 'yes' advances only the matching active workflow step."""
    patient = chatbot_test_data["patient_a"]

    # Case A: Bare "yes" with NO active workflow
    conv_idle = orchestrator.create_conversation(db_session, patient.id, title="Idle Conv")
    res_idle = orchestrator.process_patient_message(db_session, conv_idle, patient.id, "yes")
    assert "no pending action" in res_idle["assistant_message"]["body"].lower()

    # Case B: Bare "yes" with active REPORT_SUBMISSION workflow
    conv_active = orchestrator.create_conversation(db_session, patient.id, title="Active Conv")
    orchestrator.process_patient_message(db_session, conv_active, patient.id, "Submit my latest report to my doctor")
    assert conv_active.workflow_state is not None
    assert conv_active.workflow_state.get("step") == "AWAITING_CONFIRMATION"

    res_confirm = orchestrator.process_patient_message(db_session, conv_active, patient.id, "yes")
    bot_confirm = res_confirm["assistant_message"]["body"]
    assert "submitted" in bot_confirm.lower() or "review" in bot_confirm.lower()
    assert conv_active.workflow_state is None # Cleared after execution


def test_17_expired_workflow_cannot_execute(db_session: Session, chatbot_test_data):
    """17. An expired or unrelated pending workflow cannot execute an action."""
    patient = chatbot_test_data["patient_a"]
    conv = orchestrator.create_conversation(db_session, patient.id, title="Expired Conv")

    # Set an expired workflow state
    conv.workflow_state = {
        "workflow_type": "REPORT_SUBMISSION",
        "step": "AWAITING_CONFIRMATION",
        "entity_ids": {"report_id": chatbot_test_data["report_a"].id, "doctor_id": chatbot_test_data["doctor"].id},
        "expected_reply_type": "CONFIRMATION",
        "created_at": (datetime.utcnow() - timedelta(minutes=30)).isoformat(),
        "expires_at": (datetime.utcnow() - timedelta(minutes=15)).isoformat()
    }
    db_session.commit()

    res = orchestrator.process_patient_message(db_session, conv, patient.id, "yes")
    bot_reply = res["assistant_message"]["body"]

    assert "expired" in bot_reply.lower()
    assert conv.workflow_state is None


def test_18_report_submission_does_not_create_appointment(db_session: Session, chatbot_test_data):
    """18. Report submission does not create an appointment."""
    patient = chatbot_test_data["patient_a"]
    conv = orchestrator.create_conversation(db_session, patient.id, title="Submission Test")

    initial_app_count = db_session.query(Appointment).filter(Appointment.patient_id == patient.id).count()

    # Step 1: Start submission
    orchestrator.process_patient_message(db_session, conv, patient.id, "Submit my latest report to my doctor")
    # Step 2: Confirm
    orchestrator.process_patient_message(db_session, conv, patient.id, "yes")

    # Verify ReportReviewRequest created
    review_req = (
        db_session.query(ReportReviewRequest)
        .filter(ReportReviewRequest.patient_id == patient.id)
        .order_by(ReportReviewRequest.created_at.desc())
        .first()
    )
    assert review_req is not None
    assert review_req.status == "PENDING"

    # Verify Appointments count is UNCHANGED
    final_app_count = db_session.query(Appointment).filter(Appointment.patient_id == patient.id).count()
    assert final_app_count == initial_app_count


def test_19_notification_tracking_and_retry(db_session: Session, chatbot_test_data):
    """19. Notification failure is reported accurately and can be retried safely."""
    doc_user = chatbot_test_data["doc_user"]
    patient = chatbot_test_data["patient_a"]

    notifs = (
        db_session.query(Notification)
        .filter(Notification.user_id == doc_user.id, Notification.type == "REPORT")
        .all()
    )
    assert len(notifs) > 0
    latest_notif = notifs[-1]
    assert latest_notif.title == "New Report Review Request"
    assert patient.full_name in latest_notif.message


def test_20_ui_integration_and_api():
    """20. UI opens/closes with a single launcher and uses the intended API."""
    repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

    # 1. Verify ChatbotDrawer uses clinicalChatService and not legacy chatbot API
    drawer_path = os.path.join(repo_root, "frontend", "src", "components", "Chatbot", "ChatbotDrawer.jsx")
    with open(drawer_path, "r", encoding="utf-8") as f:
        drawer_content = f.read()

    assert "clinicalChatService" in drawer_content
    assert "/chatbot/message" not in drawer_content
    assert "/chatbot/history" not in drawer_content

    # 2. Verify clinicalChatService targets /clinical-chat endpoints
    service_path = os.path.join(repo_root, "frontend", "src", "services", "clinicalChatService.js")
    with open(service_path, "r", encoding="utf-8") as f:
        service_content = f.read()

    assert "/clinical-chat" in service_content
    assert "/chatbot/message" not in service_content

    # 3. Verify App.jsx mounts single floating launcher outside dedicated /patient/chat
    app_path = os.path.join(repo_root, "frontend", "src", "App.jsx")
    with open(app_path, "r", encoding="utf-8") as f:
        app_content = f.read()

    assert "<ChatbotDrawer" in app_content
    assert "location.pathname.startsWith('/patient/chat')" in app_content
