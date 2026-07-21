from uuid import UUID

from pydantic import BaseModel


class CurrentUser(BaseModel):
    id: UUID
    access_token: str
