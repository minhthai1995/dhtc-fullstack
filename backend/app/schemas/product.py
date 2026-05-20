from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.product import ProductStatus


class ProductBase(BaseModel):
    name_vi: str
    name_en: str | None = None
    slug: str
    price: float
    stock: int = 0
    description_vi: str | None = None
    description_en: str | None = None
    origin: str | None = None
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
    pass


class ProductUpdate(BaseModel):
    name_vi: str | None = None
    name_en: str | None = None
    price: float | None = None
    stock: int | None = None
    description_vi: str | None = None
    description_en: str | None = None
    origin: str | None = None
    certifications: list[str] | None = None
    images: list[dict] | None = None
    category_id: int | None = None
    status: ProductStatus | None = None
