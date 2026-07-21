from supabase import Client, create_client
from supabase.lib.client_options import SyncClientOptions

from app.config.settings import get_settings


def create_user_client(access_token: str) -> Client:

    settings = get_settings()

    if settings.supabase_publishable_key is None:
        raise RuntimeError("Supabase Publishable Key fehlt")

    return create_client(
        settings.supabase_url,
        settings.supabase_publishable_key.get_secret_value(),
        options=SyncClientOptions(
            auto_refresh_token=False,
            persist_session=False,
            headers={
                "Authorization": f"Bearer {access_token}",
            },
        ),
    )
