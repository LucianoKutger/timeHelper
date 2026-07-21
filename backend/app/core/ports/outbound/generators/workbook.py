from typing import Protocol

from app.core.models.ExcelWorkDay import ExcelWorkDayList
from app.core.models.monthly_close import GeneratedWorkbook


class WorkbookGenerator(Protocol):
    def create_workbook(
        self, current_workbook: bytes, excel_workday_list: ExcelWorkDayList
    ) -> GeneratedWorkbook: ...
