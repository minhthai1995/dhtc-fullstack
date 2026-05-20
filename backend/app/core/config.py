from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "DHTC Platform"
    DEBUG: bool = False
    ENVIRONMENT: str = Field(default="development", pattern="^(development|staging|production)$")

    DATABASE_URL: str = "postgresql+asyncpg://dhtc:dhtc@localhost:5432/dhtc"

    JWT_SECRET: str = "change_me_in_prod"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24

    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # AI Chatbot
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "anthropic/claude-haiku-4-5"
    ANTHROPIC_API_KEY: str = ""

    # Facebook Messenger
    FACEBOOK_PAGE_ACCESS_TOKEN: str = ""
    FACEBOOK_APP_SECRET: str = ""
    FACEBOOK_WEBHOOK_VERIFY_TOKEN: str = "dhtc_webhook_2026"

    # Image upload (product images)
    UPLOAD_DIR: Path = Path("./uploads")
    MAX_UPLOAD_BYTES: int = 2 * 1024 * 1024  # 2MB per file after client compression


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
