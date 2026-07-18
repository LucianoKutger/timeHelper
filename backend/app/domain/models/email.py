from pydantic import BaseModel, EmailStr, Field


class EmailPreview(BaseModel):
    recipient: EmailStr
    subject: str = Field(max_length=200)
    body: str = Field(max_length=5000)
    artifact_id: str
