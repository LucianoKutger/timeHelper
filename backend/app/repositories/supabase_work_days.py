from collections.abc import Sequence
from datetime import date
from uuid import UUID

from app.domain.models.commands import UpsertWorkDay
from app.domain.models.work_day import WorkDay
from app.infrastructure.supabase_client import get_supabase_admin_client


class SupabaseWorkDayRepository:
    async def get_by_date(self, user_id: UUID, work_date: date) -> WorkDay | None:
        response = (
            get_supabase_admin_client()
            .table("work_days")
            .select("*")
            .eq("user_id", str(user_id))
            .eq("work_date", work_date.isoformat())
            .neq("status", "deleted")
            .maybe_single()
            .execute()
        )
        if response is None or not response.data:
            return None
        return WorkDay.model_validate(response.data)

    async def list_month(self, user_id: UUID, year: int, month: int) -> Sequence[WorkDay]:
        first = date(year, month, 1)
        next_month = date(year + (month == 12), 1 if month == 12 else month + 1, 1)
        response = (
            get_supabase_admin_client()
            .table("work_days")
            .select("*")
            .eq("user_id", str(user_id))
            .gte("work_date", first.isoformat())
            .lt("work_date", next_month.isoformat())
            .neq("status", "deleted")
            .order("work_date")
            .execute()
        )
        return [WorkDay.model_validate(item) for item in response.data]

    async def upsert(self, user_id: UUID, command: UpsertWorkDay, source_text: str) -> WorkDay:
        payload = command.model_dump(mode="json", exclude={"action"})
        payload.update({"user_id": str(user_id), "source_text": source_text, "status": "active"})
        response = (
            get_supabase_admin_client()
            .table("work_days")
            .upsert(payload, on_conflict="user_id,work_date")
            .execute()
        )
        return WorkDay.model_validate(response.data[0])

    async def soft_delete(self, user_id: UUID, work_day_id: UUID) -> None:
        (
            get_supabase_admin_client()
            .table("work_days")
            .update({"status": "deleted"})
            .eq("id", str(work_day_id))
            .eq("user_id", str(user_id))
            .execute()
        )
