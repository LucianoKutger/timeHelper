from fastapi import APIRouter

from app.api.schemas import ApiResponse

router = APIRouter(prefix="/artifacts", tags=["artifacts"])


@router.post("/{artifact_id}/signed-url", response_model=ApiResponse[dict[str, str]])
async def create_signed_url(artifact_id: str) -> ApiResponse[dict[str, str]]:
    return ApiResponse(status="not_configured", data={"id": artifact_id})
