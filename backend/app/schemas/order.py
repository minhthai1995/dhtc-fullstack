from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.order import OrderStatus


class ShippingAddressSchema(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    phone: str = Field(min_length=1, max_length=20)
    address: str = Field(min_length=1, max_length=500)
    city: str = Field(min_length=1, max_length=100)
    country: str = "Việt Nam"


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
    payment_method: str | None = None
    payment_status: str = "pending"
    payment_id: str | None = None
    shipping_method: str | None = None
    shipping_fee: float = 0
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemRead] = []


class OrderDetail(OrderRead):
    pass


class CreateOrderItem(BaseModel):
    product_id: int
    quantity: int = Field(ge=1)


class CreateOrder(BaseModel):
    merchant_id: int | None = None  # inferred from items if not provided
    items: list[CreateOrderItem]
    shipping_address: ShippingAddressSchema
    promotion_code: str | None = Field(default=None, max_length=50)
    notes: str | None = Field(default=None, max_length=1000)
    payment_method: str | None = Field(default=None, max_length=50)
    shipping_method: str | None = Field(default=None, max_length=50)
    shipping_fee: float = Field(default=0, ge=0)
    shipping_zone_id: int | None = None

    @field_validator("items")
    @classmethod
    def items_not_empty(cls, v: list[CreateOrderItem]) -> list[CreateOrderItem]:
        if not v:
            raise ValueError("Đơn hàng phải có ít nhất một sản phẩm")
        return v

    @field_validator("shipping_fee")
    @classmethod
    def shipping_fee_non_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Phí vận chuyển không thể âm")
        return v


class UpdateOrderStatus(BaseModel):
    status: OrderStatus
    tracking_number: str | None = Field(default=None, max_length=100)


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    note: str | None = Field(default=None, max_length=1000)
    tracking_number: str | None = Field(default=None, max_length=100)
