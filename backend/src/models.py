from sqlalchemy import Column, Integer, String, Float, JSON, DateTime, ForeignKey, Enum, Text, Boolean
from sqlalchemy.orm import DeclarativeBase, relationship
from sqlalchemy.sql import func
import datetime

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False)
    mobile_no = Column(String(20), unique=True, nullable=False)
    blood_group = Column(String(5), nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum('user', 'admin', 'patient', 'doctor', 'department_admin', 'hospital_admin', 'emergency_doctor'), default='patient')
    email_verified = Column(Integer, default=1)
    mobile_verified = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    patient_reports = relationship("PatientReport", back_populates="user")
    cbc_reports = relationship("CbcReport", back_populates="user")
    doctor_profile = relationship("Doctor", back_populates="user", uselist=False)

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(32), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    head_doctor_id = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    doctors = relationship("Doctor", back_populates="department")

class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    specialization = Column(String(150), nullable=False)
    qualification = Column(String(150), nullable=False)
    license_number = Column(String(64), nullable=True)
    experience_years = Column(Integer, default=0)
    availability = Column(JSON, nullable=True)
    status = Column(Enum('Active', 'OnLeave', 'Inactive'), default='Active')
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="doctor_profile")
    department = relationship("Department", back_populates="doctors")
    appointments = relationship("Appointment", back_populates="doctor")

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    appointment_date = Column(DateTime, nullable=False)
    time_slot = Column(String(32), nullable=True)
    status = Column(Enum('REQUESTED', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'), default='REQUESTED')
    reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    doctor = relationship("Doctor", back_populates="appointments")

class MedicalReport(Base):
    __tablename__ = "medical_reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="SET NULL"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    report_source = Column(Enum('hospital', 'existing_upload'), default='existing_upload')
    report_title = Column(String(255), nullable=False)
    report_type = Column(String(100), nullable=True)
    report_date = Column(DateTime, server_default=func.now())
    status = Column(Enum('UPLOADED', 'OCR_EXTRACTED', 'VALIDATED', 'AI_PRE_ANALYZED', 'DOCTOR_REVIEWED', 'FINALIZED'), default='UPLOADED')
    original_filename = Column(String(255), nullable=True)
    file_path = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    extractions = relationship("ReportExtraction", back_populates="report", uselist=False)
    ai_analysis = relationship("AIAnalysis", back_populates="report", uselist=False)
    doctor_review = relationship("DoctorReview", back_populates="report", uselist=False)

class ReportExtraction(Base):
    __tablename__ = "report_extractions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    report_id = Column(Integer, ForeignKey("medical_reports.id", ondelete="CASCADE"), nullable=False, unique=True)
    ocr_raw_text = Column(Text, nullable=True)
    extracted_json = Column(JSON, nullable=True)
    validation_status = Column(Enum('VALID', 'NEEDS_REVIEW', 'FAILED'), default='VALID')
    confidence_score = Column(Float, default=1.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    report = relationship("MedicalReport", back_populates="extractions")

class AIAnalysis(Base):
    __tablename__ = "ai_analyses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    report_id = Column(Integer, ForeignKey("medical_reports.id", ondelete="CASCADE"), nullable=False, unique=True)
    department_slug = Column(String(64), nullable=True)
    model_name = Column(String(100), nullable=False)
    model_version = Column(String(32), default="1.0")
    prediction = Column(String(100), nullable=False)
    probability = Column(Float, nullable=True)
    risk_level = Column(Enum('LOW', 'MODERATE', 'HIGH', 'CRITICAL'), default='LOW')
    important_factors = Column(JSON, nullable=True)
    explanation = Column(Text, nullable=True)
    requires_doctor_review = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    report = relationship("MedicalReport", back_populates="ai_analysis")

class DoctorReview(Base):
    __tablename__ = "doctor_reviews"

    id = Column(Integer, primary_key=True, autoincrement=True)
    report_id = Column(Integer, ForeignKey("medical_reports.id", ondelete="CASCADE"), nullable=False, unique=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)
    review_status = Column(Enum('APPROVED', 'MODIFIED', 'REJECTED'), default='APPROVED')
    clinical_notes = Column(Text, nullable=True)
    final_assessment = Column(Text, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), server_default=func.now())

    report = relationship("MedicalReport", back_populates="doctor_review")

class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    summary = Column(Text, nullable=True)
    medical_history_json = Column(JSON, nullable=True)
    allergies = Column(Text, nullable=True)
    current_medications = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class EmergencyRequest(Base):
    __tablename__ = "emergency_requests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    severity = Column(Enum('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'), default='HIGH')
    status = Column(Enum('REQUESTED', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_REVIEW', 'IN_TREATMENT', 'RESOLVED', 'CANCELLED'), default='REQUESTED')
    symptoms = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    contact_phone = Column(String(32), nullable=True)
    assigned_doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime, nullable=True)

class PatientDoctorMessage(Base):
    __tablename__ = "patient_doctor_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="CASCADE"), nullable=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(64), default="INFO")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PatientReport(Base):
    __tablename__ = "Patient_Reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    glucose = Column(Float(precision=2), nullable=True)
    blood_pressure = Column(Float(precision=2), nullable=True)
    skin_thickness = Column(Float(precision=2), nullable=True)
    insulin = Column(Float(precision=2), nullable=True)
    bmi = Column(Float(precision=2), nullable=True)
    diabetes_pedigree_function = Column(Float(precision=4), nullable=True)
    age = Column(Integer, nullable=True)
    
    diabetes_prediction = Column(String(64), nullable=True)
    hypertension_prediction = Column(String(64), nullable=True)
    heart_disease_prediction = Column(String(64), nullable=True)
    risk_level = Column(String(64), nullable=True)
    
    abnormal_count = Column(Integer, nullable=True)
    abnormal_json = Column(JSON, nullable=True)
    conditions_json = Column(JSON, nullable=True)
    specialists_json = Column(JSON, nullable=True)
    source = Column(String(32), nullable=True)

    user = relationship("User", back_populates="patient_reports")

class CbcReport(Base):
    __tablename__ = "Cbc_Reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    cbc_json = Column(JSON, nullable=True)
    interpretation_json = Column(JSON, nullable=True)
    source = Column(String(32), nullable=True)

    user = relationship("User", back_populates="cbc_reports")


class VerificationCode(Base):
    __tablename__ = "verification_codes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    target_type = Column(Enum('email', 'mobile'), nullable=False)
    target_value = Column(String(255), nullable=False)
    code = Column(String(6), nullable=False)
    is_verified = Column(Integer, default=0)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ModelRegistry(Base):
    __tablename__ = "model_registry"

    id = Column(Integer, primary_key=True, autoincrement=True)
    model_name = Column(String(64), unique=True, nullable=False)
    version = Column(String(32), nullable=False, default="1.0.0")
    algorithm = Column(String(64), nullable=False)
    accuracy = Column(Float, nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    auc_roc = Column(Float, nullable=True)
    status = Column(Enum('Active', 'Training', 'Deprecated', 'Idle'), default='Active')
    inference_count = Column(Integer, default=0)
    last_trained = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(255), nullable=False)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    status = Column(String(32), default="Success")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ChatConversation(Base):
    __tablename__ = "chat_conversations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), default="New Health Conversation")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    conversation_id = Column(Integer, ForeignKey("chat_conversations.id", ondelete="CASCADE"), nullable=False)
    sender = Column(Enum('user', 'assistant'), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PasswordResetOTP(Base):
    __tablename__ = "password_reset_otp"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), index=True, nullable=False)
    otp = Column(String(255), nullable=False)
    attempts = Column(Integer, default=0, nullable=False)
    verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)



