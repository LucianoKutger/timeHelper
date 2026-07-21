from datetime import time
from pathlib import Path

from zipfile import ZipFile

from openpyxl import load_workbook


def print_selected_cells(
    file_name: str,
    worksheet_name: str,
    row_number: int,
) -> None:
    excel_path = Path(__file__).resolve().parent / file_name

    workbook = load_workbook(excel_path)
    worksheet = workbook[worksheet_name]

    columns = ["D", "E", "F", "G", "J", "O"]

    for column in columns:
        cell = worksheet[f"{column}{row_number}"]

        print(
            f"Zelle: {cell.coordinate}",
            f"Wert: {cell.value}",
            f"Python-Typ: {type(cell.value)}",
            f"Excel-Typ: {cell.data_type}",
            f"Format: {cell.number_format}",
            sep=" | ",
        )


def write_test_values(
    file_name: str,
    worksheet_name: str,
    row_number: int,
) -> None:
    excel_path = Path(__file__).resolve().parent / file_name

    workbook = load_workbook(excel_path)
    worksheet = workbook[worksheet_name]

    worksheet[f"J{row_number}"] = "U"

    workbook.save(excel_path)

    print(f"{file_name} wurde aktualisiert.")


def print_conditional_formatting(
    file_name: str,
    worksheet_name: str,
) -> None:
    excel_path = Path(__file__).resolve().parent / file_name

    workbook = load_workbook(excel_path)
    worksheet = workbook[worksheet_name]

    print(f"Bedingte Formatierungen in " f"'{worksheet_name}' aus '{file_name}':")

    for cell_range in worksheet.conditional_formatting:
        print(f"\nBereich: {cell_range}")

        rules = worksheet.conditional_formatting[cell_range]

        for index, rule in enumerate(rules, start=1):
            print(f"Regel {index}:")
            print(f"  Typ: {rule.type}")
            print(f"  Formel: {rule.formula}")
            print(f"  Priorität: {rule.priority}")
            print(f"  StopIfTrue: {rule.stopIfTrue}")


def inspect_excel_features(
    file_name: str,
    worksheet_name: str,
    row_number: int,
) -> None:
    excel_path = Path(__file__).resolve().parent / file_name

    workbook = load_workbook(excel_path)
    worksheet = workbook[worksheet_name]

    print(f"Datei: {file_name}")
    print(f"Arbeitsblatt: {worksheet_name}")
    print(f"Untersuchte Zeile: {row_number}")

    print("\n--- Datenüberprüfungen ---")

    for validation in worksheet.data_validations.dataValidation:
        print(f"Bereich: {validation.sqref}")
        print(f"Typ: {validation.type}")
        print(f"Formel 1: {validation.formula1}")
        print(f"Formel 2: {validation.formula2}")
        print()

    print("\n--- Zellwerte und Formatierungen ---")

    for column in range(1, 17):
        cell = worksheet.cell(
            row=row_number,
            column=column,
        )

        print(
            f"Zelle: {cell.coordinate}",
            f"Wert: {cell.value}",
            f"Style-ID: {cell.style_id}",
            f"Fill-Typ: {cell.fill.fill_type}",
            f"Vordergrundfarbe: {cell.fill.fgColor.rgb}",
            f"Hintergrundfarbe: {cell.fill.bgColor.rgb}",
            sep=" | ",
        )

    print("\n--- Bedingte Formatierungen ---")

    for cell_range in worksheet.conditional_formatting:
        print(f"Bereich: {cell_range}")

        for rule in worksheet.conditional_formatting[cell_range]:
            print(f"  Typ: {rule.type}")
            print(f"  Formel: {rule.formula}")
            print(f"  Priorität: {rule.priority}")


def inspect_excel_xml(file_name: str) -> None:
    excel_path = Path(__file__).resolve().parent / file_name

    if not excel_path.exists():
        raise FileNotFoundError(f"Die Datei wurde nicht gefunden: {excel_path}")

    search_terms = [
        "conditionalFormatting",
        "x14:conditionalFormatting",
        "extLst",
        "dataValidation",
        "x14:dataValidation",
    ]

    with ZipFile(excel_path, "r") as excel_archive:
        worksheet_files = [
            file_path
            for file_path in excel_archive.namelist()
            if file_path.startswith("xl/worksheets/sheet")
            and file_path.endswith(".xml")
        ]

        print(f"Datei: {file_name}")
        print(f"Gefundene Arbeitsblattdateien: {len(worksheet_files)}")

        for worksheet_file in worksheet_files:
            xml_content = excel_archive.read(worksheet_file).decode(
                "utf-8",
                errors="replace",
            )

            found_terms = [term for term in search_terms if term in xml_content]

            if not found_terms:
                continue

            print(f"\nArbeitsblatt-XML: {worksheet_file}")

            for term in found_terms:
                print(f"  Gefunden: {term}")

            if "x14:conditionalFormatting" in xml_content:
                print(
                    "  Hinweis: Dieses Blatt enthält eine "
                    "erweiterte x14-Formatierungsregel."
                )

            if "extLst" in xml_content:
                print("  Hinweis: Dieses Blatt enthält " "Excel-Erweiterungen.")


inspect_excel_xml(
    file_name="testExcel.xlsx",
)


# inspect_excel_features(
#    file_name="testExcel.xlsx",
#    worksheet_name="April",
#    row_number=19,
# )


# print_conditional_formatting(
#    file_name="testExcel.xlsx",
#    worksheet_name="April",
# )


# write_test_values(
#    file_name="testExcel.xlsx",
#    worksheet_name="April",
#    row_number=31,
# )


# print_selected_cells(
#    file_name="testExcel.xlsx",
#    worksheet_name="April",
#    row_number=12,
# )
