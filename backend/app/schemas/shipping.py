from pydantic import BaseModel, ConfigDict, Field, model_validator


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
    zone_name: str = Field(min_length=1)
    countries: list[str] = Field(min_length=1)
    base_rate: float = Field(ge=0)
    per_kg_rate: float = Field(default=0, ge=0)
    estimated_days_min: int = Field(default=1, ge=1)
    estimated_days_max: int = Field(default=7, ge=1)

    @model_validator(mode='after')
    def days_range_valid(self) -> 'ShippingZoneCreate':
        if self.estimated_days_min > self.estimated_days_max:
            raise ValueError('estimated_days_min must be <= estimated_days_max')
        return self


class ShippingZoneUpdate(BaseModel):
    zone_name: str | None = Field(default=None, min_length=1)
    countries: list[str] | None = None
    base_rate: float | None = Field(default=None, ge=0)
    per_kg_rate: float | None = Field(default=None, ge=0)
    estimated_days_min: int | None = Field(default=None, ge=1)
    estimated_days_max: int | None = Field(default=None, ge=1)

    @model_validator(mode='after')
    def days_range_valid(self) -> 'ShippingZoneUpdate':
        mn, mx = self.estimated_days_min, self.estimated_days_max
        if mn is not None and mx is not None and mn > mx:
            raise ValueError('estimated_days_min must be <= estimated_days_max')
        return self
