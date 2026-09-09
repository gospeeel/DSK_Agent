from typing import Literal
from uuid import UUID

from app.graphs.offer_graph import (
    BACKEND_DATA_ERROR_RESPONSE,
    OFFER_SAVE_ERROR_RESPONSE,
    OFFER_SYSTEM_PROMPT,
    OfferGraph,
    OfferLlmClient,
)
from app.graphs.offer_state import OfferState
from app.tools.apartment import ApartmentTools
from app.tools.client import ClientTools
from app.tools.deal import DealTools
from app.tools.offer import OfferTools

OfferIntent = Literal["create_offer", "calculate_offer"]

DEFAULT_DISCOUNT_PERCENT = 0
MISSING_DEAL_RESPONSE = "Для формирования предложения необходимо выбрать или передать сделку."


class OfferAgent:
    def __init__(
        self,
        llm: OfferLlmClient,
        deal_tools: DealTools,
        client_tools: ClientTools,
        apartment_tools: ApartmentTools,
        offer_tools: OfferTools,
    ) -> None:
        self._graph = OfferGraph(
            llm,
            deal_tools,
            client_tools,
            apartment_tools,
            offer_tools,
        )

    async def generate(
        self,
        message: str,
        intent: OfferIntent,
        deal_id: UUID | None,
        user_id: UUID,
    ) -> str:
        if intent not in ("create_offer", "calculate_offer"):
            raise ValueError(f"Unsupported offer intent: {intent}")
        if deal_id is None:
            return MISSING_DEAL_RESPONSE

        initial_state: OfferState = {
            "user_id": user_id,
            "deal_id": deal_id,
            "message": message,
            "intent": intent,
            "discount_percent": DEFAULT_DISCOUNT_PERCENT,
            "approval_required": False,
        }
        result = await self._graph.run(initial_state)
        return result["result_message"]
