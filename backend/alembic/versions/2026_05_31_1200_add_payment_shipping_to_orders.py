"""add payment + shipping columns to orders

Revision ID: d4b8f39f0004
Revises: c3a7e28f0003
Create Date: 2026-05-31 12:00:00.000000+00:00

Backfills Checkout selections (payment method, shipping method, shipping fee)
that were previously dropped at the API boundary. All columns are nullable or
defaulted so existing rows remain valid; ``payment_status`` defaults to
``pending`` so unpaid legacy orders surface correctly in admin views.
"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = 'd4b8f39f0004'
down_revision: str | None = 'c3a7e28f0003'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column('orders', sa.Column('payment_method', sa.String(length=32), nullable=True))
    op.add_column(
        'orders',
        sa.Column('payment_status', sa.String(length=16), nullable=False, server_default='pending'),
    )
    op.add_column('orders', sa.Column('payment_id', sa.String(length=128), nullable=True))
    op.add_column('orders', sa.Column('shipping_method', sa.String(length=32), nullable=True))
    op.add_column(
        'orders',
        sa.Column('shipping_fee', sa.Numeric(10, 2), nullable=False, server_default='0'),
    )


def downgrade() -> None:
    op.drop_column('orders', 'shipping_fee')
    op.drop_column('orders', 'shipping_method')
    op.drop_column('orders', 'payment_id')
    op.drop_column('orders', 'payment_status')
    op.drop_column('orders', 'payment_method')
