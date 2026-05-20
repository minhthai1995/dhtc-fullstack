from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class FBProfileOut(BaseModel):
    """Public read view for admin/customer routes."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    fb_app_user_id: str
    fb_email: str | None = None
    fb_first_name: str | None = None
    fb_last_name: str | None = None
    fb_profile_pic_url: str | None = None
    fb_locale: str | None = None
    linked_at: datetime
    messenger_psid: str | None = None


class FBProfileCreate(BaseModel):
    """Internal-only — used by FB OAuth service to upsert a profile row."""

    user_id: int
    fb_app_user_id: str
    fb_email: str | None = None
    fb_first_name: str | None = None
    fb_last_name: str | None = None
    fb_profile_pic_url: str | None = None
    fb_locale: str | None = None
    raw_oauth_payload: dict[str, Any] | None = None
