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

    # Facebook OAuth Login (P5A)
    FACEBOOK_APP_ID: str = ""
    FACEBOOK_OAUTH_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/facebook/callback"
    FRONTEND_URL: str = "http://localhost:5173"

    # Facebook Graph API (P5C-enrich + P5E)
    FACEBOOK_GRAPH_API_VERSION: str = "v22.0"
    MESSENGER_PROFILE_CACHE_DAYS: int = 30

    # Proactive reply (P5E) — default OFF until Meta App Review approves
    # pages_manage_engagement + pages_read_user_content.
    PROACTIVE_REPLY_ENABLED: bool = False
    PROACTIVE_REPLY_DRY_RUN: bool = True
    PROACTIVE_REPLY_RATE_LIMIT_PER_HOUR: int = 30
    PROACTIVE_REPLY_PER_PSID_COOLDOWN_HOURS: int = 24

    # Image upload (product images)
    UPLOAD_DIR: Path = Path("./uploads")
    MAX_UPLOAD_BYTES: int = 2 * 1024 * 1024  # 2MB per file after client compression


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
