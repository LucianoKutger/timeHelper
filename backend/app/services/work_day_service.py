from collections.abc import Sequence
from uuid import UUID

from app.domain.models.commands import UpsertWorkDay
from app.domain.models.work_day import WorkDay
from app.repositories.protocols import WorkDayRepository


class WorkDayService:
    def __init__(self, repository: WorkDayRepository) -> None:
        self.repository = repository

    async def list_month(self, user_id: UUID, year: int, month: int) -> Sequence[WorkDay]:
        return await self.repository.list_month(user_id, year, month)

    async def upsert(
        self,
        user_id: UUID,
        command: UpsertWorkDay,
        source_text: str,
    ) -> WorkDay:
        return await self.repository.upsert(user_id, command, source_text)
