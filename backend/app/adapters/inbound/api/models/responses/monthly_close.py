from pydantic import BaseModel


class MonthlyCloseResponse(BaseModel):
    response_message: str
