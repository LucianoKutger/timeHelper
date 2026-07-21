from datetime import date, time
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.core.models.Enums import DayMarker


class WorkDayAgentOutput(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    work_date: date = Field(
        description=(
            "Datum des beschriebenen Arbeitstags. Wenn kein Jahr genannt wird, "
            "verwende das Jahr aus dem aktuellen Laufzeitkontext."
        ),
    )

    start_time_one: time | None = Field(
        default=None,
        description=(
            "Startzeit des ersten Arbeitsblocks. "
            "Null, wenn kein erster Arbeitsblock angegeben wurde."
        ),
    )

    end_time_one: time | None = Field(
        default=None,
        description=(
            "Endzeit des ersten Arbeitsblocks. "
            "Null, wenn kein erster Arbeitsblock angegeben wurde."
        ),
    )

    start_time_two: time | None = Field(
        default=None,
        description=(
            "Startzeit des optionalen zweiten Arbeitsblocks. "
            "Null, wenn kein zweiter Arbeitsblock angegeben wurde."
        ),
    )

    end_time_two: time | None = Field(
        default=None,
        description=(
            "Endzeit des optionalen zweiten Arbeitsblocks. "
            "Null, wenn kein zweiter Arbeitsblock angegeben wurde."
        ),
    )

    day_marker: DayMarker | None = Field(
        default=None,
        description=(
            "Tagesmarker für Krankheit oder Urlaub. "
            "K für Krankheit, U für Urlaub. "
            "Null, wenn kein entsprechender Tagesmarker genannt wurde."
        ),
    )

    note: str | None = Field(
        default=None,
        min_length=1,
        max_length=500,
        description=(
            "Beschreibung oder Grund der Tätigkeit, zum Beispiel BasKidball. "
            "Null, wenn keine Beschreibung genannt wurde."
        ),
    )

    @model_validator(mode="after")
    def validate_work_blocks(self) -> Self:
        work_blocks = (
            (self.start_time_one, self.end_time_one, "erster"),
            (self.start_time_two, self.end_time_two, "zweiter"),
        )

        for start_time, end_time, block_name in work_blocks:
            if (start_time is None) != (end_time is None):
                raise ValueError(
                    f"Der {block_name} Arbeitsblock benötigt Start- und Endzeit."
                )

            if (
                start_time is not None
                and end_time is not None
                and end_time <= start_time
            ):
                raise ValueError(
                    f"Beim {block_name} Arbeitsblock muss das Ende "
                    "nach dem Beginn liegen."
                )

        if self.start_time_two is not None and self.start_time_one is None:
            raise ValueError(
                "Ein zweiter Arbeitsblock ist ohne ersten Arbeitsblock nicht erlaubt."
            )

        if (
            self.end_time_one is not None
            and self.start_time_two is not None
            and self.start_time_two < self.end_time_one
        ):
            raise ValueError(
                "Der zweite Arbeitsblock darf nicht vor dem Ende "
                "des ersten Arbeitsblocks beginnen."
            )

        if self.start_time_one is None and self.day_marker is None:
            raise ValueError(
                "Es muss mindestens ein Arbeitsblock oder ein Tagesmarker vorhanden sein."
            )

        if self.day_marker is not None and any(
            work_time is not None
            for work_time in (
                self.start_time_one,
                self.end_time_one,
                self.start_time_two,
                self.end_time_two,
            )
        ):
            raise ValueError(
                "Ein Tagesmarker und Arbeitszeiten dürfen nicht gleichzeitig gesetzt sein."
            )

        return self
