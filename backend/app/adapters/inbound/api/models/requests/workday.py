from pydantic import BaseModel


class WorkDayRequest(BaseModel):
    message: str
