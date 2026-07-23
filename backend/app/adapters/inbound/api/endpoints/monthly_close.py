from fastapi import APIRouter, Depends

from app.adapters.inbound.api.models.responses.monthly_close import MonthlyCloseResponse
from app.adapters.inbound.api.models.requests.monthly_close import MonthlyCloseRequest
from app.adapters.inbound.api.dependencies.current_user import get_current_user
from app.adapters.inbound.api.models.dependencie.current_user import CurrentUser
from app.adapters.outbound.supabase.repositories.workdays import (
    SupabaseWorkdayRepository,
)
from app.adapters.outbound.webde.gateways.email_drafts import WebDeEmailDraftGateway
from app.adapters.outbound.webde.templates.monthly_close import EmailDarftTemplates
from app.core.models.email_draft import EmailDraft
from app.core.use_cases.monthly_close.create import CreateWorkBook
from app.core.models.workday import WorkDay
from app.adapters.outbound.excel.generators.monthly_workbook import (
    ExcelWorkbookGenerator,
)
from app.adapters.outbound.supabase.storage.files import SupabaseExceLStorage
from app.core.ports.outbound import storage
from app.adapters.outbound.excel.mappings.workdays import MapWorkdayToExcel

router = APIRouter(prefix="/monthly_close", tags=["workday"])


@router.post("/", response_model=MonthlyCloseResponse, status_code=200)
def close_month(
    request: MonthlyCloseRequest, current_user: CurrentUser = Depends(get_current_user)
) -> MonthlyCloseResponse:
    repository = SupabaseWorkdayRepository(current_user)
    generator = ExcelWorkbookGenerator()
    storage = SupabaseExceLStorage(current_user, "worktime")
    mapper = MapWorkdayToExcel()
    gateway = WebDeEmailDraftGateway()
    emailDraft = EmailDarftTemplates.baskidEmailDraft(request.year, request.month)

    use_case = CreateWorkBook(
        repository, generator, storage, mapper, gateway, emailDraft
    )

    use_case.execute_workbook(request.year, request.month)

    return MonthlyCloseResponse(response_message="Monatsabschluss erfolgreich erstellt")
