from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AddressCreate(BaseModel):
    label: str = "Nhà"
    name: str
    phone: str
    address: str
    city: str
    country: str = "Việt Nam"
    is_default: bool = False


class AddressRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    label: str
    name: str
    phone: str
    address: str
    city: str
    country: str
    is_default: bool
    created_at: datetime
