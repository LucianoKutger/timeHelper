from uuid import UUID
from pydantic import BaseModel


class MonthlyCloseRequest(BaseModel):
    month: int
    year: int
