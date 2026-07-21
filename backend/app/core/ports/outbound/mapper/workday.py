from app.core.models.ExcelWorkDay import ExcelWorkDayList
from app.core.models.monthly_close import MonthlyClose


class MapWorkday:
    def map(self, workdays: MonthlyClose) -> ExcelWorkDayList: ...
