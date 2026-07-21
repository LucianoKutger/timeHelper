from pydantic import BaseModel


class LoginResponse(BaseModel):
    auth_id: str
    access_token: str
    refresh_token: str
    expires_at: int
