from dataclasses import dataclass
from datetime import datetime
from uuid import UUID
from zoneinfo import ZoneInfo


@dataclass(frozen=True)
class AgentDependencies:
    user_id: UUID
    now: datetime
    timezone: ZoneInfo
    activity_aliases: dict[str, str]
