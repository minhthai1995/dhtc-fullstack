from pydantic import BaseModel, ConfigDict


class ShippingZoneRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    merchant_id: int
    zone_name: str
    countries: list[str]
    base_rate: float
    per_kg_rate: float
    estimated_days_min: int
    estimated_days_max: int


class ShippingZoneCreate(BaseModel):
    zone_name: str
    countries: list[str]
    base_rate: float
    per_kg_rate: float = 0
    estimated_days_min: int = 1
    estimated_days_max: int = 7


class ShippingZoneUpdate(BaseModel):
    zone_name: str | None = None
    countries: list[str] | None = None
    base_rate: float | None = None
    per_kg_rate: float | None = None
