from datetime import date, time

from app.domain.models.commands import UpsertWorkDay


def test_upsert_work_day_accepts_complete_block() -> None:
    command = UpsertWorkDay(
        action="upsert_work_day",
        work_date=date(2026, 6, 27),
        start_time_1=time(15, 0),
        end_time_1=time(18, 0),
        note="BasKIDball",
    )
    assert command.break_minutes == 0
