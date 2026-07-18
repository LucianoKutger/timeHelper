from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel


class MonthlyReport(BaseModel):
    id: UUID
    user_id: UUID
    year: int
    month: int
    revision: int
    status: Literal["pending", "processing", "ready", "failed"]
    storage_path: str | None = None
    sha256: str | None = None
    created_at: datetime
