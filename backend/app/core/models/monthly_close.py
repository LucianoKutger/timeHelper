from pydantic import BaseModel
from app.core.models.workday import WorkDay


class MonthlyClose(BaseModel):
    work_days: list[WorkDay]


class GeneratedWorkbook(BaseModel):
    content: bytes
