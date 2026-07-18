from datetime import date, datetime, time
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.domain.models.day_code import DayCode


class WorkDay(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    work_date: date
    start_time_1: time | None = None
    end_time_1: time | None = None
    start_time_2: time | None = None
    end_time_2: time | None = None
    break_minutes: int = Field(default=0, ge=0, le=720)
    day_code: DayCode | None = None
    note: str | None = None
    source_text: str | None = None
    status: str = "active"
    created_at: datetime
    updated_at: datetime
