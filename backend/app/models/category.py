from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.product import Product


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name_vi: Mapped[str] = mapped_column(String(100))
    name_en: Mapped[str] = mapped_column(String(100))
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    parent_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"), index=True)
    icon_url: Mapped[str | None] = mapped_column(String(500))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    # relationships — string refs resolved at mapper configure time
    parent: Mapped[Category | None] = relationship(
        "Category", remote_side="Category.id", backref="children"
    )
    products: Mapped[list[Product]] = relationship("Product", back_populates="category")
