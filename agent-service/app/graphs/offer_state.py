from typing import Literal, TypedDict
from uuid import UUID

from app.schemas.negotiation import ApartmentFacts, DealFacts
from app.schemas.offer import OfferCalculation, OfferClientFacts


ApprovalStatus = Literal["not_required", "waiting"]


class OfferState(TypedDict, total=False):
    user_id: UUID
    deal_id: UUID
    message: str
    intent: Literal["create_offer", "calculate_offer"]
    discount_percent: int | float
    deal: DealFacts
    client: OfferClientFacts
    apartment: ApartmentFacts
    calculation: OfferCalculation
    generated_text: str
    offer_id: UUID
    approval_required: bool
    approval_status: ApprovalStatus
    error: str
    result_message: str
