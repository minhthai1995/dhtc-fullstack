from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import Boolean, Enum, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.base import Base, TimestampMixin


class ProactiveIntent(enum.StrEnum):
    checkin = "checkin"
    praise = "praise"
    complaint = "complaint"
    question = "question"
    other = "other"


class ProactiveStatus(enum.StrEnum):
    queued = "queued"
    sent = "sent"
    dry_run = "dry_run"
    error = "error"
    skipped_cooldown = "skipped_cooldown"
    skipped_disabled = "skipped_disabled"
    skipped_rate_limit = "skipped_rate_limit"


class DMStatus(enum.StrEnum):
    sent = "sent"
    window_expired = "window_expired"
    error = "error"


class ProactiveReply(Base, TimestampMixin):
    __tablename__ = "proactive_replies"

    id: Mapped[int] = mapped_column(primary_key=True)
    page_id: Mapped[str] = mapped_column(String(64), index=True)
    post_id: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    post_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    post_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    post_author_psid: Mapped[str | None] = mapped_column(
        String(64), index=True, nullable=True
    )
    has_checkin: Mapped[bool] = mapped_column(
        Boolean, server_default="false", nullable=False
    )
    place_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    intent: Mapped[ProactiveIntent] = mapped_column(Enum(ProactiveIntent), index=True)
    template_used: Mapped[str | None] = mapped_column(String(64), nullable=True)
    reply_text: Mapped[str] = mapped_column(Text)
    reply_comment_id: Mapped[str | None] = mapped_column(String(128), nullable=True)

    status: Mapped[ProactiveStatus] = mapped_column(Enum(ProactiveStatus), index=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    __table_args__ = (
        Index(
            "proactive_replies_psid_created_at_idx",
            "post_author_psid",
            "created_at",
        ),
    )


class CommentThread(Base, TimestampMixin):
    __tablename__ = "comment_threads"

    id: Mapped[int] = mapped_column(primary_key=True)
    comment_id: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    post_id: Mapped[str] = mapped_column(String(128), index=True)
    proactive_reply_id: Mapped[int] = mapped_column(
        ForeignKey("proactive_replies.id", ondelete="CASCADE"), index=True
    )
    poster_psid: Mapped[str | None] = mapped_column(
        String(64), index=True, nullable=True
    )
    poster_replied_at: Mapped[datetime | None] = mapped_column(nullable=True)
    dm_sent_at: Mapped[datetime | None] = mapped_column(nullable=True)
    dm_status: Mapped[DMStatus | None] = mapped_column(
        Enum(DMStatus), nullable=True
    )


class ProactiveTemplateConfig(Base):
    __tablename__ = "proactive_template_config"

    intent: Mapped[ProactiveIntent] = mapped_column(
        Enum(ProactiveIntent), primary_key=True
    )
    is_enabled: Mapped[bool] = mapped_column(
        Boolean, server_default="true", nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    updated_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
