from dataclasses import dataclass
from pathlib import Path

from openpyxl import load_workbook


@dataclass(frozen=True)
class ExcelMapping:
    date_column: str = "A"
    start_time_1: str = "D"
    end_time_1: str = "E"
    start_time_2: str = "F"
    end_time_2: str = "G"
    break_minutes: str = "H"
    day_code: str = "J"
    note: str = "O"


class ExcelService:
    def validate_template(self, template_path: Path, sheet_name: str) -> None:
        workbook = load_workbook(template_path, read_only=False, data_only=False)
        if sheet_name not in workbook.sheetnames:
            raise ValueError(f"Worksheet {sheet_name!r} fehlt in der Vorlage")
