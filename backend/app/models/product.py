from __future__ import annotations

import enum
from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy import Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.cart import CartItem
    from app.models.category import Category
    from app.models.merchant import Merchant
    from app.models.order import OrderItem
    from app.models.review import Review


class ProductStatus(enum.StrEnum):
    active = "active"
    pending = "pending"
    inactive = "inactive"


class Product(Base, TimestampMixin):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    merchant_id: Mapped[int] = mapped_column(ForeignKey("merchants.id"), index=True)
    category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"), index=True)
    name_vi: Mapped[str] = mapped_column(String(255))
    name_en: Mapped[str | None] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(255), index=True)
    price: Mapped[float] = mapped_column(Numeric(10, 2))
    stock: Mapped[int] = mapped_column(Integer, default=0)
    sold_count: Mapped[int] = mapped_column(Integer, default=0)
    rating: Mapped[float | None] = mapped_column(Numeric(3, 2), nullable=True)
    status: Mapped[ProductStatus] = mapped_column(
        Enum(ProductStatus), default=ProductStatus.pending
    )
    description_vi: Mapped[str | None] = mapped_column(Text)
    description_en: Mapped[str | None] = mapped_column(Text)
    origin: Mapped[str | None] = mapped_column(String(200))
    certifications: Mapped[list | None] = mapped_column(sa.JSON)
    images: Mapped[list | None] = mapped_column(sa.JSON)

    # relationships — string refs resolved at mapper configure time
    merchant: Mapped[Merchant] = relationship("Merchant", back_populates="products")
    category: Mapped[Category | None] = relationship("Category", back_populates="products")
    order_items: Mapped[list[OrderItem]] = relationship("OrderItem", back_populates="product")
    cart_items: Mapped[list[CartItem]] = relationship("CartItem", back_populates="product")
    reviews: Mapped[list[Review]] = relationship("Review", back_populates="product")
