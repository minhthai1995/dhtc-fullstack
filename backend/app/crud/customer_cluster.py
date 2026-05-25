"""CRUD helpers for customer clusters — P4A T10.

Scope: minimal surface needed by P5D's clustering job and admin CRM UI.
Only 4 helpers ship now; richer queries (filter by criteria, paginate
members) land with P5D when the classifier exists.

``assign_user`` is idempotent on the ``(user_id, cluster_id)`` UNIQUE pair.
On Postgres we use ``INSERT … ON CONFLICT DO UPDATE`` (atomic); on SQLite
the test env falls back to SELECT + UPDATE/INSERT — same outcome, two
statements. P5D job invokes this on every classification pass, so dup
calls must be safe and refresh score/signals/assigned_at.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer_cluster import CustomerCluster, CustomerClusterMember


async def get_by_slug(db: AsyncSession, slug: str) -> CustomerCluster | None:
    result = await db.execute(
        select(CustomerCluster).where(CustomerCluster.slug == slug)
    )
    return result.scalars().first()


async def list_active(db: AsyncSession) -> list[CustomerCluster]:
    """Return active clusters ordered by id for deterministic UI lists."""
    result = await db.execute(
        select(CustomerCluster)
        .where(CustomerCluster.is_active.is_(True))
        .order_by(CustomerCluster.id)
    )
    return list(result.scalars().all())


def _is_postgres(db: AsyncSession) -> bool:
    bind = db.bind
    return bind is not None and bind.dialect.name == "postgresql"


async def assign_user(
    db: AsyncSession,
    *,
    user_id: int,
    cluster_id: int,
    score: float | None = None,
    signals: dict[str, Any] | None = None,
) -> CustomerClusterMember:
    """Idempotent membership upsert keyed on (user_id, cluster_id).

    Re-assign refreshes ``score``, ``signals_json``, and ``assigned_at`` so
    P5D classifier output reflects the latest signal snapshot.
    """
    now = datetime.now(UTC).replace(tzinfo=None)
    payload: dict[str, Any] = {
        "user_id": user_id,
        "cluster_id": cluster_id,
        "score": score,
        "signals_json": signals,
        "assigned_at": now,
    }

    if _is_postgres(db):
        stmt = pg_insert(CustomerClusterMember).values(**payload)
        stmt = stmt.on_conflict_do_update(
            constraint="customer_cluster_members_user_cluster_key",
            set_={
                "score": stmt.excluded.score,
                "signals_json": stmt.excluded.signals_json,
                "assigned_at": stmt.excluded.assigned_at,
            },
        )
        await db.execute(stmt)
    else:
        existing = (
            await db.execute(
                select(CustomerClusterMember).where(
                    CustomerClusterMember.user_id == user_id,
                    CustomerClusterMember.cluster_id == cluster_id,
                )
            )
        ).scalars().first()
        if existing is None:
            db.add(CustomerClusterMember(**payload))
        else:
            existing.score = score
            existing.signals_json = signals
            existing.assigned_at = now

    await db.commit()
    member = (
        await db.execute(
            select(CustomerClusterMember).where(
                CustomerClusterMember.user_id == user_id,
                CustomerClusterMember.cluster_id == cluster_id,
            )
        )
    ).scalars().one()
    return member


async def list_for_user(
    db: AsyncSession, user_id: int
) -> list[CustomerCluster]:
    """Return clusters this user belongs to, ordered by cluster id."""
    result = await db.execute(
        select(CustomerCluster)
        .join(
            CustomerClusterMember,
            CustomerClusterMember.cluster_id == CustomerCluster.id,
        )
        .where(CustomerClusterMember.user_id == user_id)
        .order_by(CustomerCluster.id)
    )
    return list(result.scalars().all())
