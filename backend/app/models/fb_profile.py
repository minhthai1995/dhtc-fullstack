from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class FBProfile(Base, TimestampMixin):
    __tablename__ = "fb_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), unique=True, index=True
    )

    # OAuth identity (P5A)
    fb_app_user_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    fb_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    fb_first_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    fb_last_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    fb_profile_pic_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    fb_locale: Mapped[str | None] = mapped_column(String(20), nullable=True)
    raw_oauth_payload: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    linked_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)

    # Messenger identity (reserved for P5C — populated by referral/postback events)
    messenger_psid: Mapped[str | None] = mapped_column(
        String(64), unique=True, index=True, nullable=True
    )

    user: Mapped[User] = relationship("User")
