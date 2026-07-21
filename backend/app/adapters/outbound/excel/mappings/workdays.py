from app.core.models.ExcelWorkDay import ExcelValues, ExcelWorkDayList
from app.core.models.monthly_close import MonthlyClose

GERMAN_MONTH_NAMES = (
    "",
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
)


class MapWorkdayToExcel:

    def map(self, workdays: MonthlyClose) -> ExcelWorkDayList:
        excel_workday_list: list[ExcelValues] = []

        for workday in workdays.work_days:
            written_month = GERMAN_MONTH_NAMES[workday.work_date.month]
            day = workday.work_date.day
            row = day + 3
            workday_item = ExcelValues(
                row=row,
                start_one=workday.start_time_one,
                end_one=workday.end_time_one,
                start_two=workday.start_time_two,
                end_two=workday.end_time_two,
                day_marker=workday.day_marker,
                note=workday.note,
            )

            excel_workday_list.append(workday_item)

        return ExcelWorkDayList(month=written_month, excel_list=excel_workday_list)
