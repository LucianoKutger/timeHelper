from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIResponsesModel
from pydantic_ai.providers.openai import OpenAIProvider

from app.adapters.outbound.pydantic_ai.models.workday import WorkDayAgentOutput
from app.adapters.outbound.pydantic_ai.prompts.workday import WORKDAY_SYSTEM_PROMPT


from app.config.settings import get_settings

settings = get_settings()

openai_provider = OpenAIProvider(
    api_key=settings.openai_api_key.get_secret_value(),
)

openai_model = OpenAIResponsesModel(
    model_name=settings.openai_chat_model,
    provider=openai_provider,
)


workday_agent = Agent(
    model=openai_model,
    output_type=WorkDayAgentOutput,
    instructions=WORKDAY_SYSTEM_PROMPT,
)
