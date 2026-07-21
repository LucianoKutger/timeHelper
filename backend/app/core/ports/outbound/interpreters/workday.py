from datetime import date
from typing import Protocol

from app.core.models.workday import WorkDayCreate


class WorkDayInterpreter(Protocol):

    def interpret_work_day(
        self,
        message: str,
        current_date: date,
    ) -> WorkDayCreate: ...
