from functools import lru_cache

from supabase import Client, create_client

from app.core.config import get_settings


@lru_cache
def get_supabase_admin_client() -> Client:
    settings = get_settings()
    if settings.supabase_url is None or settings.supabase_secret_key is None:
        raise RuntimeError("Supabase server configuration is missing")
    return create_client(str(settings.supabase_url), settings.supabase_secret_key)
