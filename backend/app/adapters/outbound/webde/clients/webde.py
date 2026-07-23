import imaplib
import ssl


from app.config.settings import get_settings


class WebDeClient:

    def connect_webde() -> imaplib.IMAP4_SSL:
        settings = get_settings()

        client = imaplib.IMAP4_SSL(
            host="imap.web.de",
            port=993,
            ssl_context=ssl.create_default_context(),
            timeout=15,
        )

        client.login(
            settings.webde_username, settings.webde_app_password.get_secret_value()
        )

        return client
