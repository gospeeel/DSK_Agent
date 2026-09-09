from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class DealFacts(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: UUID
    client_id: UUID | None = None
    apartment_id: UUID
    stage: str | None = None
    next_action: str | None = None


class ApartmentFacts(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: UUID
    building_id: UUID
    number: str | None = None
    floor: int | None = None
    rooms: int | None = None
    area: float | None = None
    price: int | None = None
    status: str | None = None


class BuildingFacts(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: UUID
    name: str | None = None
    district: str = Field(min_length=1)
    readiness_percent: int | None = Field(default=None, ge=0, le=100)
    planned_delivery: str | None = None
    forecast_delivery: str | None = None


class CompetitorFacts(BaseModel):
    model_config = ConfigDict(extra="ignore")

    project_name: str
    district: str
    price_per_sqm: int | None = None
    advantages: str | None = None
    disadvantages: str | None = None


class CompetitorListData(BaseModel):
    model_config = ConfigDict(extra="ignore")

    competitors: list[CompetitorFacts]


class NegotiationContext(BaseModel):
    model_config = ConfigDict(extra="forbid")

    deal: DealFacts
    apartment: ApartmentFacts
    building: BuildingFacts
    competitors: list[CompetitorFacts]


def require_backend_data(data: dict[str, Any] | None) -> dict[str, Any]:
    if data is None:
        raise ValueError("backend response does not contain data")
    return data
