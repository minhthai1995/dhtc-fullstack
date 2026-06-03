from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.crud import notification as notif_crud
from app.deps import current_user
from app.models.notification import Notification
from app.models.user import User

router = APIRouter(prefix="/notifications", tags=["notifications"])


class NotificationRead(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    type: str
    title: str
    message: str
    link: str | None
    is_read: bool
    reference_id: int | None
    created_at: str

    @classmethod
    def from_orm(cls, n: Notification) -> NotificationRead:
        return cls(
            id=n.id,
            type=n.type.value,
            title=n.title,
            message=n.message,
            link=n.link,
            is_read=n.is_read,
            reference_id=n.reference_id,
            created_at=n.created_at.isoformat(),
        )


@router.get("", response_model=list[NotificationRead])
async def list_notifications(
    unread_only: bool = False,
    limit: int = Query(default=50, ge=1, le=500),
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> list[NotificationRead]:
    items = await notif_crud.get_for_user(db, user.id, unread_only=unread_only, limit=limit)
    return [NotificationRead.from_orm(n) for n in items]


@router.get("/unread-count")
async def unread_count(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    count = await notif_crud.count_unread(db, user.id)
    return {"unread": count}


@router.patch("/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_read(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await notif_crud.mark_all_read(db, user.id)


@router.patch("/{notification_id}/read", response_model=NotificationRead)
async def mark_read(
    notification_id: int,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> NotificationRead:
    notif = await notif_crud.mark_read(db, notification_id, user.id)
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return NotificationRead.from_orm(notif)
