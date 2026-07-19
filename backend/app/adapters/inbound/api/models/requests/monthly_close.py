from uuid import UUID
from pydantic import BaseModel


class MonthlyClose(BaseModel):
    user_id: UUID
    month_by_int: int
