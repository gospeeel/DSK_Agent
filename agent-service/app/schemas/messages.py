from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ChatPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    user_id: UUID
    session_id: UUID
    deal_id: UUID | None = None
    message: str = Field(min_length=1)


class AgentRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    request_id: UUID
    action: Literal["chat"]
    payload: ChatPayload
