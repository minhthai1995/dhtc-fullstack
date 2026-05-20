from __future__ import annotations

import enum

from sqlalchemy import Enum, ForeignKey, String, Text
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

    # P5C reserve — capture-everything fields. All nullable so existing rows
    # remain valid; P5C webhook will populate these on inbound messages.
    intent_cluster: Mapped[str | None] = mapped_column(String(64), nullable=True)
    captured_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    captured_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    captured_address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    linked_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    referenced_product_id: Mapped[int | None] = mapped_column(
        ForeignKey("products.id", ondelete="SET NULL"), nullable=True, index=True
    )
    referenced_order_id: Mapped[int | None] = mapped_column(
        ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True
    )
