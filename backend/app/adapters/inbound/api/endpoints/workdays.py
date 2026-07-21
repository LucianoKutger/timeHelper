from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status

from app.adapters.inbound.api.dependencies.current_user import get_current_user
from app.adapters.inbound.api.models.dependencie.current_user import CurrentUser
from app.adapters.inbound.api.models.requests.workday import WorkDayRequest
from app.adapters.inbound.api.models.responses.workday import WorkDayResponse
from app.adapters.outbound.pydantic_ai.interpreters.workday import (
    PydanticWorkDayInterpreter,
    WorkDayInterpretationError,
)
from app.adapters.outbound.supabase.repositories.workdays import (
    SupabaseWorkdayRepository,
)
from app.core.ports.outbound.repositories.workdays import (
    WorkdayAlreadyExistsError,
    WorkdayDataValidationError,
    WorkdayRepositoryError,
)
from app.core.use_cases.workdays.create_from_message import (
    CreateWorkDayFormMessage,
)

router = APIRouter(prefix="/workday", tags=["workday"])


def _repository_error_detail(error: WorkdayRepositoryError) -> dict[str, str]:
    detail = {
        "code": error.error_code,
        "message": str(error),
    }

    if error.provider_code:
        detail["provider_code"] = error.provider_code
    if error.reason:
        detail["reason"] = error.reason

    return detail


@router.post("/", response_model=WorkDayResponse, status_code=201)
def create(
    request: WorkDayRequest, current_user: CurrentUser = Depends(get_current_user)
) -> WorkDayResponse:
    interpreter = PydanticWorkDayInterpreter()
    repository = SupabaseWorkdayRepository(current_user)

    use_case = CreateWorkDayFormMessage(interpreter=interpreter, repository=repository)

    try:
        workday = use_case.execute_workday(
            message=request.message,
            current_date=date.today(),
        )
    except WorkDayInterpretationError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(error),
        ) from error
    except WorkdayAlreadyExistsError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=_repository_error_detail(error),
        ) from error
    except WorkdayDataValidationError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=_repository_error_detail(error),
        ) from error
    except WorkdayRepositoryError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=_repository_error_detail(error),
        ) from error

    return WorkDayResponse(
        response_massage=f"Arbeitstag angelegt für den {workday.work_date} wurde angelegt"
    )
