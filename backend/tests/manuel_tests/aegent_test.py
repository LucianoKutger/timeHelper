from datetime import date, datetime
from app.adapters.outbound.pydantic_ai.agents.workday import workday_agent

from app.adapters.outbound.pydantic_ai.prompts.workday import (
    build_workday_user_prompt,
)

prompt = build_workday_user_prompt(
    message="15.06 15 - 18 Uhr Aktionstag in der Pestalozzi schule",
    current_date=date.today(),
)

result = workday_agent.run_sync(prompt)
workday = result.output
usage = result.usage

print(workday)
print(usage)
