from pydantic import BaseModel


class EmailDraft(BaseModel):
    to: str
    subject: str
    content: str
