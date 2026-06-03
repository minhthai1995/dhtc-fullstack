"""extend merchants with HTX business fields

Revision ID: f6dafa9f0006
Revises: e5c9f49f0005
Create Date: 2026-05-31 14:00:00.000000+00:00

Adds the legal/contact columns the seller profile form has always claimed to
support but never persisted (tax_id, address, phone, email, representative,
cccd, member_count, entity_type, certifications, plus bilingual business names
and social handles). Every column is nullable so existing rows stay valid.
"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = 'f6dafa9f0006'
down_revision: str | None = 'e5c9f49f0005'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


_COLUMNS = [
    sa.Column('business_name', sa.String(length=200), nullable=True),
    sa.Column('business_name_en', sa.String(length=200), nullable=True),
    sa.Column('tax_id', sa.String(length=50), nullable=True),
    sa.Column('address', sa.Text(), nullable=True),
    sa.Column('phone', sa.String(length=50), nullable=True),
    sa.Column('email', sa.String(length=255), nullable=True),
    sa.Column('facebook', sa.String(length=255), nullable=True),
    sa.Column('instagram', sa.String(length=255), nullable=True),
    sa.Column('representative', sa.String(length=200), nullable=True),
    sa.Column('cccd', sa.String(length=50), nullable=True),
    sa.Column('member_count', sa.Integer(), nullable=True),
    sa.Column('entity_type', sa.String(length=50), nullable=True),
    sa.Column('certifications', sa.JSON(), nullable=True),
]


def upgrade() -> None:
    for col in _COLUMNS:
        op.add_column('merchants', col)


def downgrade() -> None:
    for col in reversed(_COLUMNS):
        op.drop_column('merchants', col.name)
