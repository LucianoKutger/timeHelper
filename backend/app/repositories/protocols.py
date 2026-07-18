from collections.abc import Sequence
from datetime import date
from typing import Protocol
from uuid import UUID

from app.domain.models.commands import UpsertWorkDay
from app.domain.models.work_day import WorkDay


class WorkDayRepository(Protocol):
    async def get_by_date(self, user_id: UUID, work_date: date) -> WorkDay | None: ...

    async def list_month(self, user_id: UUID, year: int, month: int) -> Sequence[WorkDay]: ...

    async def upsert(self, user_id: UUID, command: UpsertWorkDay, source_text: str) -> WorkDay: ...

    async def soft_delete(self, user_id: UUID, work_day_id: UUID) -> None: ...


class CommandRequestRepository(Protocol):
    async def reserve(self, user_id: UUID, request_id: UUID, raw_text: str) -> bool: ...

    async def mark_completed(self, user_id: UUID, request_id: UUID, result_ref: str) -> None: ...
