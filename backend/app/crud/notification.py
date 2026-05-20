from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification, NotificationType


async def create(
    db: AsyncSession,
    user_id: int,
    notif_type: NotificationType,
    title: str,
    message: str,
    link: str | None = None,
    reference_id: int | None = None,
) -> Notification:
    notif = Notification(
        user_id=user_id,
        type=notif_type,
        title=title,
        message=message,
        link=link,
        reference_id=reference_id,
    )
    db.add(notif)
    await db.flush()
    return notif


async def get_for_user(
    db: AsyncSession,
    user_id: int,
    unread_only: bool = False,
    limit: int = 50,
) -> list[Notification]:
    q = select(Notification).where(Notification.user_id == user_id)
    if unread_only:
        q = q.where(Notification.is_read.is_(False))
    q = q.order_by(Notification.created_at.desc()).limit(limit)
    result = await db.execute(q)
    return list(result.scalars().all())


async def count_unread(db: AsyncSession, user_id: int) -> int:
    result = await db.execute(
        select(func.count()).where(
            Notification.user_id == user_id,
            Notification.is_read.is_(False),
        )
    )
    return result.scalar_one() or 0


async def mark_read(db: AsyncSession, notification_id: int, user_id: int) -> Notification | None:
    notif = await db.get(Notification, notification_id)
    if not notif or notif.user_id != user_id:
        return None
    notif.is_read = True
    notif.read_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(notif)
    return notif


async def mark_all_read(db: AsyncSession, user_id: int) -> None:
    now = datetime.now(UTC)
    await db.execute(
        update(Notification)
        .where(Notification.user_id == user_id, Notification.is_read.is_(False))
        .values(is_read=True, read_at=now)
    )
    await db.commit()
