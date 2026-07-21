from datetime import date

from app.core.ports.outbound.interpreters.workday import WorkDayInterpreter
from app.core.ports.outbound.repositories.workdays import WorkdayRepository


class CreateWorkDayFormMessage:
    def __init__(
        self, interpreter: WorkDayInterpreter, repository: WorkdayRepository
    ) -> None:
        self.interpreter = interpreter
        self.repository = repository

    def execute_workday(self, message: str, current_date: date):

        workday_instance = self.interpreter.interpret_work_day(message, current_date)

        workday = self.repository.create_workday(workday_instance)

        return workday
