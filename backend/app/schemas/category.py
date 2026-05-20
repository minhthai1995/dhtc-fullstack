from pydantic import BaseModel, ConfigDict


class CategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name_vi: str
    name_en: str
    slug: str
    parent_id: int | None
    icon_url: str | None
    sort_order: int
