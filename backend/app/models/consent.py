from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.base import Base


class ConsentEventType(enum.StrEnum):
    cookie_accept = "cookie_accept"
    cookie_reject = "cookie_reject"
    privacy_accept = "privacy_accept"
    marketing_opt_in = "marketing_opt_in"
    marketing_opt_out = "marketing_opt_out"


class DSRType(enum.StrEnum):
    deletion = "deletion"
    export = "export"
    access = "access"


class DSRStatus(enum.StrEnum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    rejected = "rejected"


class ConsentLog(Base):
    __tablename__ = "consent_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    session_id: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    event_type: Mapped[ConsentEventType] = mapped_column(
        Enum(ConsentEventType, name="consenteventtype"), index=True
    )
    ip_addr: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class DSRRequest(Base):
    __tablename__ = "dsr_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), index=True)
    request_type: Mapped[DSRType] = mapped_column(
        Enum(DSRType, name="dsrtype")
    )
    fb_user_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[DSRStatus] = mapped_column(
        Enum(DSRStatus, name="dsrstatus"), default=DSRStatus.pending, index=True
    )
    admin_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
