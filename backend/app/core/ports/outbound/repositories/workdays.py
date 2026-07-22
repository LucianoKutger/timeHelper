from typing import Protocol

from app.core.models.monthly_close import MonthlyClose
from app.core.models.workday import WorkDay, WorkDayCreate


class WorkdayRepositoryError(RuntimeError):
    error_code = "WORKDAY_STORAGE_ERROR"

    def __init__(
        self,
        message: str,
        *,
        provider_code: str | None = None,
        reason: str | None = None,
    ) -> None:
        super().__init__(message)
        self.provider_code = provider_code
        self.reason = reason


class WorkdayAlreadyExistsError(WorkdayRepositoryError):
    error_code = "WORKDAY_ALREADY_EXISTS"


class WorkdayDataValidationError(WorkdayRepositoryError):
    error_code = "WORKDAY_DATA_INVALID"


class WorkdayRepository(Protocol):
    def get_workdays_for_close(self, year: int, month: int) -> MonthlyClose: ...

    def create_workday(self, workday: WorkDayCreate) -> WorkDay: ...

    def saveMessage(self, message: str): ...
