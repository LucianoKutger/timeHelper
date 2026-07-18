from fastapi import APIRouter

from app.api.schemas import ApiResponse

router = APIRouter(prefix="/email-drafts", tags=["email-drafts"])


@router.post("", response_model=ApiResponse[dict[str, str]])
async def create_email_draft() -> ApiResponse[dict[str, str]]:
    return ApiResponse(status="not_configured", data={"state": "preview"})


@router.post("/{draft_id}/save-to-mailbox", response_model=ApiResponse[dict[str, str]])
async def save_to_mailbox(draft_id: str) -> ApiResponse[dict[str, str]]:
    return ApiResponse(status="not_configured", data={"id": draft_id})


@router.post("/{draft_id}/send", response_model=ApiResponse[dict[str, str]])
async def send_email(draft_id: str) -> ApiResponse[dict[str, str]]:
    return ApiResponse(status="not_configured", data={"id": draft_id})
