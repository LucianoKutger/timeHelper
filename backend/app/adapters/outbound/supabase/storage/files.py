from datetime import date
from io import BytesIO
from operator import eq
from urllib import response

import pandas as pd

from app.adapters.inbound.api.models.dependencie.current_user import CurrentUser
from app.adapters.outbound.supabase.clients.supabase import create_user_client
import locale


class SupabaseExceLStorage:
    def __init__(self, current_user: CurrentUser, bucket_name: str):
        self.current_user = current_user
        self.supabase = create_user_client(current_user.access_token)
        self.bucket_name = bucket_name

    def get_written_month(self, month: int, year: int, type: str):
        locale.setlocale(locale.LC_TIME, "de_DE.UTF-8")

        if type == "download":
            current_date = date(year, month - 1, 1)
        elif type == "save":
            current_date = date(year, month, 1)

        written_month = current_date.strftime("%B")

        return written_month

    def get_excel(self, year: int, month: int) -> bytes:

        written_month = self.get_written_month(month, year, "download")
        file_path = (
            f"{self.current_user.id}/"
            f"Arbeitszeit_{year}_{written_month}_Giuliano.xlsx"
        )

        file_bytes = self.supabase.storage.from_(self.bucket_name).download(file_path)

        return file_bytes

    def save_excel(self, excel_bytes: bytes, year: int, month: int) -> any:
        written_month = self.get_written_month(month, year, "save")
        file_path = (
            f"{self.current_user.id}/"
            f"Arbeitszeit_{year}_{written_month}_Giuliano.xlsx"
        )

        response = self.supabase.storage.from_(self.bucket_name).upload(
            path=file_path,
            file=excel_bytes,
            file_options={
                "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "upsert": "false",
            },
        )

        return response
