"""Customer clustering tables — P5D reserve.

Schema lives in P4A; the actual classification job (compile ``criteria_json``
to SQL filter, assign users to clusters) lands in P5D. The migration that
creates these tables also seeds 7 system clusters so the FE can reference
known slugs immediately.

``criteria_json`` is a declarative spec (``{"has_chat": true}``,
``{"completed_orders_gte": 2}``, …) so admins can later define clusters
through a UI without code changes.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Float,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.base import Base, TimestampMixin


class CustomerCluster(Base, TimestampMixin):
    __tablename__ = "customer_clusters"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    criteria_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    is_system: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false", nullable=False
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default="true", nullable=False
    )


class CustomerClusterMember(Base):
    __tablename__ = "customer_cluster_members"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "cluster_id",
            name="customer_cluster_members_user_cluster_key",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    cluster_id: Mapped[int] = mapped_column(
        ForeignKey("customer_clusters.id", ondelete="CASCADE"), index=True
    )
    score: Mapped[float | None] = mapped_column(Float, nullable=True)
    signals_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    assigned_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), nullable=False
    )
