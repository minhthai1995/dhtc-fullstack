from __future__ import annotations

import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class NotificationType(enum.StrEnum):
    order_new = "order_new"
    order_confirmed = "order_confirmed"
    order_shipped = "order_shipped"
    order_delivered = "order_delivered"
    order_cancelled = "order_cancelled"
    product_approved = "product_approved"
    product_rejected = "product_rejected"
    withdrawal_approved = "withdrawal_approved"
    withdrawal_rejected = "withdrawal_rejected"
    review_received = "review_received"


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    type: Mapped[NotificationType] = mapped_column(Enum(NotificationType, name="notificationtype"))
    title: Mapped[str] = mapped_column(String(255))
    message: Mapped[str] = mapped_column(Text)
    link: Mapped[str | None] = mapped_column(String(500), nullable=True)
    reference_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default="now()"
    )

    user: Mapped[User] = relationship("User", backref="notifications")
