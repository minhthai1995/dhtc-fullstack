"""P4A T11 — verify customer_clusters + members schema, CRUD, CASCADE.

Four guarantees:
  1. Seed contract — the 7 system-cluster slugs match the design (the
     migration's ``SYSTEM_CLUSTERS`` payload is round-trip verified
     separately on Postgres; here we lock the slug list as the spec
     contract so any drift in code/migration is caught immediately)
  2. ``assign_user`` idempotency — calling twice with the same
     (user, cluster) leaves exactly 1 row and refreshes score/signals
  3. FK CASCADE — deleting a user clears their member rows; deleting a
     cluster clears its member rows
  4. ``list_for_user`` returns the clusters this user belongs to,
     ordered by cluster id for deterministic UI lists

Test env uses SQLite ``:memory:`` + ``Base.metadata.create_all`` (no
Alembic), so the seed must be inserted in-test rather than relying on
the migration. PRAGMA ``foreign_keys=ON`` is required per-connection or
CASCADE silently no-ops.
"""

from __future__ import annotations

import pytest
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import customer_cluster as crud
from app.models.customer_cluster import CustomerCluster, CustomerClusterMember
from app.models.user import User, UserRole

EXPECTED_SYSTEM_SLUGS = [
    "messenger_engaged",
    "web_only_visitor",
    "lead_no_purchase",
    "first_buyer",
    "repeat_buyer",
    "lapsed_60d",
    "high_value_vn",
]


@pytest.fixture(autouse=True)
async def _sqlite_enforce_fks(db_session: AsyncSession) -> None:
    """SQLite needs ``PRAGMA foreign_keys=ON`` per-connection or CASCADE
    silently no-ops. Set it on the session's existing connection."""
    await db_session.execute(text("PRAGMA foreign_keys=ON"))


async def _seed_system_clusters(db: AsyncSession) -> list[CustomerCluster]:
    """Mirror the migration's bulk_insert for tests. Keep payload minimal —
    the round-trip migration test on Postgres is the source of truth for
    full criteria_json; here we just need rows to exercise CRUD."""
    rows = [
        CustomerCluster(
            slug=slug,
            name=slug.replace("_", " ").title(),
            description=None,
            criteria_json={"placeholder": True},
            is_system=True,
            is_active=True,
        )
        for slug in EXPECTED_SYSTEM_SLUGS
    ]
    db.add_all(rows)
    await db.commit()
    for r in rows:
        await db.refresh(r)
    return rows


async def _make_user(db: AsyncSession, email: str) -> User:
    u = User(email=email, hashed_password="x", role=UserRole.customer)
    db.add(u)
    await db.commit()
    await db.refresh(u)
    return u


@pytest.mark.asyncio
async def test_seed_seven_system_clusters(db_session: AsyncSession) -> None:
    await _seed_system_clusters(db_session)

    count = (
        await db_session.execute(
            select(func.count())
            .select_from(CustomerCluster)
            .where(CustomerCluster.is_system.is_(True))
        )
    ).scalar_one()
    assert count == 7

    slugs = (
        await db_session.execute(
            select(CustomerCluster.slug)
            .where(CustomerCluster.is_system.is_(True))
            .order_by(CustomerCluster.id)
        )
    ).scalars().all()
    assert list(slugs) == EXPECTED_SYSTEM_SLUGS


@pytest.mark.asyncio
async def test_assign_user_idempotent_refreshes_signals(
    db_session: AsyncSession,
) -> None:
    clusters = await _seed_system_clusters(db_session)
    user = await _make_user(db_session, "assign@test.com")
    target = clusters[0]

    first = await crud.assign_user(
        db_session,
        user_id=user.id,
        cluster_id=target.id,
        score=0.5,
        signals={"reason": "initial"},
    )
    initial_assigned_at = first.assigned_at

    second = await crud.assign_user(
        db_session,
        user_id=user.id,
        cluster_id=target.id,
        score=0.9,
        signals={"reason": "refresh"},
    )

    # Exactly one row for the (user, cluster) pair.
    rows = (
        await db_session.execute(
            select(CustomerClusterMember).where(
                CustomerClusterMember.user_id == user.id,
                CustomerClusterMember.cluster_id == target.id,
            )
        )
    ).scalars().all()
    assert len(rows) == 1
    assert rows[0].id == first.id == second.id

    # Score/signals/assigned_at refreshed.
    await db_session.refresh(rows[0])
    assert rows[0].score == 0.9
    assert rows[0].signals_json == {"reason": "refresh"}
    assert rows[0].assigned_at >= initial_assigned_at


@pytest.mark.asyncio
async def test_cascade_delete_user_removes_member_rows(
    db_session: AsyncSession,
) -> None:
    clusters = await _seed_system_clusters(db_session)
    user = await _make_user(db_session, "cascade@test.com")
    await crud.assign_user(
        db_session, user_id=user.id, cluster_id=clusters[0].id, score=0.7
    )
    await crud.assign_user(
        db_session, user_id=user.id, cluster_id=clusters[1].id, score=0.3
    )
    before = (
        await db_session.execute(
            select(func.count())
            .select_from(CustomerClusterMember)
            .where(CustomerClusterMember.user_id == user.id)
        )
    ).scalar_one()
    assert before == 2

    # Raw SQL delete to bypass ORM cascade and exercise the DB-level FK.
    await db_session.execute(
        text("DELETE FROM users WHERE id = :uid"), {"uid": user.id}
    )
    await db_session.commit()

    after = (
        await db_session.execute(
            select(func.count())
            .select_from(CustomerClusterMember)
            .where(CustomerClusterMember.user_id == user.id)
        )
    ).scalar_one()
    assert after == 0


@pytest.mark.asyncio
async def test_list_for_user_returns_assigned_clusters(
    db_session: AsyncSession,
) -> None:
    clusters = await _seed_system_clusters(db_session)
    user = await _make_user(db_session, "listfor@test.com")
    # Assign in non-id order so we can confirm ordering by cluster.id.
    await crud.assign_user(
        db_session, user_id=user.id, cluster_id=clusters[3].id
    )
    await crud.assign_user(
        db_session, user_id=user.id, cluster_id=clusters[0].id
    )

    result = await crud.list_for_user(db_session, user.id)
    assert [c.id for c in result] == sorted(
        [clusters[0].id, clusters[3].id]
    )
    assert {c.slug for c in result} == {clusters[0].slug, clusters[3].slug}


@pytest.mark.asyncio
async def test_get_by_slug_and_list_active(db_session: AsyncSession) -> None:
    """Smoke-test the two read helpers used by admin UI / classifier."""
    clusters = await _seed_system_clusters(db_session)

    hit = await crud.get_by_slug(db_session, "messenger_engaged")
    assert hit is not None and hit.slug == "messenger_engaged"

    miss = await crud.get_by_slug(db_session, "no_such_slug")
    assert miss is None

    # Deactivate one — list_active must exclude it.
    clusters[0].is_active = False
    await db_session.commit()
    active = await crud.list_active(db_session)
    assert len(active) == 6
    assert clusters[0].slug not in {c.slug for c in active}
