"""Application configuration via pydantic-settings.

All settings are loaded from environment variables with type-safety.
"""

from __future__ import annotations

from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "GenZ Finance Co-Pilot"
    APP_ENV: Literal["development", "staging", "production"] = "development"
    DEBUG: bool = False

    # Auth
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ALGORITHM: str = "HS256"

    # MongoDB
    MONGODB_URL: str
    MONGODB_DB_NAME: str = "genz_finance"

    # Google Cloud / Agent Builder
    GOOGLE_CLOUD_PROJECT: str
    GOOGLE_CLOUD_LOCATION: str = "us-central1"
    AGENT_BUILDER_AGENT_ID: str
    GOOGLE_APPLICATION_CREDENTIALS: str | None = None

    # Elastic / Elasticsearch
    ELASTIC_CLOUD_ID: str
    ELASTIC_API_KEY: str
    ELASTIC_INDEX_NAME: str = "indian_finance_knowledge"

    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 30

    # CORS
    ALLOWED_ORIGINS: list[str] = Field(
        default_factory=lambda: ["http://localhost:5173", "https://your-app.web.app"]
    )

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

    @field_validator("SECRET_KEY")
    @classmethod
    def _secret_key_min_length(cls, value: str) -> str:
        if len(value) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long")
        return value


settings = Settings()
