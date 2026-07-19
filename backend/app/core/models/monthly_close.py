from pydantic import BaseModel
from app.core.models.workday import WorkDayCreate


class MonthlyClose(BaseModel):
    month_by_int: int
    work_days: list[WorkDayCreate]
