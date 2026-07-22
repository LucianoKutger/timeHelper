from app.adapters.outbound.excel.ooxml import CellValue, patch_workbook_cells
from app.core.models.ExcelWorkDay import ExcelWorkDayList
from app.core.models.monthly_close import GeneratedWorkbook


class ExcelWorkbookGenerator:

    def create_workbook(
        self, current_workbook: bytes, excel_workday_list: ExcelWorkDayList
    ) -> GeneratedWorkbook:
        cell_values: dict[str, CellValue] = {}

        for workday in excel_workday_list.excel_list:
            cell_values.update(
                {
                    f"D{workday.row}": workday.start_one,
                    f"E{workday.row}": workday.end_one,
                    f"F{workday.row}": workday.start_two,
                    f"G{workday.row}": workday.end_two,
                    f"J{workday.row}": workday.day_marker,
                    f"O{workday.row}": workday.note,
                }
            )

        excel_bytes = patch_workbook_cells(
            workbook_content=current_workbook,
            worksheet_name=excel_workday_list.month,
            cell_values=cell_values,
        )
        return GeneratedWorkbook(content=excel_bytes)
