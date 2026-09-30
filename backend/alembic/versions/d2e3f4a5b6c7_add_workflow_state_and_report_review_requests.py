"""add workflow state and report review requests

Revision ID: d2e3f4a5b6c7
Revises: c1a2b3c4d5e6
Create Date: 2026-09-28 17:50:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

# revision identifiers, used by Alembic.
revision: str = 'd2e3f4a5b6c7'
down_revision: Union[str, Sequence[str], None] = 'c1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    existing_tables = set(inspector.get_table_names())

    # 1. Add workflow_state to clinical_conversations if not exists
    if 'clinical_conversations' in existing_tables:
        cols = [c['name'] for c in inspector.get_columns('clinical_conversations')]
        if 'workflow_state' not in cols:
            op.add_column('clinical_conversations', sa.Column('workflow_state', sa.JSON(), nullable=True))

    # 2. Add report_review_requests table if not exists
    if 'report_review_requests' not in existing_tables:
        op.create_table(
            'report_review_requests',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('report_id', sa.Integer(), sa.ForeignKey('medical_reports.id', ondelete='CASCADE'), nullable=False),
            sa.Column('patient_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            sa.Column('doctor_id', sa.Integer(), sa.ForeignKey('doctors.id', ondelete='CASCADE'), nullable=False),
            sa.Column(
                'status',
                sa.Enum('PENDING', 'IN_REVIEW', 'COMPLETED', 'CANCELLED', name='report_review_request_status_enum'),
                server_default='PENDING',
                nullable=False
            ),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_report_review_requests_report_id', 'report_review_requests', ['report_id'])
        op.create_index('ix_report_review_requests_patient_id', 'report_review_requests', ['patient_id'])
        op.create_index('ix_report_review_requests_doctor_id', 'report_review_requests', ['doctor_id'])
        op.create_index('ix_report_review_requests_status', 'report_review_requests', ['status'])
        op.create_index('ix_report_review_requests_created_at', 'report_review_requests', ['created_at'])


def downgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    existing_tables = set(inspector.get_table_names())

    if 'report_review_requests' in existing_tables:
        op.drop_table('report_review_requests')
        op.execute("DROP TYPE IF EXISTS report_review_request_status_enum;")

    if 'clinical_conversations' in existing_tables:
        cols = [c['name'] for c in inspector.get_columns('clinical_conversations')]
        if 'workflow_state' in cols:
            op.drop_column('clinical_conversations', 'workflow_state')
