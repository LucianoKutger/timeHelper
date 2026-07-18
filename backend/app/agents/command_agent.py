from typing import Any, cast

from pydantic_ai import Agent, RunContext

from app.agents.dependencies import AgentDependencies
from app.agents.instructions import SYSTEM_INSTRUCTIONS
from app.core.config import get_settings
from app.domain.models.commands import Command


def runtime_context(ctx: RunContext[AgentDependencies]) -> str:
    aliases = ", ".join(f"{key} -> {value}" for key, value in ctx.deps.activity_aliases.items())
    return (
        f"Aktuelle Zeit: {ctx.deps.now.isoformat()}. "
        f"Zeitzone: {ctx.deps.timezone.key}. Aktivitätsaliase: {aliases or 'keine'}."
    )


def build_command_agent() -> Agent[AgentDependencies, Command]:
    settings = get_settings()
    if not settings.openai_chat_model:
        raise RuntimeError("OPENAI_CHAT_MODEL is not configured")

    agent = Agent(
        cast(Any, settings.openai_chat_model),
        deps_type=AgentDependencies,
        output_type=cast(Any, Command),
        instructions=[SYSTEM_INSTRUCTIONS, runtime_context],
    )
    return cast(Agent[AgentDependencies, Command], agent)
