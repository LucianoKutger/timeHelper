from pydantic import BaseModel


class MonthlyCloseResponse(BaseModel):
    response_massage: str
