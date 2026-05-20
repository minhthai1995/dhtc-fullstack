from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.product import Product
    from app.models.user import User


class CartItem(Base, TimestampMixin):
    __tablename__ = "cart_items"
    __table_args__ = (UniqueConstraint("customer_id", "product_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1)

    # relationships — string refs resolved at mapper configure time
    customer: Mapped[User] = relationship("User", backref="cart_items")
    product: Mapped[Product] = relationship("Product", back_populates="cart_items")
