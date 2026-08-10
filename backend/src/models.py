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
    role = Column(Enum('user', 'admin'), default='user')
    email_verified = Column(Integer, default=1)
    mobile_verified = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    patient_reports = relationship("PatientReport", back_populates="user")
    cbc_reports = relationship("CbcReport", back_populates="user")

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



