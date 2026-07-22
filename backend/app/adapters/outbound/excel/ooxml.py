from __future__ import annotations

import posixpath
import re
from copy import copy
from datetime import time
from io import BytesIO
from urllib.parse import unquote
from xml.etree import ElementTree
from xml.sax.saxutils import escape
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

type CellValue = time | str | None

_DOCUMENT_RELATIONSHIP_NAMESPACE = (
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
)
_PACKAGE_RELATIONSHIP_NAMESPACE = (
    "http://schemas.openxmlformats.org/package/2006/relationships"
)
_SPREADSHEET_NAMESPACE = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
_ILLEGAL_XML_CHARACTERS = re.compile(
    "[\x00-\x08\x0b\x0c\x0e-\x1f\ud800-\udfff\ufffe\uffff]"
)


def patch_workbook_cells(
    workbook_content: bytes,
    worksheet_name: str,
    cell_values: dict[str, CellValue],
) -> bytes:
    """Patch existing worksheet cells without rewriting the OOXML package.

    Excel extension elements such as x14 conditional formatting are left untouched.
    Existing cells are required so their template styles can be preserved safely.
    """
    if not cell_values:
        return workbook_content

    input_buffer = BytesIO(workbook_content)
    output_buffer = BytesIO()

    with ZipFile(input_buffer, "r") as source_archive:
        worksheet_path = _get_worksheet_path(source_archive, worksheet_name)
        worksheet_xml = source_archive.read(worksheet_path)
        patched_worksheet_xml = _patch_worksheet_xml(worksheet_xml, cell_values)

        with ZipFile(output_buffer, "w", compression=ZIP_DEFLATED) as target_archive:
            target_archive.comment = source_archive.comment

            for source_info in source_archive.infolist():
                content = (
                    patched_worksheet_xml
                    if source_info.filename == worksheet_path
                    else source_archive.read(source_info)
                )
                target_archive.writestr(_copy_zip_info(source_info), content)

    return output_buffer.getvalue()


def _get_worksheet_path(excel_archive: ZipFile, worksheet_name: str) -> str:
    workbook_root = ElementTree.fromstring(excel_archive.read("xl/workbook.xml"))
    relationships_root = ElementTree.fromstring(
        excel_archive.read("xl/_rels/workbook.xml.rels")
    )

    relationship_targets = {
        relationship.attrib["Id"]: relationship.attrib["Target"]
        for relationship in relationships_root.findall(
            f"{{{_PACKAGE_RELATIONSHIP_NAMESPACE}}}Relationship"
        )
        if relationship.attrib.get("TargetMode") != "External"
    }

    for worksheet in workbook_root.findall(
        f".//{{{_SPREADSHEET_NAMESPACE}}}sheet"
    ):
        if worksheet.attrib.get("name") != worksheet_name:
            continue

        relationship_id = worksheet.attrib[
            f"{{{_DOCUMENT_RELATIONSHIP_NAMESPACE}}}id"
        ]
        try:
            target = relationship_targets[relationship_id]
        except KeyError as error:
            raise ValueError(
                f"Das Arbeitsblatt '{worksheet_name}' hat keine interne Beziehung."
            ) from error

        worksheet_path = _normalise_relationship_target(target)
        if worksheet_path not in excel_archive.namelist():
            raise ValueError(
                f"Die XML-Datei des Arbeitsblatts '{worksheet_name}' fehlt."
            )
        return worksheet_path

    raise ValueError(f"Das Arbeitsblatt '{worksheet_name}' wurde nicht gefunden.")


def _normalise_relationship_target(target: str) -> str:
    decoded_target = unquote(target).replace("\\", "/")
    if decoded_target.startswith("/"):
        normalised_target = posixpath.normpath(decoded_target.lstrip("/"))
    else:
        normalised_target = posixpath.normpath(posixpath.join("xl", decoded_target))

    if normalised_target == ".." or normalised_target.startswith("../"):
        raise ValueError("Ungültiger Arbeitsblattpfad in der Excel-Datei.")

    return normalised_target


def _patch_worksheet_xml(
    worksheet_xml: bytes,
    cell_values: dict[str, CellValue],
) -> bytes:
    if worksheet_xml.startswith((b"\xff\xfe", b"\xfe\xff")):
        raise ValueError("UTF-16-Arbeitsblätter werden nicht unterstützt.")

    try:
        xml_text = worksheet_xml.decode("utf-8")
    except UnicodeDecodeError as error:
        raise ValueError("Das Arbeitsblatt ist nicht UTF-8-kodiert.") from error

    for coordinate, value in cell_values.items():
        xml_text = _patch_existing_cell(xml_text, coordinate, value)

    return xml_text.encode("utf-8")


def _patch_existing_cell(xml_text: str, coordinate: str, value: CellValue) -> str:
    escaped_coordinate = re.escape(coordinate)
    start_pattern = re.compile(
        rf"<(?P<prefix>[A-Za-z_][\w.-]*:)?c"
        rf"(?P<attributes>\s[^<>]*?\br=(?P<quote>['\"])"
        rf"{escaped_coordinate}(?P=quote)[^<>]*?)"
        rf"(?P<self_closing>/?)>"
    )
    matches = list(start_pattern.finditer(xml_text))

    if len(matches) != 1:
        raise ValueError(
            f"Die Vorlagenzelle '{coordinate}' wurde nicht eindeutig gefunden; "
            "ihr vorhandenes Format kann nicht sicher erhalten werden."
        )

    start_match = matches[0]
    prefix = start_match.group("prefix") or ""
    if start_match.group("self_closing"):
        element_end = start_match.end()
    else:
        end_pattern = re.compile(rf"</{re.escape(prefix)}c\s*>")
        end_match = end_pattern.search(xml_text, start_match.end())
        if end_match is None:
            raise ValueError(f"Die Vorlagenzelle '{coordinate}' ist beschädigt.")
        element_end = end_match.end()

    attributes = _without_cell_type(start_match.group("attributes"))
    replacement = _serialise_cell(prefix, attributes, value)

    return xml_text[: start_match.start()] + replacement + xml_text[element_end:]


def _without_cell_type(attributes: str) -> str:
    return re.sub(r"\s+t\s*=\s*(['\"]).*?\1", "", attributes)


def _serialise_cell(prefix: str, attributes: str, value: CellValue) -> str:
    if value is None:
        return f"<{prefix}c{attributes}/>"

    if isinstance(value, time):
        seconds = (
            value.hour * 3600
            + value.minute * 60
            + value.second
            + value.microsecond / 1_000_000
        )
        excel_value = format(seconds / 86_400, ".16g")
        return f"<{prefix}c{attributes}><{prefix}v>{excel_value}</{prefix}v></{prefix}c>"

    text = str(value)
    if _ILLEGAL_XML_CHARACTERS.search(text):
        raise ValueError("Ein Zellwert enthält in XML nicht erlaubte Steuerzeichen.")

    escaped_text = escape(text, {"\r": "&#13;"})
    return (
        f'<{prefix}c{attributes} t="inlineStr">'
        f"<{prefix}is><{prefix}t xml:space=\"preserve\">{escaped_text}"
        f"</{prefix}t></{prefix}is></{prefix}c>"
    )


def _copy_zip_info(source_info: ZipInfo) -> ZipInfo:
    copied_info = copy(source_info)
    copied_info.CRC = 0
    copied_info.compress_size = 0
    copied_info.file_size = 0
    return copied_info
