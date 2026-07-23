from typing import Protocol

from app.core.models.email_draft import EmailDraft


class EmailDraftGateway(Protocol):
    def save_draft(
        self, draft: EmailDraft, workbooky_bytes: bytes, filename: str
    ) -> str: ...
