from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.merchant import MerchantStatus, MerchantTier


class MerchantBase(BaseModel):
    shop_name: str = Field(min_length=1, max_length=200)
    slug: str = Field(min_length=1, max_length=200)
    description_vi: str | None = Field(default=None, max_length=5000)
    description_en: str | None = Field(default=None, max_length=5000)
    logo_url: str | None = None
    banner_url: str | None = None
    region: str | None = Field(default=None, max_length=100)
    established_year: int | None = None
    business_name: str | None = Field(default=None, max_length=200)
    business_name_en: str | None = Field(default=None, max_length=200)
    tax_id: str | None = Field(default=None, max_length=50)
    address: str | None = Field(default=None, max_length=500)
    phone: str | None = Field(default=None, max_length=50)
    email: str | None = Field(default=None, max_length=255)
    facebook: str | None = Field(default=None, max_length=255)
    instagram: str | None = Field(default=None, max_length=255)
    representative: str | None = Field(default=None, max_length=200)
    cccd: str | None = Field(default=None, max_length=50)
    member_count: int | None = None
    entity_type: str | None = Field(default=None, max_length=50)
    certifications: list[str] | None = None


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
    shop_name: str | None = Field(default=None, min_length=1, max_length=200)
    slug: str | None = Field(default=None, min_length=1, max_length=200)
    description_vi: str | None = Field(default=None, max_length=5000)
    description_en: str | None = Field(default=None, max_length=5000)
    logo_url: str | None = None
    banner_url: str | None = None
    region: str | None = Field(default=None, max_length=100)
    established_year: int | None = None
    business_name: str | None = Field(default=None, max_length=200)
    business_name_en: str | None = Field(default=None, max_length=200)
    tax_id: str | None = Field(default=None, max_length=50)
    address: str | None = Field(default=None, max_length=500)
    phone: str | None = Field(default=None, max_length=50)
    email: str | None = Field(default=None, max_length=255)
    facebook: str | None = Field(default=None, max_length=255)
    instagram: str | None = Field(default=None, max_length=255)
    representative: str | None = Field(default=None, max_length=200)
    cccd: str | None = Field(default=None, max_length=50)
    member_count: int | None = None
    entity_type: str | None = Field(default=None, max_length=50)
    certifications: list[str] | None = None
