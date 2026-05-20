from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin
from app.models.order import OrderStatus

if TYPE_CHECKING:
    from app.models.order import Order


class OrderEvent(Base, TimestampMixin):
    __tablename__ = "order_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus))
    note: Mapped[str | None] = mapped_column(Text)

    order: Mapped[Order] = relationship("Order", back_populates="events")
