class ReportService:
    """Coordinates database reads, workbook generation, storage and artifact metadata."""

    async def create_monthly_report(self, *, user_id: str, year: int, month: int) -> None:
        raise NotImplementedError("Monthly report orchestration is implemented in phase 4")
