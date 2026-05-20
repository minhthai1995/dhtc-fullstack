from __future__ import annotations

from datetime import datetime

from sqlalchemy import ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.base import Base, TimestampMixin


class PageView(Base, TimestampMixin):
    __tablename__ = "page_views"
    __table_args__ = (
        Index("page_views_viewed_at_idx", "viewed_at"),
        Index("page_views_visitor_id_idx", "visitor_id"),
        Index("page_views_session_id_idx", "session_id"),
        Index("page_views_user_id_idx", "user_id"),
        Index("page_views_viewed_at_path_idx", "viewed_at", "path"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    visitor_id: Mapped[str] = mapped_column(String(36), nullable=False)
    session_id: Mapped[str] = mapped_column(String(36), nullable=False)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    path: Mapped[str] = mapped_column(String(500), nullable=False)
    referrer: Mapped[str | None] = mapped_column(String(500), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    country_code: Mapped[str | None] = mapped_column(String(2), nullable=True)
    viewed_at: Mapped[datetime] = mapped_column(
        server_default=func.now(),
        nullable=False,
    )
