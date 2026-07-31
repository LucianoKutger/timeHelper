from fastapi import FastAPI

from app.adapters.inbound.api.endpoints.monthly_close import (
    router as monthly_close_router,
)
from app.adapters.inbound.api.endpoints.workdays import router as workdays_router

app = FastAPI(title="timeHelper API")


@app.get("/health", tags=["system"])
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(workdays_router, prefix="/v1")
app.include_router(monthly_close_router, prefix="/v1")
