from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel

DeviceKey = Literal["mobile", "desktop", "tablet", "unknown"]
SourceKey = Literal["direct", "google", "facebook", "other"]
FunnelKey = Literal["view_product", "add_to_cart", "checkout", "complete"]


class BehaviorStats(BaseModel):
    total_sessions: int
    bounce_rate: float | None
    avg_duration_sec: float | None
    pages_per_session: float | None


class DeviceBucket(BaseModel):
    key: DeviceKey
    count: int


class SourceBucket(BaseModel):
    key: SourceKey
    count: int


class TopPage(BaseModel):
    path: str
    count: int


class BehaviorFunnelStage(BaseModel):
    key: FunnelKey
    count: int


class HourlyBucket(BaseModel):
    hour: int
    count: int


class SessionSummary(BaseModel):
    session_id: str
    visitor_id: str
    user_id: int | None
    page_count: int
    duration_sec: int
    first_seen: datetime
    last_seen: datetime


class BehaviorOverview(BaseModel):
    stats: BehaviorStats
    by_device: list[DeviceBucket]
    by_source: list[SourceBucket]
    top_pages: list[TopPage]
    funnel: list[BehaviorFunnelStage]
    hourly_24h: list[HourlyBucket]
