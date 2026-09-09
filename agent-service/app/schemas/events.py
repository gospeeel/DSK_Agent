from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class OfferApprovedPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    offer_id: UUID
    deal_id: UUID


class OfferRejectedPayload(OfferApprovedPayload):
    reason: str = Field(min_length=1)


class OfferApprovedEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")

    event_id: UUID
    event_type: Literal["offer.approved"]
    occurred_at: datetime
    payload: OfferApprovedPayload


class OfferRejectedEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")

    event_id: UUID
    event_type: Literal["offer.rejected"]
    occurred_at: datetime
    payload: OfferRejectedPayload


class ConstructionDelayPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    building_id: UUID
    delay_days: int = Field(ge=1)
    risk_level: Literal["low", "medium", "high"]


class ConstructionDelayDetectedEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")

    event_id: UUID
    event_type: Literal["construction.delay_detected"]
    occurred_at: datetime
    payload: ConstructionDelayPayload
