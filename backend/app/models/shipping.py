from __future__ import annotations

from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy import ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.merchant import Merchant


class ShippingZone(Base, TimestampMixin):
    __tablename__ = "shipping_zones"

    id: Mapped[int] = mapped_column(primary_key=True)
    merchant_id: Mapped[int] = mapped_column(ForeignKey("merchants.id"), index=True)
    zone_name: Mapped[str] = mapped_column(String(100))
    countries: Mapped[list] = mapped_column(sa.JSON)
    base_rate: Mapped[float] = mapped_column(Numeric(8, 2))
    per_kg_rate: Mapped[float] = mapped_column(Numeric(6, 2), default=0)
    estimated_days_min: Mapped[int] = mapped_column(Integer, default=1)
    estimated_days_max: Mapped[int] = mapped_column(Integer, default=7)

    # relationships — string refs resolved at mapper configure time
    merchant: Mapped[Merchant] = relationship("Merchant", back_populates="shipping_zones")
