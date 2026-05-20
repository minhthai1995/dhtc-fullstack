from pydantic import BaseModel, ConfigDict

from app.schemas.product import ProductRead


class CartItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    quantity: int
    product: ProductRead | None = None


class AddToCart(BaseModel):
    product_id: int
    quantity: int = 1


class UpdateCartItem(BaseModel):
    quantity: int
