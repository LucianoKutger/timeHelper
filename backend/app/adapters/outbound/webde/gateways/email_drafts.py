from datetime import datetime
from email.message import EmailMessage
from email.policy import SMTP
from email.utils import format_datetime, make_msgid
import imaplib

from app.adapters.outbound.webde.clients.webde import WebDeClient
from app.adapters.outbound.webde.templates.monthly_close import EmailDarftTemplates
from app.config.settings import get_settings
from app.core.models.email_draft import EmailDraft


class WebDeEmailDraftGateway:
    def __init__(self):
        setting = get_settings()
        self.username = setting.webde_username
        self.client = WebDeClient.connect_webde()

    def save_draft(
        self, draft: EmailDraft, workbook_bytes: bytes, filename: str
    ) -> str:
        try:
            message = EmailMessage()
            message["From"] = self.username
            message["To"] = draft.to
            message["subject"] = draft.subject
            message["Date"] = format_datetime(datetime.now().astimezone())
            message["Message-ID"] = make_msgid(domain="web.de")
            message.set_content(draft.content)
            message.add_attachment(
                workbook_bytes,
                maintype="application",
                subtype="vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                filename=filename,
            )

            status, response = self.client.append(
                "Entwurf",
                r"(\Draft)",
                imaplib.Time2Internaldate(datetime.now().astimezone()),
                message.as_bytes(policy=SMTP),
            )

            if status != "OK":
                raise RuntimeError(f"APPEND fehlgeschlagen: {response!r}")

            return "Entwurf Erfolgreich gespeichert"
        finally:
            self.client.logout()
