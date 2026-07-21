from datetime import date, time
from uuid import UUID

import pytest
from postgrest import APIError

from app.adapters.inbound.api.models.dependencie.current_user import CurrentUser
from app.adapters.outbound.supabase.repositories.workdays import (
    SupabaseWorkdayRepository,
)
from app.core.models.workday import WorkDayCreate
from app.core.ports.outbound.repositories.workdays import (
    WorkdayAlreadyExistsError,
    WorkdayRepositoryError,
)


class FailingInsertQuery:
    def __init__(self, error: APIError) -> None:
        self.error = error

    def insert(self, data: dict[str, object]) -> "FailingInsertQuery":
        return self

    def execute(self) -> None:
        raise self.error


class FakeSupabaseClient:
    def __init__(self, error: APIError) -> None:
        self.query = FailingInsertQuery(error)

    def table(self, name: str) -> FailingInsertQuery:
        assert name == "work_days"
        return self.query


def repository_with_error(error: APIError) -> SupabaseWorkdayRepository:
    repository = SupabaseWorkdayRepository.__new__(SupabaseWorkdayRepository)
    repository.current_user = CurrentUser(
        id=UUID("dc4c0871-35bc-40bd-b0bc-eb5d52e46148"),
        access_token="test-token",
    )
    repository.supabase = FakeSupabaseClient(error)
    return repository


def workday() -> WorkDayCreate:
    return WorkDayCreate(
        work_date=date(2026, 6, 16),
        start_time_one=time(15),
        end_time_one=time(18),
    )


def test_duplicate_workday_has_understandable_error() -> None:
    error = APIError(
        {
            "code": "23505",
            "message": "duplicate key value violates unique constraint",
            "details": "Key (user_id, work_date) already exists.",
            "hint": None,
        }
    )

    with pytest.raises(WorkdayAlreadyExistsError) as result:
        repository_with_error(error).create_workday(workday())

    assert str(result.value) == "Für den 2026-06-16 existiert bereits ein Arbeitstag."
    assert result.value.provider_code == "23505"
    assert result.value.reason == (
        "duplicate key value violates unique constraint "
        "Key (user_id, work_date) already exists."
    )


def test_unknown_supabase_error_keeps_provider_context() -> None:
    error = APIError(
        {
            "code": "PGRST204",
            "message": "Column was not found in the schema cache",
            "details": None,
            "hint": "Check the table schema.",
        }
    )

    with pytest.raises(WorkdayRepositoryError) as result:
        repository_with_error(error).create_workday(workday())

    assert type(result.value) is WorkdayRepositoryError
    assert result.value.provider_code == "PGRST204"
    assert result.value.reason == (
        "Column was not found in the schema cache Hinweis: Check the table schema."
    )
