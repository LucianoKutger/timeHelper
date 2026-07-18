from datetime import datetime
from uuid import UUID

from app.agents.command_agent import build_command_agent
from app.agents.dependencies import AgentDependencies
from app.core.config import get_settings
from app.domain.models.commands import Command


class CommandService:
    async def preview(self, user_id: UUID, message: str) -> Command:
        settings = get_settings()
        now = datetime.now(settings.timezone)
        deps = AgentDependencies(
            user_id=user_id,
            now=now,
            timezone=settings.timezone,
            activity_aliases={},
        )
        result = await build_command_agent().run(message, deps=deps)
        return result.output
