from app.models.base import Base
from app.models.user import User  # noqa: F401  registers table with metadata

__all__ = ["Base", "User"]
