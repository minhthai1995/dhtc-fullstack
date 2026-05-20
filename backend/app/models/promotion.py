from __future__ import annotations

import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.merchant import Merchant


class PromotionType(enum.StrEnum):
    percentage = "percentage"
    fixed = "fixed"


class Promotion(Base, TimestampMixin):
    __tablename__ = "promotions"

    id: Mapped[int] = mapped_column(primary_key=True)
    merchant_id: Mapped[int] = mapped_column(ForeignKey("merchants.id"), index=True)
    code: Mapped[str] = mapped_column(String(50), index=True)
    type: Mapped[PromotionType] = mapped_column(Enum(PromotionType))
    value: Mapped[float] = mapped_column(Numeric(10, 2))
    min_order: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    usage_count: Mapped[int] = mapped_column(Integer, default=0)
    max_usage: Mapped[int | None] = mapped_column(Integer)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # relationships — string refs resolved at mapper configure time
    merchant: Mapped[Merchant] = relationship("Merchant", back_populates="promotions")
