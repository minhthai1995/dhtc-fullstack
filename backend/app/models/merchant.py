from __future__ import annotations

import enum
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.order import Order
    from app.models.product import Product
    from app.models.promotion import Promotion
    from app.models.shipping import ShippingZone
    from app.models.user import User
    from app.models.wallet import WalletTransaction


class MerchantTier(enum.StrEnum):
    bronze = "bronze"
    silver = "silver"
    gold = "gold"


class MerchantStatus(enum.StrEnum):
    pending = "pending"
    active = "active"
    suspended = "suspended"


class Merchant(Base, TimestampMixin):
    __tablename__ = "merchants"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    shop_name: Mapped[str] = mapped_column(String(200))
    slug: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    description_vi: Mapped[str | None] = mapped_column(Text)
    description_en: Mapped[str | None] = mapped_column(Text)
    logo_url: Mapped[str | None] = mapped_column(String(500))
    banner_url: Mapped[str | None] = mapped_column(String(500))
    region: Mapped[str | None] = mapped_column(String(100))
    tier: Mapped[MerchantTier] = mapped_column(Enum(MerchantTier), default=MerchantTier.bronze)
    status: Mapped[MerchantStatus] = mapped_column(
        Enum(MerchantStatus), default=MerchantStatus.pending
    )
    established_year: Mapped[int | None] = mapped_column(Integer)

    # relationships — string refs resolved at mapper configure time
    user: Mapped[User] = relationship("User", backref="merchant", uselist=False)
    products: Mapped[list[Product]] = relationship("Product", back_populates="merchant")
    orders: Mapped[list[Order]] = relationship("Order", back_populates="merchant")
    promotions: Mapped[list[Promotion]] = relationship("Promotion", back_populates="merchant")
    wallet_transactions: Mapped[list[WalletTransaction]] = relationship(
        "WalletTransaction", back_populates="merchant"
    )
    shipping_zones: Mapped[list[ShippingZone]] = relationship(
        "ShippingZone", back_populates="merchant"
    )
