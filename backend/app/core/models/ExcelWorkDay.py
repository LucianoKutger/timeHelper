from datetime import time

from pydantic import BaseModel

from app.core.models.Enums import DayMarker


class ExcelValues(BaseModel):
    row: int
    start_one: time | None = None
    end_one: time | None = None
    start_two: time | None = None
    end_two: time | None = None
    day_marker: DayMarker | None = None
    note: str | None = None


class ExcelWorkDayList(BaseModel):
    month: str
    excel_list: list[ExcelValues]
