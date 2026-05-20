from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator, model_validator

from app.models.order import OrderStatus


class OrderEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_id: int
    status: OrderStatus
    note: str | None
    created_at: datetime


class OrderItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    product_name: str = ""
    quantity: int
    unit_price: float

    @model_validator(mode="before")
    @classmethod
    def resolve_product_name(cls, data: object) -> object:
        # When constructing from an ORM OrderItem, pull product_name from the
        # related Product object if it hasn't been supplied explicitly.
        if not isinstance(data, dict) and hasattr(data, "__dict__"):
            product = getattr(data, "product", None)
            name = getattr(data, "product_name", None)
            if not name and product is not None:
                resolved = getattr(product, "name_vi", None) or f"SP#{data.product_id}"
                return {
                    "id": data.id,
                    "product_id": data.product_id,
                    "product_name": resolved,
                    "quantity": data.quantity,
                    "unit_price": float(data.unit_price),
                }
        return data


class OrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: int
    merchant_id: int
    status: OrderStatus
    total_amount: float
    shipping_address: dict
    tracking_number: str | None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemRead] = []


class OrderDetail(OrderRead):
    pass


class CreateOrderItem(BaseModel):
    product_id: int
    quantity: int


class CreateOrder(BaseModel):
    merchant_id: int | None = None  # inferred from items if not provided
    items: list[CreateOrderItem]
    shipping_address: dict
    promotion_code: str | None = None
    notes: str | None = None

    @field_validator("items")
    @classmethod
    def items_not_empty(cls, v: list[CreateOrderItem]) -> list[CreateOrderItem]:
        if not v:
            raise ValueError("Đơn hàng phải có ít nhất một sản phẩm")
        return v


class UpdateOrderStatus(BaseModel):
    status: OrderStatus
    tracking_number: str | None = None


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    note: str | None = None
    tracking_number: str | None = None
