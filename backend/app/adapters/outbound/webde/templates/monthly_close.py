from datetime import date
import locale

from app.core.models.email_draft import EmailDraft


class EmailDarftTemplates:

    def baskidEmailDraft(year: int, month: int) -> EmailDraft:

        locale.setlocale(locale.LC_TIME, "de_DE.UTF-8")

        current_date = date(year, month, 1)

        written_month = current_date.strftime("%B")
        return EmailDraft(
            to="mirjana.pasalic@dirk-nowitzki-stiftung.org",
            subject="Arbeitszeit",
            content=(
                "Hallo Mirjana,\n\n"
                f"anbei findest du meinen Stundenzettel für {written_month}\n\n"
                "MfG\n"
                "Giuliano"
            ),
        )
