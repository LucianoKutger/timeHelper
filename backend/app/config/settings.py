from functools import lru_cache
from pathlib import Path

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = BACKEND_DIR / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    openai_api_key: SecretStr
    openai_chat_model: str

    supabase_url: str
    supabase_publishable_key: SecretStr | None = None
    supabase_secret_key: SecretStr

    webde_username: str
    webde_app_password: SecretStr


@lru_cache
def get_settings() -> Settings:
    return Settings()
