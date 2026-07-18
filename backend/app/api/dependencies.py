from typing import Annotated
from uuid import UUID

from fastapi import Depends, Header, HTTPException, status
from pydantic import BaseModel


class AuthenticatedUser(BaseModel):
    id: UUID
    access_token: str


async def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
) -> AuthenticatedUser:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid_token")

    # JWT verification against SUPABASE_JWKS_URL is connected here in backend phase 2.
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="JWT verification adapter is not configured yet",
    )


CurrentUser = Annotated[AuthenticatedUser, Depends(get_current_user)]
