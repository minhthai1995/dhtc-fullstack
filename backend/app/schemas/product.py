from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.product import ProductStatus


class ProductBase(BaseModel):
    name_vi: str = Field(min_length=1, max_length=255)
    name_en: str | None = Field(default=None, max_length=255)
    slug: str = Field(min_length=1, max_length=200)
    price: float = Field(gt=0)
    stock: int = Field(default=0, ge=0)
    description_vi: str | None = Field(default=None, max_length=10000)
    description_en: str | None = Field(default=None, max_length=10000)
    origin: str | None = Field(default=None, max_length=200)
    certifications: list[str] | None = None
    images: list[dict] | None = None
    category_id: int | None = None


class ProductRead(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    merchant_id: int
    sold_count: int
    rating: float | None = None
    status: ProductStatus
    created_at: datetime
    updated_at: datetime


class ProductCreate(ProductBase):
    slug: str | None = Field(default=None, min_length=1)


class ProductUpdate(BaseModel):
    name_vi: str | None = Field(default=None, min_length=1, max_length=255)
    name_en: str | None = Field(default=None, min_length=1, max_length=255)
    price: float | None = Field(default=None, gt=0)
    stock: int | None = Field(default=None, ge=0)
    description_vi: str | None = Field(default=None, max_length=10000)
    description_en: str | None = Field(default=None, max_length=10000)
    origin: str | None = Field(default=None, min_length=1, max_length=200)
    certifications: list[str] | None = None
    images: list[dict] | None = None
    category_id: int | None = None
    status: ProductStatus | None = None
