from datetime import time
from io import BytesIO
from xml.etree import ElementTree
from zipfile import ZIP_DEFLATED, ZipFile

import pytest

from app.adapters.outbound.excel.generators.monthly_workbook import (
    ExcelWorkbookGenerator,
)
from app.core.models.Enums import DayMarker
from app.core.models.ExcelWorkDay import ExcelValues, ExcelWorkDayList

MAIN_NAMESPACE = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
X14_NAMESPACE = "http://schemas.microsoft.com/office/spreadsheetml/2009/9/main"


def test_generator_changes_only_target_worksheet_cells() -> None:
    original_workbook = _create_test_workbook()
    workdays = ExcelWorkDayList(
        month="April",
        excel_list=[
            ExcelValues(
                row=4,
                start_one=time(8, 30),
                end_one=time(12),
                start_two=None,
                end_two=time(16, 45),
                day_marker=DayMarker.VACATION,
                note=" Arzt & Termin\r\n",
            )
        ],
    )

    generated = ExcelWorkbookGenerator().create_workbook(original_workbook, workdays)

    with ZipFile(BytesIO(original_workbook)) as original_archive:
        with ZipFile(BytesIO(generated.content)) as generated_archive:
            assert generated_archive.namelist() == original_archive.namelist()

            for name in original_archive.namelist():
                if name != "xl/worksheets/sheet6.xml":
                    assert generated_archive.read(name) == original_archive.read(name)

            original_sheet = original_archive.read("xl/worksheets/sheet6.xml")
            generated_sheet = generated_archive.read("xl/worksheets/sheet6.xml")

    original_extension = original_sheet[original_sheet.index(b"<extLst") :]
    generated_extension = generated_sheet[generated_sheet.index(b"<extLst") :]
    assert generated_extension == original_extension

    root = ElementTree.fromstring(generated_sheet)
    cells = {
        cell.attrib["r"]: cell
        for cell in root.findall(f".//{{{MAIN_NAMESPACE}}}c")
    }

    assert cells["D4"].attrib["s"] == "327"
    assert float(_cell_value(cells["D4"])) == pytest.approx(8.5 / 24)
    assert float(_cell_value(cells["E4"])) == pytest.approx(12 / 24)
    assert _cell_value(cells["F4"]) is None
    assert float(_cell_value(cells["G4"])) == pytest.approx(16.75 / 24)
    assert _cell_value(cells["J4"]) == "U"
    assert _cell_value(cells["O4"]) == " Arzt & Termin\r\n"

    x14_rules = root.findall(f".//{{{X14_NAMESPACE}}}cfRule")
    assert len(x14_rules) == 1
    assert x14_rules[0].attrib["id"] == "{D026FD98-A441-4E34-8AA8-5171D6369057}"


def test_generator_rejects_missing_template_cell() -> None:
    workdays = ExcelWorkDayList(
        month="April",
        excel_list=[ExcelValues(row=5, start_one=time(8))],
    )

    with pytest.raises(ValueError, match="D5"):
        ExcelWorkbookGenerator().create_workbook(_create_test_workbook(), workdays)


def _cell_value(cell: ElementTree.Element) -> str | None:
    value = cell.find(f"{{{MAIN_NAMESPACE}}}v")
    if value is not None:
        return value.text

    inline_text = cell.find(
        f"{{{MAIN_NAMESPACE}}}is/{{{MAIN_NAMESPACE}}}t"
    )
    return inline_text.text if inline_text is not None else None


def _create_test_workbook() -> bytes:
    workbook_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="{MAIN_NAMESPACE}"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
 <sheets><sheet name="April" sheetId="1" r:id="rId6"/></sheets>
</workbook>"""
    relationships_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
 <Relationship Id="rId6"
  Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"
  Target="worksheets/sheet6.xml"/>
</Relationships>"""
    worksheet_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="{MAIN_NAMESPACE}">
 <sheetData><row r="4">
  <c r="D4" s="327"><v>0</v></c><c r="E4" s="327"><v>0</v></c>
  <c r="F4" s="327"><v>0</v></c><c r="G4" s="327"><v>0</v></c>
  <c r="J4" s="301" t="s"><v>1</v></c><c r="O4" s="304"/>
 </row></sheetData>
 <extLst><ext uri="{{78C0D931-6437-407d-A8EE-F0AAD7539E65}}"
  xmlns:x14="{X14_NAMESPACE}">
  <x14:conditionalFormattings><x14:conditionalFormatting
   xmlns:xm="http://schemas.microsoft.com/office/excel/2006/main">
   <x14:cfRule type="expression" priority="1"
    id="{{D026FD98-A441-4E34-8AA8-5171D6369057}}">
    <xm:f>$J4=Voreinstellungen!$B$25</xm:f>
   </x14:cfRule>
  </x14:conditionalFormatting></x14:conditionalFormattings>
 </ext></extLst>
</worksheet>"""

    output = BytesIO()
    with ZipFile(output, "w", compression=ZIP_DEFLATED) as archive:
        archive.comment = b"template-comment"
        archive.writestr("xl/workbook.xml", workbook_xml)
        archive.writestr("xl/_rels/workbook.xml.rels", relationships_xml)
        archive.writestr("xl/worksheets/sheet6.xml", worksheet_xml)
        archive.writestr("xl/styles.xml", b"styles-must-not-change")
        archive.writestr("customXml/item1.xml", b"custom-data-must-not-change")

    return output.getvalue()
