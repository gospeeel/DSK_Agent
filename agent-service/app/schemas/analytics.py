from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.negotiation import ApartmentFacts, BuildingFacts, DealFacts


class ConstructionEventFacts(BaseModel):
    model_config = ConfigDict(extra="ignore")

    type: str = Field(min_length=1)
    title: str = Field(min_length=1)
    risk_level: str = Field(min_length=1)
    delay_days: int | None = Field(default=None, ge=0)


class ConstructionEventsData(BaseModel):
    model_config = ConfigDict(extra="ignore")

    events: list[ConstructionEventFacts]


class AnalyticsContext(BaseModel):
    model_config = ConfigDict(extra="forbid")

    deal: DealFacts
    apartment: ApartmentFacts
    building: BuildingFacts
    construction_events: list[ConstructionEventFacts]


class AffectedDeal(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: UUID
    status: Literal["active", "closed", "cancelled"]


class AffectedDealsData(BaseModel):
    model_config = ConfigDict(extra="ignore")

    deals: list[AffectedDeal]


class ConstructionDelayContext(BaseModel):
    model_config = ConfigDict(extra="forbid")

    deal: DealFacts
    building_id: UUID
    delay_days: int = Field(ge=1)
    risk_level: Literal["low", "medium", "high"]


class RecommendationCreatedData(BaseModel):
    model_config = ConfigDict(extra="ignore")

    recommendation_id: UUID
    created: bool
