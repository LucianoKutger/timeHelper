from uuid import UUID
from typing import Annotated

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.adapters.inbound.api.models.dependencie.current_user import CurrentUser

from app.adapters.outbound.supabase.clients.supabase import create_user_client

bearer = HTTPBearer()


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer)],
) -> CurrentUser:
    token = credentials.credentials
    user_client = create_user_client(token)

    try:
        response = user_client.auth.get_user(token)
    except Exception as error:
        raise HTTPException(
            status_code=401,
            detail="Ungültiger oder abgelaufener Access Token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from error

    if response.user is None:
        raise HTTPException(
            status_code=401,
            detail="Benutzer nicht gefunden",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return CurrentUser(id=UUID(response.user.id), access_token=token)
