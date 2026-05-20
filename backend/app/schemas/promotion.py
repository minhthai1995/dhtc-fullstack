from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.promotion import PromotionType


class PromotionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    merchant_id: int
    code: str
    type: PromotionType
    value: float
    min_order: float
    usage_count: int
    max_usage: int | None
    expires_at: datetime | None
    is_active: bool


class PromotionCreate(BaseModel):
    code: str
    type: PromotionType
    value: float
    min_order: float = 0
    max_usage: int | None = None
    expires_at: datetime | None = None


class PromotionUpdate(BaseModel):
    is_active: bool | None = None
    max_usage: int | None = None
    expires_at: datetime | None = None


class CouponValidateRequest(BaseModel):
    code: str
    order_total: float  # for min_order check


class CouponValidateResponse(BaseModel):
    valid: bool
    discount_pct: float = 0.0
    discount_amount: float = 0.0
    message: str = ""
    promotion_id: int | None = None
