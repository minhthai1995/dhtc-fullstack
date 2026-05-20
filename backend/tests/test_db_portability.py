"""SQLite portability guard for server_default values.

Catches the class of bug fixed in P4A T1: ``server_default="now()"`` (a literal
string) gets stored as the 5-char text ``'now()'`` on SQLite because it isn't a
``ClauseElement``. The ORM then fails to parse it back as a datetime. On
Postgres the literal is silently cast at INSERT time which masked the bug.
"""

from __future__ import annotations

from datetime import datetime

import pytest
from sqlalchemy import DateTime, insert, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.elements import ClauseElement

from app.models import Base
from app.models.notification import Notification, NotificationType
from app.models.user import User


def test_all_datetime_server_defaults_are_clause_elements() -> None:
    """Static audit: every DateTime column with server_default must use a
    SQL expression (e.g. ``func.now()``), not a string literal. String
    defaults like ``"now()"`` break on SQLite."""
    offenders: list[str] = []
    for table in Base.metadata.sorted_tables:
        for col in table.columns:
            if col.server_default is None:
                continue
            if not isinstance(col.type, DateTime):
                continue
            arg = col.server_default.arg
            if not isinstance(arg, ClauseElement):
                offenders.append(
                    f"{table.name}.{col.name} server_default={arg!r} "
                    "is not a ClauseElement — use func.now() instead"
                )
    assert not offenders, "Non-portable datetime defaults:\n" + "\n".join(offenders)


@pytest.mark.asyncio
async def test_notification_created_at_round_trip_on_sqlite(
    db_session: AsyncSession,
) -> None:
    """Regression for the P4A T1 bug: insert with server-side default,
    select back, assert a real datetime (not the string ``'now()'``)."""
    user = User(
        email="portability@dhtc.local",
        full_name="Portability Test",
        hashed_password="x",
        role="customer",
    )
    db_session.add(user)
    await db_session.flush()

    await db_session.execute(
        insert(Notification).values(
            user_id=user.id,
            type=NotificationType.order_new,
            title="t",
            message="m",
        )
    )
    await db_session.commit()

    row = (await db_session.execute(select(Notification))).scalar_one()
    assert isinstance(row.created_at, datetime), (
        f"created_at must be datetime, got {type(row.created_at).__name__}: {row.created_at!r}"
    )
