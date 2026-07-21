from datetime import date

import pytest
from pydantic import ValidationError

from app.adapters.outbound.pydantic_ai.models.workday import WorkDayAgentOutput
from app.core.models.Enums import DayMarker


@pytest.mark.parametrize("day_marker", [DayMarker.VACATION, DayMarker.SICK])
def test_day_marker_is_valid_without_work_times(day_marker: DayMarker) -> None:
    output = WorkDayAgentOutput(work_date=date(2026, 6, 10), day_marker=day_marker)

    assert output.day_marker == day_marker
    assert output.start_time_one is None
    assert output.end_time_one is None


def test_empty_note_is_not_valid_without_work_times() -> None:
    with pytest.raises(ValidationError):
        WorkDayAgentOutput(work_date=date(2026, 6, 10), note="   ")


def test_day_marker_is_not_valid_with_work_times() -> None:
    with pytest.raises(ValidationError):
        WorkDayAgentOutput(
            work_date=date(2026, 6, 10),
            start_time_one="08:00",
            end_time_one="16:00",
            day_marker=DayMarker.VACATION,
        )
