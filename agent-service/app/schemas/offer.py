from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.negotiation import ApartmentFacts, DealFacts


class OfferClientFacts(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: UUID
    full_name: str | None = None
    budget_max: int | None = Field(default=None, ge=0)
    preferences: dict[str, Any] = Field(default_factory=dict)


class OfferCalculation(BaseModel):
    model_config = ConfigDict(extra="ignore")

    base_price: int = Field(ge=0)
    discount_percent: float = Field(ge=0)
    discount_amount: int = Field(ge=0)
    total_price: int = Field(ge=0)
    max_manager_discount: float = Field(ge=0)
    requires_approval: bool


class OfferContext(BaseModel):
    model_config = ConfigDict(extra="forbid")

    deal: DealFacts
    client: OfferClientFacts
    apartment: ApartmentFacts
    calculation: OfferCalculation


class OfferCreatedData(BaseModel):
    model_config = ConfigDict(extra="ignore")

    offer_id: UUID
    status: str = Field(min_length=1)


class OfferApprovalData(BaseModel):
    model_config = ConfigDict(extra="ignore")

    offer_id: UUID
    status: str = Field(min_length=1)


class OfferLookupData(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: UUID
    deal_id: UUID
    status: Literal["pending_approval", "approved", "rejected"]


class OfferPdfData(BaseModel):
    model_config = ConfigDict(extra="ignore")

    offer_id: UUID
    document_url: str = Field(min_length=1)
