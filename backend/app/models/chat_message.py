from __future__ import annotations

import enum

from sqlalchemy import Enum, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class MessageDirection(enum.StrEnum):
    inbound = "inbound"
    outbound = "outbound"


class MessagePlatform(enum.StrEnum):
    messenger = "messenger"
    web = "web"


class ChatMessage(Base, TimestampMixin):
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[str] = mapped_column(String(128), index=True)
    fb_user_id: Mapped[str] = mapped_column(String(64), index=True)
    direction: Mapped[MessageDirection] = mapped_column(Enum(MessageDirection))
    platform: Mapped[MessagePlatform] = mapped_column(
        Enum(MessagePlatform), default=MessagePlatform.messenger
    )
    content: Mapped[str] = mapped_column(Text)
