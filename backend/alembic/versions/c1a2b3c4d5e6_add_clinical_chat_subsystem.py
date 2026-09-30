"""add clinical chat subsystem tables

Revision ID: c1a2b3c4d5e6
Revises: 3e35c85acf8b
Create Date: 2026-09-28 14:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

# revision identifiers, used by Alembic.
revision: str = 'c1a2b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = '3e35c85acf8b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    existing_tables = set(inspector.get_table_names())

    # 1. clinical_conversations
    if 'clinical_conversations' not in existing_tables:
        op.create_table(
            'clinical_conversations',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('patient_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            sa.Column('title', sa.String(length=255), server_default='Clinical Conversation', nullable=False),
            sa.Column(
                'status',
                sa.Enum('OPEN', 'AWAITING_DOCTOR', 'DOCTOR_RESPONDED', 'ESCALATED', 'RESOLVED', name='clinical_conversation_status_enum'),
                server_default='OPEN',
                nullable=False
            ),
            sa.Column(
                'urgency',
                sa.Enum('NORMAL', 'LOW_PRIORITY', 'MODERATE', 'HIGH_PRIORITY', 'EMERGENCY_REVIEW', name='clinical_urgency_enum'),
                server_default='NORMAL',
                nullable=False
            ),
            sa.Column('department_id', sa.Integer(), sa.ForeignKey('departments.id', ondelete='SET NULL'), nullable=True),
            sa.Column('assigned_doctor_id', sa.Integer(), sa.ForeignKey('doctors.id', ondelete='SET NULL'), nullable=True),
            sa.Column(
                'escalation_status',
                sa.Enum('NONE', 'PENDING_ACK', 'ACKNOWLEDGED', 'RESOLVED', name='escalation_status_enum'),
                server_default='NONE',
                nullable=False
            ),
            sa.Column('source_legacy_id', sa.Integer(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_clinical_conversations_patient_id', 'clinical_conversations', ['patient_id'])
        op.create_index('ix_clinical_conversations_status', 'clinical_conversations', ['status'])
        op.create_index('ix_clinical_conversations_urgency', 'clinical_conversations', ['urgency'])
        op.create_index('ix_clinical_conversations_department_id', 'clinical_conversations', ['department_id'])
        op.create_index('ix_clinical_conversations_assigned_doctor_id', 'clinical_conversations', ['assigned_doctor_id'])
        op.create_index('ix_clinical_conversations_escalation_status', 'clinical_conversations', ['escalation_status'])

    # 2. clinical_messages
    if 'clinical_messages' not in existing_tables:
        op.create_table(
            'clinical_messages',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('conversation_id', sa.Integer(), sa.ForeignKey('clinical_conversations.id', ondelete='CASCADE'), nullable=False),
            sa.Column(
                'sender_type',
                sa.Enum('patient', 'doctor', 'assistant', 'system', name='clinical_sender_type_enum'),
                nullable=False
            ),
            sa.Column('sender_user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
            sa.Column('body', sa.Text(), nullable=False),
            sa.Column('redaction_metadata', sa.JSON(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_clinical_messages_conversation_id', 'clinical_messages', ['conversation_id'])
        op.create_index('ix_clinical_messages_created_at', 'clinical_messages', ['created_at'])

    # 3. clinical_assignments
    if 'clinical_assignments' not in existing_tables:
        op.create_table(
            'clinical_assignments',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('conversation_id', sa.Integer(), sa.ForeignKey('clinical_conversations.id', ondelete='CASCADE'), nullable=False),
            sa.Column('department_id', sa.Integer(), sa.ForeignKey('departments.id', ondelete='SET NULL'), nullable=True),
            sa.Column('doctor_id', sa.Integer(), sa.ForeignKey('doctors.id', ondelete='SET NULL'), nullable=True),
            sa.Column('assigned_by_user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
            sa.Column('reason', sa.Text(), nullable=True),
            sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
            sa.Column('assigned_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column('unassigned_at', sa.DateTime(timezone=True), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_clinical_assignments_conversation_id', 'clinical_assignments', ['conversation_id'])
        op.create_index('ix_clinical_assignments_department_id', 'clinical_assignments', ['department_id'])
        op.create_index('ix_clinical_assignments_doctor_id', 'clinical_assignments', ['doctor_id'])
        op.create_index('ix_clinical_assignments_is_active', 'clinical_assignments', ['is_active'])

    # 4. clinical_alerts
    if 'clinical_alerts' not in existing_tables:
        op.create_table(
            'clinical_alerts',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('conversation_id', sa.Integer(), sa.ForeignKey('clinical_conversations.id', ondelete='CASCADE'), nullable=False),
            sa.Column(
                'status',
                sa.Enum('TRIGGERED', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED', name='clinical_alert_status_enum'),
                server_default='TRIGGERED',
                nullable=False
            ),
            sa.Column('reason', sa.Text(), nullable=False),
            sa.Column(
                'urgency',
                sa.Enum('NORMAL', 'LOW_PRIORITY', 'MODERATE', 'HIGH_PRIORITY', 'EMERGENCY_REVIEW', name='clinical_urgency_enum'),
                nullable=False
            ),
            sa.Column('department_id', sa.Integer(), sa.ForeignKey('departments.id', ondelete='SET NULL'), nullable=True),
            sa.Column('assigned_doctor_id', sa.Integer(), sa.ForeignKey('doctors.id', ondelete='SET NULL'), nullable=True),
            sa.Column('dedupe_key', sa.String(length=100), nullable=True),
            sa.Column('escalated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column('acknowledged_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('acknowledged_by_user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
            sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_clinical_alerts_conversation_id', 'clinical_alerts', ['conversation_id'])
        op.create_index('ix_clinical_alerts_status', 'clinical_alerts', ['status'])
        op.create_index('ix_clinical_alerts_dedupe_key', 'clinical_alerts', ['dedupe_key'])

    # 5. clinical_events
    if 'clinical_events' not in existing_tables:
        op.create_table(
            'clinical_events',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('conversation_id', sa.Integer(), sa.ForeignKey('clinical_conversations.id', ondelete='CASCADE'), nullable=False),
            sa.Column('actor_user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
            sa.Column('event_type', sa.String(length=64), nullable=False),
            sa.Column('state_before', sa.JSON(), nullable=True),
            sa.Column('state_after', sa.JSON(), nullable=True),
            sa.Column('reason', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_clinical_events_conversation_id', 'clinical_events', ['conversation_id'])
        op.create_index('ix_clinical_events_event_type', 'clinical_events', ['event_type'])

    # 6. clinical_ai_analyses
    if 'clinical_ai_analyses' not in existing_tables:
        op.create_table(
            'clinical_ai_analyses',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('conversation_id', sa.Integer(), sa.ForeignKey('clinical_conversations.id', ondelete='CASCADE'), nullable=False),
            sa.Column('message_id', sa.Integer(), sa.ForeignKey('clinical_messages.id', ondelete='SET NULL'), nullable=True),
            sa.Column('category', sa.String(length=100), nullable=True),
            sa.Column('confidence', sa.Float(), nullable=True),
            sa.Column('evidence_codes', sa.JSON(), nullable=True),
            sa.Column('model_rule_version', sa.String(length=64), server_default='1.0', nullable=False),
            sa.Column('human_review_required', sa.Boolean(), server_default=sa.text('false'), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_clinical_ai_analyses_conversation_id', 'clinical_ai_analyses', ['conversation_id'])

    # 7. doctor_department_memberships
    if 'doctor_department_memberships' not in existing_tables:
        op.create_table(
            'doctor_department_memberships',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('doctor_id', sa.Integer(), sa.ForeignKey('doctors.id', ondelete='CASCADE'), nullable=False),
            sa.Column('department_id', sa.Integer(), sa.ForeignKey('departments.id', ondelete='CASCADE'), nullable=False),
            sa.Column(
                'role',
                sa.Enum('MEMBER', 'RESPONDER', 'LEAD', name='doctor_dept_role_enum'),
                server_default='MEMBER',
                nullable=False
            ),
            sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_doctor_department_memberships_doctor_id', 'doctor_department_memberships', ['doctor_id'])
        op.create_index('ix_doctor_department_memberships_department_id', 'doctor_department_memberships', ['department_id'])

    # 8. clinical_routing_rules
    if 'clinical_routing_rules' not in existing_tables:
        op.create_table(
            'clinical_routing_rules',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('category_or_indicator', sa.String(length=100), nullable=False),
            sa.Column('department_id', sa.Integer(), sa.ForeignKey('departments.id', ondelete='CASCADE'), nullable=False),
            sa.Column(
                'priority',
                sa.Enum('NORMAL', 'LOW_PRIORITY', 'MODERATE', 'HIGH_PRIORITY', 'EMERGENCY_REVIEW', name='clinical_urgency_enum'),
                server_default='NORMAL',
                nullable=False
            ),
            sa.Column('is_enabled', sa.Boolean(), server_default=sa.text('true'), nullable=False),
            sa.Column('version', sa.String(length=32), server_default='1.0', nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_clinical_routing_rules_category_or_indicator', 'clinical_routing_rules', ['category_or_indicator'])
        op.create_index('ix_clinical_routing_rules_department_id', 'clinical_routing_rules', ['department_id'])


def downgrade() -> None:
    op.drop_table('clinical_routing_rules', if_exists=True)
    op.drop_table('doctor_department_memberships', if_exists=True)
    op.drop_table('clinical_ai_analyses', if_exists=True)
    op.drop_table('clinical_events', if_exists=True)
    op.drop_table('clinical_alerts', if_exists=True)
    op.drop_table('clinical_assignments', if_exists=True)
    op.drop_table('clinical_messages', if_exists=True)
    op.drop_table('clinical_conversations', if_exists=True)
