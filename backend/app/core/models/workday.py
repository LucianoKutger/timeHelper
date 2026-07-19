from pydantic import BaseModel
from datetime import date, datetime, time
from uuid import UUID


class WorkDayCreate(BaseModel):
    work_date: date
    start_time_one: time | None = None
    end_time_one: time | None = None
    start_time_two: time | None = None
    end_time_two: time | None = None
    day_marker: str | None = None
    note: str | None = None


class WorkDay(WorkDayCreate):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
