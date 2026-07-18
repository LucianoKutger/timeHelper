from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field


class ApiResponse[T](BaseModel):
    status: str
    data: T | None = None
    message: str | None = None
    error: dict[str, Any] | None = None


class CommandPreviewRequest(BaseModel):
    request_id: UUID
    message: str = Field(min_length=1, max_length=2000)
    client_timezone: str = "Europe/Berlin"


class ConfirmCommandRequest(BaseModel):
    confirmed: Literal[True]
