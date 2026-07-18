from fastapi import APIRouter

from app.api.schemas import ApiResponse

router = APIRouter(prefix="/monthly-reports", tags=["monthly-reports"])


@router.post("", response_model=ApiResponse[dict[str, str]])
async def create_monthly_report() -> ApiResponse[dict[str, str]]:
    return ApiResponse(status="not_configured", data={"state": "pending"})


@router.get("/{report_id}", response_model=ApiResponse[dict[str, str]])
async def get_monthly_report(report_id: str) -> ApiResponse[dict[str, str]]:
    return ApiResponse(status="not_configured", data={"id": report_id})
