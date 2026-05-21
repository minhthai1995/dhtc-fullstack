from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class FBProfile(Base, TimestampMixin):
    __tablename__ = "fb_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    # P5C-enrich: user_id nullable so anonymous PSID-only rows exist
    # (Messenger user who never OAuth-logged-in).
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), unique=True, index=True, nullable=True
    )

    # OAuth identity (P5A) — nullable so PSID-only rows skip OAuth fields
    fb_app_user_id: Mapped[str | None] = mapped_column(
        String(64), unique=True, index=True, nullable=True
    )
    fb_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    fb_first_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    fb_last_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    fb_profile_pic_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    fb_locale: Mapped[str | None] = mapped_column(String(20), nullable=True)
    raw_oauth_payload: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    linked_at: Mapped[datetime | None] = mapped_column(
        server_default=func.now(), nullable=True
    )

    # Messenger identity (P5C — populated by webhook events)
    messenger_psid: Mapped[str | None] = mapped_column(
        String(64), unique=True, index=True, nullable=True
    )

    # P5C-enrich: Graph API cache fields. Populated by FBGraphService.
    page_id: Mapped[str | None] = mapped_column(String(64), index=True, nullable=True)
    messenger_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    messenger_pic_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    messenger_age_range_min: Mapped[int | None] = mapped_column(nullable=True)
    messenger_age_range_max: Mapped[int | None] = mapped_column(nullable=True)
    messenger_gender: Mapped[str | None] = mapped_column(String(16), nullable=True)
    messenger_locale: Mapped[str | None] = mapped_column(String(16), nullable=True)
    messenger_fetched_at: Mapped[datetime | None] = mapped_column(
        index=True, nullable=True
    )
    messenger_status: Mapped[str] = mapped_column(
        String(32), server_default="active", nullable=False
    )
    messenger_error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    user: Mapped[User | None] = relationship("User")
