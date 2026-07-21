from pathlib import Path
from xml.etree import ElementTree
from zipfile import ZipFile

RELATIONSHIP_ID_NAMESPACE = (
    "http://schemas.openxmlformats.org/" "officeDocument/2006/relationships"
)

PACKAGE_RELATIONSHIP_NAMESPACE = (
    "http://schemas.openxmlformats.org/" "package/2006/relationships"
)

SPREADSHEET_NAMESPACE = "http://schemas.openxmlformats.org/" "spreadsheetml/2006/main"

X14_NAMESPACE = "http://schemas.microsoft.com/" "office/spreadsheetml/2009/9/main"


def get_local_name(tag: str) -> str:
    return tag.split("}")[-1]


def get_worksheet_xml_path(
    excel_archive: ZipFile,
    worksheet_name: str,
) -> str:
    workbook_xml = excel_archive.read("xl/workbook.xml")
    workbook_root = ElementTree.fromstring(workbook_xml)

    relationships_xml = excel_archive.read("xl/_rels/workbook.xml.rels")
    relationships_root = ElementTree.fromstring(relationships_xml)

    relationship_targets = {}

    for relationship in relationships_root.findall(
        f"{{{PACKAGE_RELATIONSHIP_NAMESPACE}}}Relationship"
    ):
        relationship_id = relationship.attrib["Id"]
        target = relationship.attrib["Target"]

        relationship_targets[relationship_id] = target

    for sheet in workbook_root.findall(f".//{{{SPREADSHEET_NAMESPACE}}}sheet"):
        if sheet.attrib.get("name") != worksheet_name:
            continue

        relationship_id = sheet.attrib[f"{{{RELATIONSHIP_ID_NAMESPACE}}}id"]

        target = relationship_targets[relationship_id]
        target = target.lstrip("/")

        if not target.startswith("xl/"):
            target = f"xl/{target}"

        return target

    raise ValueError(f"Das Arbeitsblatt '{worksheet_name}' wurde nicht gefunden.")


def print_x14_conditional_formatting(
    file_name: str,
    worksheet_name: str,
) -> None:
    excel_path = Path(__file__).resolve().parent / file_name

    if not excel_path.exists():
        raise FileNotFoundError(f"Die Excel-Datei wurde nicht gefunden: {excel_path}")

    with ZipFile(excel_path, "r") as excel_archive:
        worksheet_xml_path = get_worksheet_xml_path(
            excel_archive=excel_archive,
            worksheet_name=worksheet_name,
        )

        worksheet_xml = excel_archive.read(worksheet_xml_path)
        worksheet_root = ElementTree.fromstring(worksheet_xml)

        conditional_formatting_elements = worksheet_root.findall(
            f".//{{{X14_NAMESPACE}}}" "conditionalFormatting"
        )

        print(f"Datei: {file_name}")
        print(f"Arbeitsblatt: {worksheet_name}")
        print(f"XML-Datei: {worksheet_xml_path}")
        print(
            "Anzahl erweiterter Formatierungsbereiche: "
            f"{len(conditional_formatting_elements)}"
        )

        for formatting_index, formatting in enumerate(
            conditional_formatting_elements,
            start=1,
        ):
            print(f"\n--- Erweiterter Bereich " f"{formatting_index} ---")

            ranges = []
            formulas = []

            for element in formatting.iter():
                local_name = get_local_name(element.tag)

                if local_name == "sqref" and element.text is not None:
                    ranges.append(element.text)

                if local_name in {"f", "formula"} and element.text is not None:
                    formulas.append(element.text)

            print(
                "Bereich:",
                ", ".join(ranges) if ranges else "Nicht gefunden",
            )

            rules = formatting.findall(f".//{{{X14_NAMESPACE}}}cfRule")

            for rule_index, rule in enumerate(
                rules,
                start=1,
            ):
                print(f"\nRegel {rule_index}:")
                print(f"  Typ: {rule.attrib.get('type')}")
                print("  Priorität: " f"{rule.attrib.get('priority')}")
                print(f"  ID: {rule.attrib.get('id')}")
                print(f"  dxfId: {rule.attrib.get('dxfId')}")

                rule_formulas = []

                for element in rule.iter():
                    local_name = get_local_name(element.tag)

                    if local_name in {"f", "formula"} and element.text is not None:
                        rule_formulas.append(element.text)

                print(
                    "  Formeln:",
                    rule_formulas if rule_formulas else "Keine Formel gefunden",
                )

            if formulas:
                print(f"\nAlle Formeln des Bereichs: {formulas}")


print_x14_conditional_formatting(
    file_name="testExcel.xlsx",
    worksheet_name="April",
)
