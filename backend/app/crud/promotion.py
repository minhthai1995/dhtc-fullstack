from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy import update as sa_update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.promotion import Promotion, PromotionType
from app.schemas.promotion import PromotionCreate, PromotionUpdate


@dataclass(frozen=True)
class AppliedPromotion:
    promotion: Promotion
    discount: float


class PromotionInvalidError(ValueError):
    """Raised when a coupon cannot be applied (not found / expired / under min)."""


async def get_by_merchant(db: AsyncSession, merchant_id: int) -> list[Promotion]:
    result = await db.execute(
        select(Promotion).where(Promotion.merchant_id == merchant_id)
    )
    return list(result.scalars().all())


async def get_by_id(db: AsyncSession, promotion_id: int) -> Promotion | None:
    result = await db.execute(select(Promotion).where(Promotion.id == promotion_id))
    return result.scalars().first()


async def create(
    db: AsyncSession, merchant_id: int, data: PromotionCreate
) -> Promotion:
    promotion = Promotion(merchant_id=merchant_id, **data.model_dump())
    db.add(promotion)
    await db.commit()
    await db.refresh(promotion)
    return promotion


async def update(db: AsyncSession, promotion: Promotion, data: PromotionUpdate) -> Promotion:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(promotion, field, value)
    await db.commit()
    await db.refresh(promotion)
    return promotion


async def delete(db: AsyncSession, promotion: Promotion) -> None:
    await db.delete(promotion)
    await db.commit()


async def apply_to_subtotal(
    db: AsyncSession,
    code: str,
    merchant_id: int,
    subtotal: float,
) -> AppliedPromotion:
    """Validate ``code`` for ``merchant_id`` and return discount for ``subtotal``.

    Raises PromotionInvalidError with a customer-facing Vietnamese message if the
    coupon cannot be applied. Caller is responsible for ``increment_usage``
    once the order commits successfully.
    """
    normalized = code.upper().strip()
    if not normalized:
        raise PromotionInvalidError("Mã giảm giá không hợp lệ")

    result = await db.execute(
        select(Promotion)
        .where(
            Promotion.code == normalized,
            Promotion.merchant_id == merchant_id,
            Promotion.is_active.is_(True),
        )
        .with_for_update()
    )
    promo = result.scalars().first()
    if promo is None:
        raise PromotionInvalidError("Mã giảm giá không tồn tại")

    if promo.expires_at is not None:
        expires = promo.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=UTC)
        if expires < datetime.now(UTC):
            raise PromotionInvalidError("Mã giảm giá đã hết hạn")

    if promo.max_usage is not None and promo.usage_count >= promo.max_usage:
        raise PromotionInvalidError("Mã giảm giá đã hết lượt sử dụng")

    min_order = float(promo.min_order or 0)
    if min_order and subtotal < min_order:
        raise PromotionInvalidError(
            f"Đơn hàng tối thiểu {min_order:,.0f}₫ để áp dụng mã này"
        )

    value = float(promo.value)
    if promo.type == PromotionType.percentage:
        discount = round(subtotal * value / 100, 2)
    else:
        discount = min(value, subtotal)

    if discount <= 0:
        raise PromotionInvalidError("Mã giảm giá không có hiệu lực với đơn này")

    return AppliedPromotion(promotion=promo, discount=discount)


async def increment_usage(db: AsyncSession, promotion_id: int) -> None:
    """Bump ``usage_count`` within the caller's transaction (no commit here)."""
    await db.execute(
        sa_update(Promotion)
        .where(Promotion.id == promotion_id)
        .values(usage_count=Promotion.usage_count + 1)
    )
