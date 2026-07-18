from fastapi import APIRouter, UploadFile

from app.api.schemas import ApiResponse

router = APIRouter(prefix="/transcriptions", tags=["transcriptions"])


@router.post("", response_model=ApiResponse[dict[str, str]])
async def create_transcription(file: UploadFile) -> ApiResponse[dict[str, str]]:
    return ApiResponse(
        status="phase_2",
        data={"filename": file.filename or "audio"},
        message="Eigene Audioaufnahme ist nicht Bestandteil des MVP.",
    )
