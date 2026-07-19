from pydantic import BaseModel


class WorkDayResponse(BaseModel):
    response_massage: str
