from datetime import date, time
from typing import Annotated, Literal

from pydantic import BaseModel, Field, model_validator

from app.domain.models.day_code import DayCode


class UpsertWorkDay(BaseModel):
    action: Literal["upsert_work_day"]
    work_date: date
    start_time_1: time | None = None
    end_time_1: time | None = None
    start_time_2: time | None = None
    end_time_2: time | None = None
    break_minutes: int = Field(default=0, ge=0, le=720)
    day_code: DayCode | None = None
    note: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def validate_work_day(self) -> "UpsertWorkDay":
        if self.start_time_1 is None and self.day_code is None:
            raise ValueError("Arbeitsblock oder Tagescode erforderlich")
        for start, end in (
            (self.start_time_1, self.end_time_1),
            (self.start_time_2, self.end_time_2),
        ):
            if (start is None) != (end is None):
                raise ValueError("Arbeitsblöcke benötigen Start und Ende")
            if start is not None and end is not None and end <= start:
                raise ValueError("Ende muss nach Beginn liegen")
        return self


class UpdateWorkDay(BaseModel):
    action: Literal["update_work_day"]
    work_date: date
    start_time_1: time | None = None
    end_time_1: time | None = None
    start_time_2: time | None = None
    end_time_2: time | None = None
    break_minutes: int | None = Field(default=None, ge=0, le=720)
    day_code: DayCode | None = None
    note: str | None = Field(default=None, max_length=500)


class GetMonthSummary(BaseModel):
    action: Literal["get_month_summary"]
    year: int = Field(ge=2020, le=2100)
    month: int = Field(ge=1, le=12)


class CreateMonthlyReport(BaseModel):
    action: Literal["create_monthly_report"]
    year: int = Field(ge=2020, le=2100)
    month: int = Field(ge=1, le=12)


Command = Annotated[
    UpsertWorkDay | UpdateWorkDay | GetMonthSummary | CreateMonthlyReport,
    Field(discriminator="action"),
]
