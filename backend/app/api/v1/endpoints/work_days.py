from fastapi import APIRouter, Query

from app.api.schemas import ApiResponse

router = APIRouter(prefix="/work-days", tags=["work-days"])


@router.get("", response_model=ApiResponse[list[dict[str, object]]])
async def list_work_days(
    year: int = Query(ge=2020, le=2100),
    month: int = Query(ge=1, le=12),
) -> ApiResponse[list[dict[str, object]]]:
    return ApiResponse(status="not_configured", data=[], message=f"{year:04d}-{month:02d}")


@router.patch("/{work_day_id}", response_model=ApiResponse[dict[str, str]])
async def update_work_day(work_day_id: str) -> ApiResponse[dict[str, str]]:
    return ApiResponse(status="not_configured", data={"id": work_day_id})


@router.delete("/{work_day_id}", response_model=ApiResponse[dict[str, str]])
async def delete_work_day(work_day_id: str) -> ApiResponse[dict[str, str]]:
    return ApiResponse(status="not_configured", data={"id": work_day_id})
