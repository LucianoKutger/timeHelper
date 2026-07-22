import logging
from datetime import date

from postgrest import APIError
from pydantic import ValidationError

from app.adapters.inbound.api.models.dependencie.current_user import CurrentUser
from app.adapters.outbound.supabase.clients.supabase import create_user_client
from app.core.models.monthly_close import MonthlyClose
from app.core.models.workday import WorkDay, WorkDayCreate
from app.core.ports.outbound.repositories.workdays import (
    WorkdayAlreadyExistsError,
    WorkdayDataValidationError,
    WorkdayRepositoryError,
)

logger = logging.getLogger(__name__)

DATA_ERROR_CODES = {"22007", "22008", "22P02", "23502", "23503", "23514"}


def _get_api_error_reason(error: APIError) -> str | None:
    parts = [error.message, error.details]
    if error.hint:
        parts.append(f"Hinweis: {error.hint}")

    return " ".join(dict.fromkeys(part for part in parts if part)) or None


class SupabaseWorkdayRepository:

    def __init__(self, current_user: CurrentUser):
        self.current_user = current_user
        self.supabase = create_user_client(current_user.access_token)

    def get_workdays_for_close(self, year: int, month: int) -> MonthlyClose:
        start_date = date(year, month, 1)

        if month == 12:
            end_date = date(year + 1, 1, 1)
        else:
            end_date = date(year, month + 1, 1)

        try:

            response = (
                self.supabase.table("work_days")
                .select("*")
                .gte("work_date", start_date.isoformat())
                .lt("work_date", end_date.isoformat())
                .execute()
            )

            return MonthlyClose(
                work_days=[WorkDay.model_validate(workday) for workday in response.data]
            )

        except APIError as error:
            print(f"Supabase-Fehler beim Laden der Arbeitstage: {error}")

            raise RuntimeError(
                "Die Arbeitstage konnten nicht aus Supabase geladen werden."
            ) from error

        except ValidationError as error:
            print(f"Fehler beim Validieren der Supabase-Daten: {error}")

            raise RuntimeError(
                "Die geladenen Arbeitstage entsprechen nicht dem WorkDay-Modell."
            ) from error

    def create_workday(
        self,
        workday: WorkDayCreate,
    ) -> WorkDay:

        data = workday.model_dump(mode="json")
        data["user_id"] = str(self.current_user.id)

        try:
            response = self.supabase.table("work_days").insert(data).execute()
        except APIError as error:
            logger.exception(
                "Supabase hat das Anlegen des Arbeitstags abgelehnt (code=%s)",
                error.code,
            )

            error_kwargs = {
                "provider_code": error.code,
                "reason": _get_api_error_reason(error),
            }

            if error.code == "23505":
                raise WorkdayAlreadyExistsError(
                    f"Für den {workday.work_date} existiert bereits ein Arbeitstag.",
                    **error_kwargs,
                ) from error

            if error.code in DATA_ERROR_CODES:
                raise WorkdayDataValidationError(
                    "Die Arbeitszeitdaten wurden von der Datenbank abgelehnt.",
                    **error_kwargs,
                ) from error

            raise WorkdayRepositoryError(
                "Arbeitstag konnte nicht in Supabase gespeichert werden.",
                **error_kwargs,
            ) from error

        if not response.data:
            logger.error(
                "Supabase hat nach dem Anlegen keinen Arbeitstag zurückgegeben"
            )
            raise WorkdayRepositoryError(
                "Supabase hat nach dem Anlegen keinen Arbeitstag zurückgegeben.",
                provider_code="EMPTY_RESPONSE",
            )

        try:
            return WorkDay.model_validate(response.data[0])
        except ValidationError as error:
            logger.exception("Die Supabase-Antwort entspricht nicht dem WorkDay-Modell")
            raise WorkdayRepositoryError(
                "Der Arbeitstag wurde gespeichert, aber die Antwort konnte nicht "
                "verarbeitet werden.",
                provider_code="INVALID_RESPONSE",
                reason="Die Supabase-Antwort entspricht nicht dem erwarteten Datenmodell.",
            ) from error
