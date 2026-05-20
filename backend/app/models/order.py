from __future__ import annotations

import enum
from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy import Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.merchant import Merchant
    from app.models.order_event import OrderEvent
    from app.models.product import Product
    from app.models.user import User


class OrderStatus(enum.StrEnum):
    pending = "pending"
    processing = "processing"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"


class Order(Base, TimestampMixin):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    merchant_id: Mapped[int] = mapped_column(ForeignKey("merchants.id"), index=True)
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus), default=OrderStatus.pending)
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2))
    shipping_address: Mapped[dict] = mapped_column(sa.JSON)
    tracking_number: Mapped[str | None] = mapped_column(String(100))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # relationships — string refs resolved at mapper configure time
    customer: Mapped[User] = relationship(
        "User", backref="customer_orders", foreign_keys=[customer_id]
    )
    merchant: Mapped[Merchant] = relationship("Merchant", back_populates="orders")
    items: Mapped[list[OrderItem]] = relationship("OrderItem", back_populates="order")
    events: Mapped[list[OrderEvent]] = relationship(
        "OrderEvent", back_populates="order", order_by="OrderEvent.created_at"
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    quantity: Mapped[int]
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2))

    # relationships
    order: Mapped[Order] = relationship("Order", back_populates="items")
    product: Mapped[Product] = relationship("Product", back_populates="order_items")
