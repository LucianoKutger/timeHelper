from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_user
from app.api.v1.endpoints import (
    artifacts,
    commands,
    email_drafts,
    monthly_reports,
    transcriptions,
    work_days,
)

router = APIRouter(prefix="/v1", dependencies=[Depends(get_current_user)])
router.include_router(commands.router)
router.include_router(work_days.router)
router.include_router(monthly_reports.router)
router.include_router(artifacts.router)
router.include_router(email_drafts.router)
router.include_router(transcriptions.router)
