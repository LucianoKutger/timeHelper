from pydantic import BaseModel
from datetime import date, datetime, time
from uuid import UUID


class WorkDayRrequest(BaseModel):
    message: str
