from supabase import Client

from app.adapters.inbound.api.models.requests.login import LoginRequest
from app.adapters.inbound.api.models.responses.login import LoginResponse


def supabase_login(LoginRequest: LoginRequest, supabase: Client) -> LoginResponse:
    response = supabase.auth.sign_in_with_password(
        {
            "email": LoginRequest.email,
            "password": LoginRequest.password.get_secret_value(),
        }
    )

    return LoginResponse(
        auth_id=response.user.id,
        access_token=response.session.access_token,
        refresh_token=response.session.refresh_token,
        expires_at=response.session.expires_at,
    )
