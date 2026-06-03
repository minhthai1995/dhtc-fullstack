"""add bank_name + bank_account to wallet_transactions

Revision ID: e5c9f49f0005
Revises: d4b8f39f0004
Create Date: 2026-05-31 13:00:00.000000+00:00

Persists the destination bank captured at withdrawal time so the seller
wallet can surface the most recent receiving account without parsing
free-text descriptions. Both columns are nullable: only ``withdrawal``
rows populate them; existing rows stay valid.
"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = 'e5c9f49f0005'
down_revision: str | None = 'd4b8f39f0004'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        'wallet_transactions',
        sa.Column('bank_name', sa.String(length=100), nullable=True),
    )
    op.add_column(
        'wallet_transactions',
        sa.Column('bank_account', sa.String(length=64), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('wallet_transactions', 'bank_account')
    op.drop_column('wallet_transactions', 'bank_name')
