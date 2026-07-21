from datetime import date

from pydantic import ValidationError
from pydantic_ai.exceptions import AgentRunError

from app.adapters.outbound.pydantic_ai.agents.workday import workday_agent
from app.adapters.outbound.pydantic_ai.prompts.workday import build_workday_user_prompt
from app.core.models.workday import WorkDayCreate


class WorkDayInterpretationError(RuntimeError):
    """Raised when a message cannot be converted into a work day."""


class PydanticWorkDayInterpreter:
    def interpret_work_day(self, message: str, current_date: date) -> WorkDayCreate:
        prompt = build_workday_user_prompt(message, current_date)

        try:
            result = workday_agent.run_sync(prompt)
            output = result.output.model_dump()

            return WorkDayCreate.model_validate(output)
        except (AgentRunError, ValidationError) as error:
            raise WorkDayInterpretationError(
                f"Die Nachricht konnte nicht als Arbeitstag interpretiert werden: {error.message}"
            ) from error
