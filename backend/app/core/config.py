from functools import lru_cache
from typing import Literal
from zoneinfo import ZoneInfo

from pydantic import AnyHttpUrl, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = "timeHelper API"
    app_env: Literal["development", "test", "production"] = "development"
    app_timezone: str = "Europe/Berlin"
    allowed_origins: list[str] = Field(default_factory=list)

    openai_api_key: str | None = None
    openai_chat_model: str | None = None
    openai_transcribe_model: str | None = None

    supabase_url: AnyHttpUrl | None = None
    supabase_publishable_key: str | None = None
    supabase_secret_key: str | None = None
    supabase_jwks_url: AnyHttpUrl | None = None

    webde_username: str | None = None
    webde_app_password: str | None = None

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @property
    def timezone(self) -> ZoneInfo:
        return ZoneInfo(self.app_timezone)


@lru_cache
def get_settings() -> Settings:
    return Settings()
