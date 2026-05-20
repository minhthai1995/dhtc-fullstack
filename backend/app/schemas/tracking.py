from pydantic import BaseModel, Field


class PageViewIn(BaseModel):
    visitor_id: str = Field(..., min_length=8, max_length=36)
    session_id: str = Field(..., min_length=8, max_length=36)
    path: str = Field(..., min_length=1, max_length=500)
    referrer: str | None = Field(default=None, max_length=500)
