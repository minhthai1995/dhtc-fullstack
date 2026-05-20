from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.merchant import MerchantStatus, MerchantTier


class MerchantBase(BaseModel):
    shop_name: str
    slug: str
    description_vi: str | None = None
    description_en: str | None = None
    logo_url: str | None = None
    banner_url: str | None = None
    region: str | None = None
    established_year: int | None = None


class MerchantRead(MerchantBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    tier: MerchantTier
    status: MerchantStatus
    created_at: datetime
    updated_at: datetime


class MerchantCreate(MerchantBase):
    pass


class MerchantUpdate(BaseModel):
    shop_name: str | None = None
    description_vi: str | None = None
    description_en: str | None = None
    logo_url: str | None = None
    banner_url: str | None = None
    region: str | None = None
