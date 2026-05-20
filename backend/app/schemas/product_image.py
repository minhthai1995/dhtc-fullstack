from pydantic import BaseModel, Field


class ProductImageUrls(BaseModel):
    original: str
    large: str
    medium: str
    thumb: str


class ProductImageOut(BaseModel):
    id: str = Field(..., min_length=8, max_length=36)
    urls: ProductImageUrls
    order: int = 0


class ProductImageIn(BaseModel):
    id: str = Field(..., min_length=8, max_length=36)
    urls: ProductImageUrls
    order: int = 0
