from fastapi import APIRouter

from app.api.schemas import ApiResponse, CommandPreviewRequest

router = APIRouter(prefix="/commands", tags=["commands"])


@router.post("/preview", response_model=ApiResponse[dict[str, object]])
async def preview_command(payload: CommandPreviewRequest) -> ApiResponse[dict[str, object]]:
    return ApiResponse(
        status="not_configured",
        data={"request_id": str(payload.request_id), "message": payload.message},
        message="Agent, Authentisierung und Repository werden in Backend-Phase 2 verbunden.",
    )


@router.post("/{request_id}/confirm", response_model=ApiResponse[dict[str, str]])
async def confirm_command(request_id: str) -> ApiResponse[dict[str, str]]:
    return ApiResponse(status="not_configured", data={"request_id": request_id})
