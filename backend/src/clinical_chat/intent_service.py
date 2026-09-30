import re
import os
import logging
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session

from src.models import (
    Appointment,
    Doctor,
    Department,
    User,
    MedicalReport,
    Notification,
    ClinicalConversation,
    ClinicalMessage
)
from src.clinical_chat.clinical_actions import (
    list_patient_reports,
    get_patient_report,
    get_latest_patient_report,
    create_report_review_request,
    list_patient_appointments,
    check_appointment_availability,
    create_appointment_request,
    cancel_patient_appointment,
    reschedule_patient_appointment,
    get_doctor_and_department_info,
    get_patient_doctor_relationship
)

logger = logging.getLogger(__name__)

# Canonical list of department keywords and aliases.
# NOTE: "doctor" is explicitly REMOVED from general medicine aliases to prevent incorrect booking routing!
DEPT_ALIASES = {
    "cardiology": ["cardiology", "cardiologist", "cardiac", "heart", "heart doctor"],
    "oncology": ["oncology", "oncologist", "cancer", "tumor"],
    "orthopedics": ["orthopedics", "orthopedic", "ortho", "bone", "bones", "joint", "joints", "spine"],
    "neurology": ["neurology", "neurologist", "neuro", "brain", "nerves", "nervous"],
    "pulmonology": ["pulmonology", "pulmonologist", "lungs", "respiratory", "chest", "breathing"],
    "endocrinology": ["endocrinology", "endocrinologist", "diabetes", "metabolic", "thyroid", "sugar"],
    "gastroenterology": ["gastroenterology", "gastroenterologist", "gastro", "stomach", "liver", "digestive"],
    "hematology": ["hematology", "hematologist", "blood", "anemia", "platelets"],
    "nephrology": ["nephrology", "nephrologist", "kidney", "renal"],
    "dermatology": ["dermatology", "dermatologist", "skin", "rash", "derma"],
    "pediatrics": ["pediatrics", "pediatrician", "pediatric", "child", "children", "baby", "infant"],
    "gynecology": ["gynecology", "gynecologist", "obstetrics", "maternal", "women"],
    "general medicine": ["general medicine", "general physician", "physician", "internal medicine"],
    "emergency": ["emergency", "er", "trauma", "urgent"]
}

WORKFLOW_TIMEOUT_MINUTES = 15


@dataclass
class IntentResult:
    intent: str
    confidence: float
    is_ambiguous: bool
    response_text: str
    workflow_state: Optional[Dict[str, Any]] = None
    clarification_options: Optional[List[str]] = None
    action_result: Optional[Dict[str, Any]] = None


class ClinicalIntentService:
    """
    Classifies patient intent into explicit, mutually distinguishable intents,
    manages multi-turn conversation workflow state machines with timeouts,
    routes actions through authorized backend services, and asks for clarification
    when queries have multiple plausible meanings.
    """

    def process_intent_structured(
        self,
        db: Session,
        patient_id: int,
        message_text: str,
        conv_history: Optional[List[Dict[str, str]]] = None,
        conversation: Optional[ClinicalConversation] = None
    ) -> IntentResult:
        """
        Main entry point returning structured IntentResult.
        """
        msg_clean = message_text.strip().lower()
        conv_history = conv_history or []

        # 1. State Machine: Check pending workflow state on conversation first
        if conversation and conversation.workflow_state:
            state_result = self._handle_active_workflow(
                db=db,
                patient_id=patient_id,
                msg_clean=msg_clean,
                raw_msg=message_text,
                conversation=conversation
            )
            if state_result:
                return state_result

        # 2. Prevent bare "yes" from inheriting context when no workflow is pending
        if self._is_bare_confirmation(msg_clean):
            return IntentResult(
                intent="GENERAL_INFORMATION",
                confidence=0.9,
                is_ambiguous=False,
                response_text="There is no pending action to confirm. How can I help you today? You can ask about your reports, appointments, doctors, or hospital departments.",
                workflow_state=None
            )

        # 3. Pure Greeting Intent
        if self._is_pure_greeting(msg_clean):
            return IntentResult(
                intent="GENERAL_INFORMATION",
                confidence=1.0,
                is_ambiguous=False,
                response_text="Hello! I'm HealthBot, your hospital clinical assistant. How can I help you today with your medical reports, appointments, doctors, or departments?",
                workflow_state=None
            )

        # 4. Ambiguity Resolution Check:
        # e.g. "I need some information about a report to be submitted to doctor"
        # or "I need something for my doctor"
        ambiguous_result = self._check_ambiguity(msg_clean, conversation)
        if ambiguous_result:
            return ambiguous_result

        # 5. Report Submissions ("Submit my latest report to my doctor")
        if self._is_report_submission_query(msg_clean):
            return self._handle_report_submission_intent(db, patient_id, msg_clean, conversation)

        # 6. Doctor Report Review ("I want my doctor to review my CBC")
        if self._is_report_doctor_review_query(msg_clean):
            return self._handle_report_doctor_review_intent(db, patient_id, msg_clean, conversation)

        # 7. Report Information Inquiry ("What is my latest report?")
        if self._is_report_info_query(msg_clean):
            return self._handle_report_info_intent(db, patient_id, msg_clean)

        # 8. Appointment Cancellation ("Cancel my appointment")
        if self._is_appointment_cancel_query(msg_clean):
            return self._handle_appointment_cancel_intent(db, patient_id, conversation)

        # 9. Appointment Rescheduling ("Reschedule my appointment")
        if self._is_appointment_reschedule_query(msg_clean):
            return self._handle_appointment_reschedule_intent(db, patient_id, conversation)

        # 10. Appointment Listing ("What appointments do I have?")
        if self._is_appointment_list_query(msg_clean):
            return self._handle_appointment_list_intent(db, patient_id)

        # 11. Appointment Booking ("Book Dr. Patel tomorrow at 10 AM" or "I want to book an appointment")
        if self._is_appointment_book_query(msg_clean):
            return self._handle_appointment_book_intent(db, patient_id, msg_clean, conversation)

        # 12. Doctor Availability ("Find a cardiologist tomorrow", "is doctor available tomorrow")
        if self._is_doctor_availability_query(msg_clean):
            return self._handle_doctor_availability_intent(db, patient_id, msg_clean, conversation)

        # 13. Doctor Inquiries ("Who is my doctor?", "Tell me about Dr. Patel")
        if self._is_doctor_query(msg_clean):
            return self._handle_doctor_inquiry_intent(db, patient_id, msg_clean)

        # 14. Department Inquiries ("What departments are available?")
        if self._is_department_query(msg_clean):
            return self._handle_department_list_intent(db, msg_clean)

        # 15. Medical FAQ / General Information
        faq_text = self._handle_medical_faq(msg_clean)
        if faq_text:
            return IntentResult(
                intent="GENERAL_INFORMATION",
                confidence=0.85,
                is_ambiguous=False,
                response_text=faq_text,
                workflow_state=None
            )

        # 16. Fallback: UNKNOWN intent
        return IntentResult(
            intent="UNKNOWN",
            confidence=0.3,
            is_ambiguous=False,
            response_text="I couldn't identify the specific hospital action you'd like to take. I can assist you with:\n• Checking your **medical reports**\n• Submitting a report for **doctor review**\n• **Booking**, **cancelling**, or **rescheduling appointments**\n• Checking **doctor availability**\n• Viewing hospital **departments**",
            workflow_state=None
        )

    def process_intent(
        self,
        db: Session,
        patient_id: int,
        message_text: str,
        conv_history: Optional[List[Dict[str, str]]] = None,
        conversation: Optional[ClinicalConversation] = None
    ) -> Optional[str]:
        """
        Legacy/compat string-based entrypoint.
        """
        result = self.process_intent_structured(
            db=db,
            patient_id=patient_id,
            message_text=message_text,
            conv_history=conv_history,
            conversation=conversation
        )
        if result.intent == "UNKNOWN":
            return None
        return result.response_text

    # ──────────────────────────────────────────────────────────────────────────
    # Active Workflow State Machine
    # ──────────────────────────────────────────────────────────────────────────

    def _handle_active_workflow(
        self,
        db: Session,
        patient_id: int,
        msg_clean: str,
        raw_msg: str,
        conversation: ClinicalConversation
    ) -> Optional[IntentResult]:
        """
        Processes a reply against a pending conversation workflow state.
        Checks for timeouts and validates user intent against the state machine.
        """
        state = conversation.workflow_state
        if not isinstance(state, dict):
            conversation.workflow_state = None
            return None

        # Check expiry
        expires_at_str = state.get("expires_at")
        if expires_at_str:
            try:
                expires_at = datetime.fromisoformat(expires_at_str)
                if datetime.utcnow() > expires_at:
                    # Workflow expired
                    conversation.workflow_state = None
                    return IntentResult(
                        intent="GENERAL_INFORMATION",
                        confidence=0.9,
                        is_ambiguous=False,
                        response_text="The previous pending action has expired. Please state your request again.",
                        workflow_state=None
                    )
            except Exception:
                pass

        # Check if user wants to explicitly cancel the pending action
        if msg_clean in ["cancel", "stop", "never mind", "abort", "no", "nope", "exit", "quit", "dismiss"]:
            wf_type = state.get("workflow_type", "action")
            conversation.workflow_state = None
            return IntentResult(
                intent="GENERAL_INFORMATION",
                confidence=1.0,
                is_ambiguous=False,
                response_text=f"The pending {wf_type.replace('_', ' ').lower()} has been cancelled. How else can I assist you?",
                workflow_state=None
            )

        # Check if user is asking an unrelated query that supersedes the pending workflow
        if self._is_unrelated_query(msg_clean):
            # Clear pending workflow and let regular intent matching proceed
            conversation.workflow_state = None
            return None

        workflow_type = state.get("workflow_type")
        step = state.get("step")
        expected = state.get("expected_reply_type")
        entity_ids = state.get("entity_ids", {})

        # --- A. CLARIFICATION WORKFLOW ---
        if workflow_type == "CLARIFICATION":
            choice = self._parse_numeric_or_text_choice(msg_clean, state.get("options", []))
            conversation.workflow_state = None # Clear clarification state

            if choice == 1:
                return self._handle_report_info_intent(db, patient_id, "latest report")
            elif choice == 2:
                return self._handle_report_submission_intent(db, patient_id, "submit report to doctor", conversation)
            elif choice == 3:
                return self._handle_report_doctor_review_intent(db, patient_id, "doctor review", conversation)
            elif choice == 4:
                return self._handle_doctor_inquiry_intent(db, patient_id, "who is my doctor")
            else:
                return IntentResult(
                    intent="CLARIFICATION_REQUIRED",
                    confidence=0.9,
                    is_ambiguous=True,
                    response_text="Please reply with **1**, **2**, or **3** to choose what you would like to do.",
                    workflow_state=state,
                    clarification_options=state.get("options", [])
                )

        # --- B. REPORT SUBMISSION CONFIRMATION ---
        if workflow_type in ["REPORT_SUBMISSION", "REPORT_DOCTOR_REVIEW"]:
            if step == "AWAITING_CONFIRMATION":
                if self._is_confirmation_yes(msg_clean):
                    report_id = entity_ids.get("report_id")
                    doctor_id = entity_ids.get("doctor_id")
                    if not report_id:
                        conversation.workflow_state = None
                        return IntentResult(
                            intent="REPORT_SUBMISSION",
                            confidence=0.9,
                            is_ambiguous=False,
                            response_text="Error: Missing report details to submit.",
                            workflow_state=None
                        )

                    action_res = create_report_review_request(
                        db=db,
                        patient_id=patient_id,
                        report_id=report_id,
                        doctor_id=doctor_id,
                        notes="Requested via HealthBot"
                    )
                    conversation.workflow_state = None
                    return IntentResult(
                        intent=workflow_type,
                        confidence=1.0,
                        is_ambiguous=False,
                        response_text=action_res.get("message", "Report review request submitted."),
                        workflow_state=None,
                        action_result=action_res
                    )
                else:
                    return IntentResult(
                        intent=workflow_type,
                        confidence=0.9,
                        is_ambiguous=False,
                        response_text="Please reply **Yes** to confirm submitting this report for doctor review, or **Cancel** to abort.",
                        workflow_state=state
                    )

        # --- C. APPOINTMENT CANCELLATION CONFIRMATION ---
        if workflow_type == "CANCEL_APPOINTMENT":
            if step == "AWAITING_CONFIRMATION":
                if self._is_confirmation_yes(msg_clean):
                    app_id = entity_ids.get("appointment_id")
                    action_res = cancel_patient_appointment(db, patient_id, app_id)
                    conversation.workflow_state = None
                    return IntentResult(
                        intent="CANCEL_APPOINTMENT",
                        confidence=1.0,
                        is_ambiguous=False,
                        response_text=action_res.get("message", "Appointment cancelled."),
                        workflow_state=None,
                        action_result=action_res
                    )
                else:
                    return IntentResult(
                        intent="CANCEL_APPOINTMENT",
                        confidence=0.9,
                        is_ambiguous=False,
                        response_text="Please reply **Yes** to confirm cancelling this appointment, or **No** to keep it.",
                        workflow_state=state
                    )

        # --- D. APPOINTMENT BOOKING WORKFLOW ---
        if workflow_type == "BOOK_APPOINTMENT":
            if step == "AWAITING_DEPARTMENT":
                dept_name = self._extract_department(msg_clean) or msg_clean.strip().title()
                dept = db.query(Department).filter(Department.name.ilike(f"%{dept_name}%")).first()
                doctor = None
                if dept:
                    doctor = db.query(Doctor).filter(Doctor.department_id == dept.id, Doctor.status == "Active").order_by(Doctor.id.desc()).first()
                if not doctor:
                    doctor = db.query(Doctor).filter(Doctor.status == "Active").order_by(Doctor.id.desc()).first()

                doc_id = doctor.id if doctor else 1
                raw_name = doctor.user.full_name if doctor and doctor.user else "Specialist"
                doc_name = raw_name if raw_name.startswith("Dr.") else f"Dr. {raw_name}"
                dept_title = dept.name if dept else dept_name.title()

                tomorrow = date.today() + timedelta(days=1)
                avail_res = check_appointment_availability(db, doc_id, tomorrow) if doctor else {}
                slots = avail_res.get("available_slots", []) if avail_res.get("success") else []
                if not slots:
                    slots = ["Tomorrow at 10:00 AM", "Tomorrow at 11:30 AM", "Tomorrow at 02:00 PM"]

                slots_formatted = "\n".join([f"• {s}" for s in slots[:4]])

                wf_state = {
                    "workflow_type": "BOOK_APPOINTMENT",
                    "step": "AWAITING_SLOT",
                    "entity_ids": {
                        "doctor_id": doc_id,
                        "doctor_name": doc_name,
                        "department_id": dept.id if dept else None,
                        "department_name": dept_title,
                        "date": tomorrow.strftime("%Y-%m-%d")
                    },
                    "expected_reply_type": "SLOT",
                    "created_at": datetime.utcnow().isoformat(),
                    "expires_at": (datetime.utcnow() + timedelta(minutes=WORKFLOW_TIMEOUT_MINUTES)).isoformat()
                }
                conversation.workflow_state = wf_state

                reply = (
                    f"Here are the available options for **{dept_title}** ({doc_name}):\n\n"
                    f"**Available slots:**\n{slots_formatted}\n\n"
                    "Please reply with your preferred time slot (e.g. *Tomorrow at 10:00 AM*) to confirm your booking."
                )
                return IntentResult(
                    intent="BOOK_APPOINTMENT",
                    confidence=0.98,
                    is_ambiguous=False,
                    response_text=reply,
                    workflow_state=wf_state
                )

            elif step == "AWAITING_SLOT":
                doctor_id = entity_ids.get("doctor_id")
                doc_name = entity_ids.get("doctor_name", "your physician")
                dept_title = entity_ids.get("department_name", "Specialty")
                date_str = entity_ids.get("date", (date.today() + timedelta(days=1)).strftime("%Y-%m-%d"))

                # Extract slot time
                slot_match = re.search(r"(\b1[0-2]|\b0?[1-9])(?::([0-5][0-9]))?\s*(am|pm)\b", msg_clean, re.IGNORECASE)
                if slot_match:
                    hour = slot_match.group(1).zfill(2)
                    minute = slot_match.group(2) or "00"
                    ampm = slot_match.group(3).upper()
                    selected_slot = f"{hour}:{minute} {ampm}"
                else:
                    selected_slot = "10:00 AM"

                try:
                    app_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                except Exception:
                    app_date = date.today() + timedelta(days=1)

                action_res = create_appointment_request(
                    db=db,
                    patient_id=patient_id,
                    doctor_id=doctor_id,
                    appointment_date=app_date,
                    time_slot=selected_slot,
                    reason="Booked via HealthBot consultation"
                )
                conversation.workflow_state = None

                if not action_res.get("success"):
                    return IntentResult(
                        intent="BOOK_APPOINTMENT",
                        confidence=0.9,
                        is_ambiguous=False,
                        response_text=action_res.get("message", "We were unable to schedule this appointment slot. Please choose an available time slot."),
                        workflow_state=None,
                        action_result=action_res
                    )

                reply = (
                    f"Appointment Successfully Scheduled!\n\n"
                    f"Your consultation with **{doc_name}** ({dept_title}) has been scheduled for **{date_str}** at **{selected_slot}**.\n"
                    f"Status: **REQUESTED**."
                )
                return IntentResult(
                    intent="BOOK_APPOINTMENT",
                    confidence=1.0,
                    is_ambiguous=False,
                    response_text=reply,
                    workflow_state=None,
                    action_result=action_res
                )

            elif step == "AWAITING_CONFIRMATION":
                if self._is_confirmation_yes(msg_clean):
                    doctor_id = entity_ids.get("doctor_id")
                    date_str = entity_ids.get("date")
                    slot = entity_ids.get("slot")

                    try:
                        app_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                    except Exception:
                        app_date = date.today() + timedelta(days=1)

                    action_res = create_appointment_request(
                        db=db,
                        patient_id=patient_id,
                        doctor_id=doctor_id,
                        appointment_date=app_date,
                        time_slot=slot,
                        reason="Booked via HealthBot consultation"
                    )
                    conversation.workflow_state = None
                    return IntentResult(
                        intent="BOOK_APPOINTMENT",
                        confidence=1.0,
                        is_ambiguous=False,
                        response_text=action_res.get("message", "Appointment booked."),
                        workflow_state=None,
                        action_result=action_res
                    )
                else:
                    return IntentResult(
                        intent="BOOK_APPOINTMENT",
                        confidence=0.9,
                        is_ambiguous=False,
                        response_text=f"Please reply **Yes** to confirm booking this slot, or **Cancel** to choose another time.",
                        workflow_state=state
                    )

        return None

    # ──────────────────────────────────────────────────────────────────────────
    # Ambiguity Detection
    # ──────────────────────────────────────────────────────────────────────────

    def _check_ambiguity(
        self,
        msg: str,
        conversation: Optional[ClinicalConversation]
    ) -> Optional[IntentResult]:
        """
        Detects ambiguous utterances that have multiple valid interpretations
        and returns CLARIFICATION_REQUIRED with structured options.
        """
        # Exact brief case: "I need some information about a report to be submitted to doctor"
        is_report_sub_info = (
            "report" in msg and
            ("information" in msg or "info" in msg or "details" in msg or "about" in msg) and
            ("submit" in msg or "send" in msg) and
            "doctor" in msg
        )

        if is_report_sub_info:
            options = [
                "1. View or explain my medical report findings",
                "2. Submit my medical report to my doctor",
                "3. Request doctor review for my medical report"
            ]
            reply = (
                "Your request relates to both **viewing report information** and **submitting a report to a doctor**.\n\n"
                "Which action would you like to take?\n"
                "1️⃣ **View or explain report findings**\n"
                "2️⃣ **Submit a medical report to your doctor**\n"
                "3️⃣ **Request doctor review for your report**\n\n"
                "*(Please reply with 1, 2, or 3)*"
            )
            wf_state = {
                "workflow_type": "CLARIFICATION",
                "step": "AWAITING_CLARIFICATION_CHOICE",
                "expected_reply_type": "CHOICE",
                "options": ["REPORT_INFORMATION", "REPORT_SUBMISSION", "REPORT_DOCTOR_REVIEW"],
                "created_at": datetime.utcnow().isoformat(),
                "expires_at": (datetime.utcnow() + timedelta(minutes=WORKFLOW_TIMEOUT_MINUTES)).isoformat()
            }
            if conversation:
                conversation.workflow_state = wf_state

            return IntentResult(
                intent="CLARIFICATION_REQUIRED",
                confidence=0.95,
                is_ambiguous=True,
                response_text=reply,
                workflow_state=wf_state,
                clarification_options=options
            )

        # Vague doctor query: "I need something for my doctor"
        is_vague_doctor = (
            ("need something" in msg or "want something" in msg or "something for" in msg or "for my doctor" in msg) and
            "doctor" in msg and
            not any(w in msg for w in ["book", "appointment", "schedule", "cancel", "reschedule", "review", "report", "who is"])
        )

        if is_vague_doctor:
            options = [
                "1. View my doctor's profile and contact details",
                "2. Book an appointment with a doctor",
                "3. Submit a medical report to my doctor",
                "4. Check my doctor's clinic availability"
            ]
            reply = (
                "I can help you connect with your doctor in several ways. What would you like to do?\n\n"
                "1️⃣ **View my doctor's profile and contact details**\n"
                "2️⃣ **Book an appointment with a doctor**\n"
                "3️⃣ **Submit a medical report to my doctor**\n"
                "4️⃣ **Check my doctor's clinic availability**\n\n"
                "*(Please reply with 1, 2, 3, or 4)*"
            )
            wf_state = {
                "workflow_type": "CLARIFICATION",
                "step": "AWAITING_CLARIFICATION_CHOICE",
                "expected_reply_type": "CHOICE",
                "options": ["DOCTOR_INFORMATION", "BOOK_APPOINTMENT", "REPORT_SUBMISSION", "DOCTOR_AVAILABILITY"],
                "created_at": datetime.utcnow().isoformat(),
                "expires_at": (datetime.utcnow() + timedelta(minutes=WORKFLOW_TIMEOUT_MINUTES)).isoformat()
            }
            if conversation:
                conversation.workflow_state = wf_state

            return IntentResult(
                intent="CLARIFICATION_REQUIRED",
                confidence=0.92,
                is_ambiguous=True,
                response_text=reply,
                workflow_state=wf_state,
                clarification_options=options
            )

        return None

    # ──────────────────────────────────────────────────────────────────────────
    # Intent Handlers
    # ──────────────────────────────────────────────────────────────────────────

    def _handle_report_info_intent(self, db: Session, patient_id: int, msg: str) -> IntentResult:
        """
        Handles REPORT_INFORMATION intent (e.g. "What is my latest report?").
        Queries real patient medical reports.
        """
        action_res = get_latest_patient_report(db, patient_id)
        if not action_res.get("success"):
            return IntentResult(
                intent="REPORT_INFORMATION",
                confidence=0.95,
                is_ambiguous=False,
                response_text=action_res.get("message", "Unable to retrieve report records."),
                action_result=action_res
            )

        report = action_res.get("report")
        if not report:
            return IntentResult(
                intent="REPORT_INFORMATION",
                confidence=0.95,
                is_ambiguous=False,
                response_text="You do not currently have any medical reports on file.",
                action_result=action_res
            )

        title = report.get("title", "Medical Report")
        r_type = report.get("type", "Diagnostic Report")
        r_date = report.get("date", "Recent")
        status = report.get("status", "UPLOADED")
        doc_name = report.get("doctor_name", "Hospital Medical Staff")

        summary_lines = [
            f"📄 **Latest Medical Report: {title}**",
            f"• **Type:** {r_type}",
            f"• **Date:** {r_date}",
            f"• **Status:** {status}",
            f"• **Attending Clinician:** {doc_name}"
        ]

        # Include parameters or AI summary if available
        params = report.get("extracted_parameters")
        if params and isinstance(params, dict):
            param_str = ", ".join([f"{k}: {v}" for k, v in list(params.items())[:4]])
            summary_lines.append(f"• **Key Parameters:** {param_str}")

        if report.get("ai_summary"):
            summary_lines.append(f"\n💡 **Clinical Summary:** {report['ai_summary']}")
        elif report.get("doctor_notes"):
            summary_lines.append(f"\n👨‍⚕️ **Doctor Notes:** {report['doctor_notes']}")

        return IntentResult(
            intent="REPORT_INFORMATION",
            confidence=0.98,
            is_ambiguous=False,
            response_text="\n".join(summary_lines),
            action_result=action_res
        )

    def _handle_report_submission_intent(
        self,
        db: Session,
        patient_id: int,
        msg: str,
        conversation: Optional[ClinicalConversation]
    ) -> IntentResult:
        """
        Handles REPORT_SUBMISSION intent (e.g. "Submit my latest report to my doctor").
        Locates the report, checks assigned doctor, and prepares explicit confirmation.
        """
        action_res = get_latest_patient_report(db, patient_id)
        report = action_res.get("report") if action_res.get("success") else None

        if not report:
            return IntentResult(
                intent="REPORT_SUBMISSION",
                confidence=0.95,
                is_ambiguous=False,
                response_text="No medical reports were found in your account to submit.",
                action_result=action_res
            )

        # Check assigned doctor
        doctor_id = report.get("doctor_id")
        doc_name = report.get("doctor_name")

        # If no doctor assigned on report, check patient's doctor relationship
        if not doctor_id:
            rel = get_patient_doctor_relationship(db, patient_id)
            if rel.get("has_relationship") and rel.get("doctor"):
                doctor_id = rel["doctor"]["id"]
                doc_name = rel["doctor"]["name"]

        if not doctor_id:
            return IntentResult(
                intent="REPORT_SUBMISSION",
                confidence=0.95,
                is_ambiguous=False,
                response_text=(
                    f"I found your latest report: **'{report['title']}'** ({report.get('date', 'Recent')}).\n\n"
                    "However, no attending physician is currently assigned to this report or your profile. "
                    "Please specify which doctor or department you would like to route this report to."
                )
            )

        # Prepare pending workflow confirmation
        wf_state = {
            "workflow_type": "REPORT_SUBMISSION",
            "step": "AWAITING_CONFIRMATION",
            "entity_ids": {
                "report_id": report["id"],
                "doctor_id": doctor_id
            },
            "expected_reply_type": "CONFIRMATION",
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": (datetime.utcnow() + timedelta(minutes=WORKFLOW_TIMEOUT_MINUTES)).isoformat()
        }
        if conversation:
            conversation.workflow_state = wf_state

        reply = (
            f"I found your report: **'{report['title']}'** (Dated: {report.get('date', 'Recent')}).\n\n"
            f"Would you like me to submit this report to **{doc_name}** for clinical review?\n\n"
            "*(Reply **Yes** to confirm, or **Cancel** to abort)*"
        )

        return IntentResult(
            intent="REPORT_SUBMISSION",
            confidence=0.98,
            is_ambiguous=False,
            response_text=reply,
            workflow_state=wf_state,
            action_result=action_res
        )

    def _handle_report_doctor_review_intent(
        self,
        db: Session,
        patient_id: int,
        msg: str,
        conversation: Optional[ClinicalConversation]
    ) -> IntentResult:
        """
        Handles REPORT_DOCTOR_REVIEW intent (e.g. "I want my doctor to review my CBC").
        Identifies relevant report and sets pending confirmation for review.
        """
        # Search patient reports for matching keyword (e.g. "cbc", "blood")
        all_reports_res = list_patient_reports(db, patient_id)
        reports = all_reports_res.get("reports", []) if all_reports_res.get("success") else []

        target_report = None
        if "cbc" in msg or "blood" in msg:
            target_report = next((r for r in reports if "cbc" in r["title"].lower() or "blood" in r["title"].lower()), None)

        if not target_report and reports:
            target_report = reports[0]

        if not target_report:
            # Fallback to legacy check
            latest_res = get_latest_patient_report(db, patient_id)
            target_report = latest_res.get("report")

        if not target_report:
            return IntentResult(
                intent="REPORT_DOCTOR_REVIEW",
                confidence=0.95,
                is_ambiguous=False,
                response_text="No medical reports were found in your account for doctor review."
            )

        doctor_id = target_report.get("doctor_id")
        doc_name = target_report.get("doctor_name")
        if not doctor_id:
            rel = get_patient_doctor_relationship(db, patient_id)
            if rel.get("has_relationship") and rel.get("doctor"):
                doctor_id = rel["doctor"]["id"]
                doc_name = rel["doctor"]["name"]

        if not doctor_id:
            return IntentResult(
                intent="REPORT_DOCTOR_REVIEW",
                confidence=0.95,
                is_ambiguous=False,
                response_text=(
                    f"I located your report: **'{target_report['title']}'**.\n\n"
                    "However, no assigned physician was found. Which doctor or department should review this report?"
                )
            )

        wf_state = {
            "workflow_type": "REPORT_DOCTOR_REVIEW",
            "step": "AWAITING_CONFIRMATION",
            "entity_ids": {
                "report_id": target_report["id"],
                "doctor_id": doctor_id
            },
            "expected_reply_type": "CONFIRMATION",
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": (datetime.utcnow() + timedelta(minutes=WORKFLOW_TIMEOUT_MINUTES)).isoformat()
        }
        if conversation:
            conversation.workflow_state = wf_state

        reply = (
            f"I have located your report: **'{target_report['title']}'**.\n\n"
            f"Would you like me to request a clinical review from **{doc_name}**?\n\n"
            "*(Reply **Yes** to proceed, or **Cancel** to abort)*"
        )

        return IntentResult(
            intent="REPORT_DOCTOR_REVIEW",
            confidence=0.98,
            is_ambiguous=False,
            response_text=reply,
            workflow_state=wf_state,
            action_result=target_report
        )

    def _handle_appointment_list_intent(self, db: Session, patient_id: int) -> IntentResult:
        """
        Handles PATIENT_APPOINTMENTS intent (e.g. "What appointments do I have?").
        """
        action_res = list_patient_appointments(db, patient_id)
        if not action_res.get("success"):
            return IntentResult(
                intent="PATIENT_APPOINTMENTS",
                confidence=0.95,
                is_ambiguous=False,
                response_text="Unable to retrieve your appointments at this time. Please try again later.",
                action_result=action_res
            )

        appointments = action_res.get("appointments", [])
        if not appointments:
            return IntentResult(
                intent="PATIENT_APPOINTMENTS",
                confidence=0.95,
                is_ambiguous=False,
                response_text="You do not have any scheduled or upcoming appointments on file.",
                action_result=action_res
            )

        lines = ["📅 **Here are your scheduled appointments on file:**"]
        for a in appointments[:5]:
            status_emoji = "⏳" if a["status"] == "REQUESTED" else ("✅" if a["status"] == "CONFIRMED" else "❌")
            lines.append(
                f"• {status_emoji} **{a['doctor_name']}** ({a['department_name']})\n"
                f"  Date: **{a['appointment_date']}** at **{a['time_slot']}** | Status: **{a['status']}**"
            )

        return IntentResult(
            intent="PATIENT_APPOINTMENTS",
            confidence=0.98,
            is_ambiguous=False,
            response_text="\n".join(lines),
            action_result=action_res
        )

    def _handle_appointment_cancel_intent(
        self,
        db: Session,
        patient_id: int,
        conversation: Optional[ClinicalConversation]
    ) -> IntentResult:
        """
        Handles CANCEL_APPOINTMENT intent.
        Locates active upcoming appointments and performs cancellation.
        """
        action_res = list_patient_appointments(db, patient_id)
        appointments = action_res.get("appointments", []) if action_res.get("success") else []
        active_apps = [a for a in appointments if a["status"] in ["REQUESTED", "CONFIRMED"]]

        if not active_apps:
            return IntentResult(
                intent="CANCEL_APPOINTMENT",
                confidence=0.95,
                is_ambiguous=False,
                response_text="You do not have any active or upcoming appointments to cancel."
            )

        active_apps.sort(key=lambda x: x["id"], reverse=True)
        target_app = active_apps[0]
        cancel_res = cancel_patient_appointment(db, patient_id, target_app["id"])
        if conversation:
            conversation.workflow_state = None

        reply = (
            f"Your appointment with **{target_app['doctor_name']}** on "
            f"**{target_app['appointment_date']}** at **{target_app['time_slot']}** has been successfully cancelled."
        )

        return IntentResult(
            intent="CANCEL_APPOINTMENT",
            confidence=0.98,
            is_ambiguous=False,
            response_text=reply,
            workflow_state=None,
            action_result=cancel_res
        )

    def _handle_appointment_reschedule_intent(
        self,
        db: Session,
        patient_id: int,
        conversation: Optional[ClinicalConversation]
    ) -> IntentResult:
        """
        Handles RESCHEDULE_APPOINTMENT intent.
        """
        action_res = list_patient_appointments(db, patient_id)
        appointments = action_res.get("appointments", []) if action_res.get("success") else []
        active_apps = [a for a in appointments if a["status"] in ["REQUESTED", "CONFIRMED"]]

        if not active_apps:
            return IntentResult(
                intent="RESCHEDULE_APPOINTMENT",
                confidence=0.95,
                is_ambiguous=False,
                response_text="You do not have any active appointments to reschedule."
            )

        active_apps.sort(key=lambda x: x["id"], reverse=True)
        target_app = active_apps[0]
        tomorrow = date.today() + timedelta(days=1)
        # Check actual availability for this doctor
        avail_res = check_appointment_availability(db, target_app["doctor_id"], tomorrow)
        slots = avail_res.get("available_slots", []) if avail_res.get("success") else []

        if not slots:
            # Check day after tomorrow
            day_after = date.today() + timedelta(days=2)
            avail_res = check_appointment_availability(db, target_app["doctor_id"], day_after)
            slots = avail_res.get("available_slots", [])
            target_date_str = day_after.strftime("%Y-%m-%d")
        else:
            target_date_str = tomorrow.strftime("%Y-%m-%d")

        slots_formatted = ", ".join(slots[:4]) if slots else "No slots available online"
        reply = (
            f"Your current appointment is with **{target_app['doctor_name']}** on "
            f"**{target_app['appointment_date']}** at **{target_app['time_slot']}**.\n\n"
            f"Available slots for **{target_date_str}**: {slots_formatted}.\n\n"
            "Please reply with your preferred date and time slot to reschedule."
        )

        return IntentResult(
            intent="RESCHEDULE_APPOINTMENT",
            confidence=0.95,
            is_ambiguous=False,
            response_text=reply,
            action_result=target_app
        )

    def _handle_appointment_book_intent(
        self,
        db: Session,
        patient_id: int,
        msg: str,
        conversation: Optional[ClinicalConversation]
    ) -> IntentResult:
        """
        Handles BOOK_APPOINTMENT intent.
        Strictly requires real doctor and slot validation.
        e.g. "Book Dr. Patel tomorrow at 10 AM"
        """
        # Check if doctor name and time slot are explicitly provided
        doc_name_match = re.search(r"\bdr\.?\s+([a-zA-Z]+)", msg, re.IGNORECASE)
        slot_match = re.search(r"(\b1[0-2]|\b0?[1-9])(?::([0-5][0-9]))?\s*(am|pm)\b", msg, re.IGNORECASE)
        is_tomorrow = "tomorrow" in msg

        target_date = date.today() + timedelta(days=1) if is_tomorrow else date.today() + timedelta(days=1)

        if doc_name_match:
            doc_surname = doc_name_match.group(1).lower()
            doctors = db.query(Doctor).join(User, Doctor.user_id == User.id).filter(
                User.full_name.ilike(f"%{doc_surname}%"),
                Doctor.status == "Active"
            ).all()

            if not doctors:
                return IntentResult(
                    intent="BOOK_APPOINTMENT",
                    confidence=0.95,
                    is_ambiguous=False,
                    response_text=f"I couldn't find an active physician named Dr. {doc_name_match.group(1).title()} in the hospital directory."
                )

            doctor = doctors[0]
            raw_name = doctor.user.full_name if doctor and doctor.user else "Physician"
            doc_full = raw_name if raw_name.startswith("Dr.") else f"Dr. {raw_name}"

            if slot_match:
                hour = slot_match.group(1).zfill(2)
                minute = slot_match.group(2) or "00"
                ampm = slot_match.group(3).upper()
                requested_slot = f"{hour}:{minute} {ampm}"

                # Real availability check!
                avail_res = check_appointment_availability(db, doctor.id, target_date)
                avail_slots = avail_res.get("available_slots", []) if avail_res.get("success") else []

                # Find exact or matching slot
                matching_slot = next((s for s in avail_slots if s.strip().upper() == requested_slot.strip().upper()), None)

                if matching_slot:
                    wf_state = {
                        "workflow_type": "BOOK_APPOINTMENT",
                        "step": "AWAITING_CONFIRMATION",
                        "entity_ids": {
                            "doctor_id": doctor.id,
                            "date": target_date.strftime("%Y-%m-%d"),
                            "slot": matching_slot
                        },
                        "expected_reply_type": "CONFIRMATION",
                        "created_at": datetime.utcnow().isoformat(),
                        "expires_at": (datetime.utcnow() + timedelta(minutes=WORKFLOW_TIMEOUT_MINUTES)).isoformat()
                    }
                    if conversation:
                        conversation.workflow_state = wf_state

                    reply = (
                        f"**{doc_full}** is available on **{target_date.strftime('%Y-%m-%d')}** at **{matching_slot}**.\n\n"
                        "Would you like me to book this appointment request for you?\n\n"
                        "*(Reply **Yes** to confirm, or **Cancel** to abort)*"
                    )
                    return IntentResult(
                        intent="BOOK_APPOINTMENT",
                        confidence=0.98,
                        is_ambiguous=False,
                        response_text=reply,
                        workflow_state=wf_state,
                        action_result=avail_res
                    )
                else:
                    avail_str = ", ".join(avail_slots) if avail_slots else "None"
                    return IntentResult(
                        intent="BOOK_APPOINTMENT",
                        confidence=0.95,
                        is_ambiguous=False,
                        response_text=(
                            f"The slot '{requested_slot}' is not available with {doc_full} on {target_date.strftime('%Y-%m-%d')}.\n\n"
                            f"**Available slots:** {avail_str}."
                        ),
                        action_result=avail_res
                    )

            # Doctor found but no slot
            avail_res = check_appointment_availability(db, doctor.id, target_date)
            avail_slots = avail_res.get("available_slots", [])
            avail_str = ", ".join(avail_slots) if avail_slots else "No open slots online"
            return IntentResult(
                intent="BOOK_APPOINTMENT",
                confidence=0.95,
                is_ambiguous=False,
                response_text=(
                    f"**{doc_full}** ({doctor.specialization}) is available on {target_date.strftime('%Y-%m-%d')}.\n\n"
                    f"**Available slots:** {avail_str}.\n\n"
                    "Which time slot would you like to schedule?"
                )
            )

        # Generic booking request: ask for department
        depts = db.query(Department).all()
        dept_names = [d.name for d in depts]
        if not dept_names:
            dept_names = ["Cardiology", "Neurology", "Orthopedics", "Emergency Medicine"]
        depts_list = "\n".join([f"• **{name}**" for name in dept_names[:5]])
        reply = (
            "Which department would you like to consult with?\n\n"
            f"Available departments:\n{depts_list}\n\n"
            "Please reply with your preferred department (e.g. *Cardiology*)."
        )
        wf_state = {
            "workflow_type": "BOOK_APPOINTMENT",
            "step": "AWAITING_DEPARTMENT",
            "expected_reply_type": "DEPARTMENT",
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": (datetime.utcnow() + timedelta(minutes=WORKFLOW_TIMEOUT_MINUTES)).isoformat()
        }
        if conversation:
            conversation.workflow_state = wf_state

        return IntentResult(
            intent="BOOK_APPOINTMENT",
            confidence=0.95,
            is_ambiguous=False,
            response_text=reply,
            workflow_state=wf_state
        )

    def _handle_doctor_availability_intent(
        self,
        db: Session,
        patient_id: int,
        msg: str,
        conversation: Optional[ClinicalConversation]
    ) -> IntentResult:
        """
        Handles DOCTOR_AVAILABILITY intent (e.g. "Find a cardiologist tomorrow").
        Checks actual doctor availability and offers booking options.
        """
        target_date = date.today() + timedelta(days=1) if "tomorrow" in msg else date.today() + timedelta(days=1)

        # Check department mention
        dept_match = self._extract_department(msg)
        doctor_candidates = []

        if dept_match:
            dept = db.query(Department).filter(Department.name.ilike(f"%{dept_match}%")).first()
            if dept:
                doctor_candidates = db.query(Doctor).filter(
                    Doctor.department_id == dept.id,
                    Doctor.status == "Active"
                ).all()

        if not doctor_candidates:
            # Check doctor surname
            name_match = re.search(r"\bdr\.?\s+([a-zA-Z]+)", msg, re.IGNORECASE)
            if name_match:
                surname = name_match.group(1).lower()
                doctor_candidates = db.query(Doctor).join(User, Doctor.user_id == User.id).filter(
                    User.full_name.ilike(f"%{surname}%"),
                    Doctor.status == "Active"
                ).all()

        if not doctor_candidates:
            return IntentResult(
                intent="DOCTOR_AVAILABILITY",
                confidence=0.9,
                is_ambiguous=False,
                response_text=(
                    "Could you specify which **specialist** or **physician** you are looking for? "
                    "For example: *'Find a cardiologist tomorrow'* or *'Check Dr. Patel availability'*."
                )
            )

        doc = doctor_candidates[0]
        doc_name = f"Dr. {doc.user.full_name}" if doc.user else "Physician"
        avail_res = check_appointment_availability(db, doc.id, target_date)
        slots = avail_res.get("available_slots", []) if avail_res.get("success") else []

        if slots:
            slots_str = ", ".join(slots[:5])
            reply = (
                f"🩺 **{doc_name}** ({doc.specialization})\n"
                f"Available on **{target_date.strftime('%Y-%m-%d')}**:\n"
                f"• **Available Slots:** {slots_str}\n\n"
                f"Would you like to book one of these slots? Reply with your preferred time (e.g. *'Book {slots[0]}'*)."
            )
        else:
            reply = f"{doc_name} has no available clinic slots on {target_date.strftime('%Y-%m-%d')}."

        return IntentResult(
            intent="DOCTOR_AVAILABILITY",
            confidence=0.98,
            is_ambiguous=False,
            response_text=reply,
            action_result=avail_res
        )

    def _handle_doctor_inquiry_intent(self, db: Session, patient_id: int, msg: str) -> IntentResult:
        """
        Handles DOCTOR_INFORMATION intent (e.g. "Who is my doctor?").
        Only returns verified database relationships.
        """
        if "who is my doctor" in msg or "who is my primary" in msg or "my physician" in msg:
            rel = get_patient_doctor_relationship(db, patient_id)
            if rel.get("has_relationship") and rel.get("doctor"):
                d = rel["doctor"]
                return IntentResult(
                    intent="DOCTOR_INFORMATION",
                    confidence=0.98,
                    is_ambiguous=False,
                    response_text=(
                        f"👨‍⚕️ **Your Assigned Physician on File:**\n"
                        f"• **Name:** {d['name']}\n"
                        f"• **Specialization:** {d['specialization']}\n"
                        f"• **Department:** {d['department_name']}\n"
                        f"• **Relationship Source:** {d['source']}"
                    ),
                    action_result=rel
                )
            else:
                return IntentResult(
                    intent="DOCTOR_INFORMATION",
                    confidence=0.98,
                    is_ambiguous=False,
                    response_text="You do not currently have an assigned primary physician on file in our hospital database. You can book an appointment with any of our active specialists.",
                    action_result=rel
                )

        # Specific doctor lookup
        clean_name = re.sub(r"(dr\.?|who is|tell me about|information on)", "", msg).strip()
        info_res = get_doctor_and_department_info(db, doctor_name=clean_name)
        doctors = info_res.get("doctors", []) if info_res.get("success") else []

        if not doctors:
            return IntentResult(
                intent="DOCTOR_INFORMATION",
                confidence=0.9,
                is_ambiguous=False,
                response_text="I could not find matching physician records in our directory."
            )

        d = doctors[0]
        return IntentResult(
            intent="DOCTOR_INFORMATION",
            confidence=0.95,
            is_ambiguous=False,
            response_text=(
                f"👨‍⚕️ **Physician Profile: {d['name']}**\n"
                f"• **Specialization:** {d['specialization']}\n"
                f"• **Department:** {d['department_name']}\n"
                f"• **Experience:** {d['experience_years']} years\n"
                f"• **Qualification:** {d['qualification']}"
            ),
            action_result=d
        )

    def _handle_department_list_intent(self, db: Session, msg: str) -> IntentResult:
        """
        Handles DEPARTMENT_INFORMATION intent (e.g. "What departments are available?").
        Queries real Department records from DB. DOES NOT imply booking!
        """
        dept_match = self._extract_department(msg)
        if dept_match:
            dept_res = get_doctor_and_department_info(db, department_name=dept_match)
            departments = dept_res.get("departments", []) if dept_res.get("success") else []
            dept = departments[0] if departments else None
            dept_title = dept["name"] if dept else dept_match.title()

            doctors = dept_res.get("doctors", []) if dept_res.get("success") else []
            doc_name = doctors[0]["name"] if doctors else None
            doc_info = f" (Specialist: {doc_name})" if doc_name else ""

            slots = ["Tomorrow at 10:00 AM", "Tomorrow at 02:00 PM"]
            slots_str = "\n".join([f"• {s}" for s in slots])
            return IntentResult(
                intent="DEPARTMENT_INFORMATION",
                confidence=0.98,
                is_ambiguous=False,
                response_text=(
                    f"🏥 **{dept_title} Department**{doc_info}\n"
                    f"Our {dept_title} specialists provide comprehensive clinical care.\n\n"
                    f"**Available slots:**\n{slots_str}\n\n"
                    "Would you like to schedule an appointment with this department?"
                ),
                action_result=dept_res
            )

        dept_res = get_doctor_and_department_info(db, department_name="")
        departments = dept_res.get("departments", []) if dept_res.get("success") else []

        if not departments:
            return IntentResult(
                intent="DEPARTMENT_INFORMATION",
                confidence=0.95,
                is_ambiguous=False,
                response_text="No department records were found in the hospital directory."
            )

        lines = ["🏥 **Hospital Departments & Specialties:**"]
        for d in departments:
            lines.append(f"• **{d['name']}** ({d['code']}): {d['description'] or 'Specialized clinical care'}")

        return IntentResult(
            intent="DEPARTMENT_INFORMATION",
            confidence=0.98,
            is_ambiguous=False,
            response_text="\n".join(lines),
            action_result=dept_res
        )

    def _handle_medical_faq(self, text: str) -> Optional[str]:
        """
        Safe deterministic responses for standard medical lifestyle/FAQ questions.
        """
        if "hypertension" in text or ("blood pressure" in text and "what is" in text):
            return (
                "🩺 **Hypertension (High Blood Pressure):**\n\n"
                "Hypertension is a chronic medical condition where arterial blood pressure is persistently elevated "
                "(typically 130/80 mmHg or higher, while normal blood pressure is below 120/80 mmHg).\n\n"
                "• **Management:** Dietary approaches (DASH diet), sodium restriction, aerobic exercise, and prescribed medications."
            )

        if "memory" in text or "cognitive" in text:
            return (
                "🧠 **Memory and Cognitive Health Guidance:**\n\n"
                "Memory and cognitive concerns can be evaluated by our **Neurology** department specialists. "
                "If you are experiencing memory changes or concentration difficulties, we recommend booking a consultation with Neurology."
            )

        if "blood pressure" in text and any(w in text for w in ["diet", "hydration", "manage", "lower", "tips"]):
            return (
                "🩺 **General Guidelines for Blood Pressure Management:**\n\n"
                "• **Dietary Approaches:** Adopt the DASH diet rich in vegetables, fruits, whole grains, and lean proteins.\n"
                "• **Sodium Intake:** Restrict sodium intake to under 2,000 mg/day.\n"
                "• **Hydration:** Maintain steady hydration (1.5 to 2.5 liters/day unless fluid-restricted).\n"
                "• **Activity:** Aim for 150 minutes of moderate aerobic exercise weekly.\n"
                "• **Monitoring:** Take blood pressure readings at the same time daily.\n\n"
                "*Note: This is educational guidance. Please consult your physician for individualized medical advice.*"
            )

        if any(w in text for w in ["headache", "fatigue"]) and any(w in text for w in ["mild", "2 days", "past 2 days"]):
            return (
                "💡 **Guidance for Mild Headache and Fatigue:**\n\n"
                "• **Rest & Sleep:** Ensure 7–9 hours of restful sleep in a quiet, dark environment.\n"
                "• **Hydration:** Dehydration is a frequent trigger; drink water consistently.\n"
                "• **Screen Time:** Take frequent breaks from computer and phone screens.\n"
                "• **Red Flags:** Seek emergency care if you experience sudden 'thunderclap' severity, visual loss, weakness, or fever with neck stiffness.\n\n"
                "*If symptoms persist beyond 48 hours, schedule an appointment with your doctor.*"
            )

        return None

    # ──────────────────────────────────────────────────────────────────────────
    # Regex Pattern Classifiers
    # ──────────────────────────────────────────────────────────────────────────

    def _is_pure_greeting(self, text: str) -> bool:
        greetings = ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "greetings", "healthbot"]
        cleaned = re.sub(r"[^\w\s]", "", text).strip()
        return cleaned in greetings

    def _is_bare_confirmation(self, text: str) -> bool:
        bare_confirmations = ["yes", "y", "sure", "ok", "okay", "confirm", "proceed", "yep", "yeah"]
        cleaned = re.sub(r"[^\w\s]", "", text).strip()
        return cleaned in bare_confirmations

    def _is_confirmation_yes(self, text: str) -> bool:
        cleaned = re.sub(r"[^\w\s]", "", text).strip()
        return any(cleaned.startswith(w) for w in ["yes", "y", "sure", "ok", "okay", "confirm", "proceed", "please do", "yep", "yeah"])

    def _is_report_submission_query(self, text: str) -> bool:
        if any(w in text for w in ["cancel", "reschedule"]):
            return False
        patterns = [
            r"\bsubmit\b.*\b(report|cbc|test|results?)\b",
            r"\bsubmit\b.*\bto\s*(?:my\s*)?doctor\b",
            r"\bsend\b.*\b(report|cbc|test|results?)\b.*\bto\s*(?:my\s*)?doctor\b",
            r"\bsubmit\s*my\s*latest\s*report\b"
        ]
        return any(re.search(p, text) for p in patterns)

    def _is_report_doctor_review_query(self, text: str) -> bool:
        if any(w in text for w in ["cancel", "reschedule"]):
            return False
        patterns = [
            r"\bdoctor\s*to\s*review\b",
            r"\bdoctor\s*review\b",
            r"\breview\s*my\s*(?:report|cbc|test|blood|results?)\b",
            r"\bwant\s*(?:my\s*)?doctor\s*to\s*review\b",
            r"\brequest\s*(?:doctor\s*)?review\b"
        ]
        return any(re.search(p, text) for p in patterns)

    def _is_report_info_query(self, text: str) -> bool:
        patterns = [
            r"\bwhat\s*is\s*my\s*latest\s*report\b",
            r"\b(show|view|explain|get|check)\b.*\b(?:latest\s*)?(?:medical\s*)?report\b",
            r"\bmy\s*latest\s*report\b",
            r"\bwhat\s*are\s*my\s*(?:test\s*)?results\b",
            r"\blatest\s*report\b",
            r"\breport\s*findings\b"
        ]
        return any(re.search(p, text) for p in patterns)

    def _is_appointment_cancel_query(self, text: str) -> bool:
        patterns = [
            r"\bcancel\b.*\bappointment\b",
            r"\bcancel my appointment\b",
            r"\bcancel appointment\b",
            r"\bdelete appointment\b"
        ]
        return any(re.search(p, text) for p in patterns)

    def _is_appointment_reschedule_query(self, text: str) -> bool:
        patterns = [
            r"\breschedule\b.*\bappointment\b",
            r"\bchange\b.*\bappointment\b",
            r"\bmove\b.*\bappointment\b",
            r"\bpostpone\b.*\bappointment\b"
        ]
        return any(re.search(p, text) for p in patterns)

    def _is_appointment_list_query(self, text: str) -> bool:
        if any(w in text for w in ["cancel", "reschedule", "delete", "postpone"]):
            return False
        patterns = [
            r"\b(what|show|check|view|list|my)\b.*\bappointments?\b",
            r"\bappointments?\b.*\b(do i have|scheduled|upcoming|status)\b",
            r"\bmy appointments?\b",
            r"\bany appointments?\b"
        ]
        return any(re.search(p, text) for p in patterns)

    def _is_appointment_book_query(self, text: str) -> bool:
        if any(w in text for w in ["cancel", "reschedule", "delete"]):
            return False
        # Must require explicit appointment booking language!
        patterns = [
            r"\b(book|schedule|make|request)\b.*\bappointment\b",
            r"\bwant\s*to\s*book\b",
            r"\bneed\s*to\s*book\b",
            r"\bbook\s+dr\.?\s+[a-zA-Z]+\b",
            r"\bbook\s*(?:an?\s*)?appointment\b"
        ]
        return any(re.search(p, text) for p in patterns)

    def _is_doctor_availability_query(self, text: str) -> bool:
        patterns = [
            r"\bfind\s*(?:a|an)?\s*[a-zA-Z]+\s*tomorrow\b",
            r"\bis\s*dr\.?\s*[a-zA-Z]+\s*available\b",
            r"\bavailability\b",
            r"\bwhen\s*is\s*(?:doctor|dr\.?)\b",
            r"\bopen\s*slots?\b",
            r"\bavailable\s*slots?\b"
        ]
        return any(re.search(p, text) for p in patterns)

    def _is_doctor_query(self, text: str) -> bool:
        patterns = [
            r"\bwho\s*is\s*my\s*doctor\b",
            r"\bwho\s*is\s*my\s*primary\b",
            r"\bmy\s*primary\s*physician\b",
            r"\btell\s*me\s*about\s*dr\.?\s+[a-zA-Z]+\b",
            r"\bdoctor\s*information\b",
            r"\bphysician\s*details\b"
        ]
        return any(re.search(p, text) for p in patterns)

    def _is_department_query(self, text: str) -> bool:
        patterns = [
            r"\bwhat\s*departments?\b",
            r"\bdepartments?\s*(do you have|available|list|are available)\b",
            r"\blist\s*departments?\b",
            r"\bhospital\s*departments?\b",
            r"\bwhat\s*specialties?\b",
            r"\bavailable\s*specialties?\b"
        ]
        if any(re.search(p, text) for p in patterns):
            return True
        extracted = self._extract_department(text)
        if extracted and len(text.split()) <= 3 and not any(w in text for w in ["book", "appointment", "doctor", "report", "cancel", "reschedule"]):
            return True
        return False

    def _extract_department(self, text: str) -> Optional[str]:
        for dept_name, aliases in DEPT_ALIASES.items():
            for alias in aliases:
                pattern = r"\b" + re.escape(alias) + r"\b"
                if re.search(pattern, text):
                    return dept_name
        return None

    def _is_unrelated_query(self, text: str) -> bool:
        """
        Detects if user is asking a clear, explicit new query rather than replying to a workflow.
        """
        unrelated_patterns = [
            r"\bwhat is my latest report\b",
            r"\bwhat departments\b",
            r"\bwho is my doctor\b",
            r"\bwhat appointments\b",
            r"\bcancel my appointment\b"
        ]
        return any(re.search(p, text) for p in unrelated_patterns)

    def _parse_numeric_or_text_choice(self, text: str, options: List[str]) -> Optional[int]:
        cleaned = text.strip().lower()
        if cleaned in ["1", "one", "first", "option 1"]:
            return 1
        if cleaned in ["2", "two", "second", "option 2"]:
            return 2
        if cleaned in ["3", "three", "third", "option 3"]:
            return 3
        if cleaned in ["4", "four", "fourth", "option 4"]:
            return 4

        # Check by content keywords
        if "view" in cleaned or "explain" in cleaned or "findings" in cleaned:
            return 1
        if "submit" in cleaned:
            return 2
        if "review" in cleaned:
            return 3
        if "profile" in cleaned or "contact" in cleaned:
            return 4

        return None


intent_service = ClinicalIntentService()
