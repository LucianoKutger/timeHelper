from io import BytesIO

from openpyxl import load_workbook

from app.core.models.ExcelWorkDay import ExcelWorkDayList
from app.core.models.monthly_close import GeneratedWorkbook


class ExcelWorkbookGenerator:

    def create_workbook(
        self, current_workbook: bytes, excel_workday_list: ExcelWorkDayList
    ) -> GeneratedWorkbook:
        excel_workdays = excel_workday_list.excel_list
        input_buffer = BytesIO(current_workbook)

        workbook = load_workbook(input_buffer)
        worksheet = workbook[excel_workday_list.month]

        for workday in excel_workdays:

            worksheet[f"D{workday.row}"] = workday.start_one
            worksheet[f"D{workday.row}"].number_format = "hh:mm"

            worksheet[f"E{workday.row}"] = workday.end_one
            worksheet[f"E{workday.row}"].number_format = "hh:mm"

            worksheet[f"F{workday.row}"] = workday.start_two
            worksheet[f"F{workday.row}"].number_format = "hh:mm"

            worksheet[f"G{workday.row}"] = workday.end_two
            worksheet[f"G{workday.row}"].number_format = "hh:mm"

            worksheet[f"J{workday.row}"] = workday.day_marker
            worksheet[f"O{workday.row}"] = workday.note

        output_buffer = BytesIO()
        workbook.save(output_buffer)
        workbook.close()

        output_buffer.seek(0)

        excel_bytes = output_buffer.getvalue()

        return GeneratedWorkbook(content=excel_bytes)
