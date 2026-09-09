from uuid import UUID

from app.broker.backend_rpc import BackendRpcClient
from app.schemas.backend import BackendResponse


class OfferTools:
    def __init__(self, rpc: BackendRpcClient) -> None:
        self._rpc = rpc

    async def calculate_offer(
        self,
        deal_id: UUID,
        discount_percent: int | float,
    ) -> BackendResponse:
        return await self._rpc.call(
            routing_key="backend.offer.calculate",
            action="offer.calculate",
            payload={
                "deal_id": str(deal_id),
                "discount_percent": discount_percent,
            },
        )

    async def get_offer(self, offer_id: UUID) -> BackendResponse:
        return await self._rpc.call(
            routing_key="backend.offer.get",
            action="offer.get",
            payload={"offer_id": str(offer_id)},
        )

    async def create_offer(
        self,
        deal_id: UUID,
        created_by: UUID,
        discount_percent: int | float,
        generated_text: str,
    ) -> BackendResponse:
        return await self._rpc.call(
            routing_key="backend.offer.create",
            action="offer.create",
            payload={
                "deal_id": str(deal_id),
                "created_by": str(created_by),
                "discount_percent": discount_percent,
                "generated_text": generated_text,
            },
        )

    async def request_offer_approval(
        self,
        offer_id: UUID,
        requested_by: UUID,
        reason: str,
    ) -> BackendResponse:
        return await self._rpc.call(
            routing_key="backend.offer.request_approval",
            action="offer.request_approval",
            payload={
                "offer_id": str(offer_id),
                "requested_by": str(requested_by),
                "reason": reason,
            },
        )

    async def generate_offer_pdf(self, offer_id: UUID) -> BackendResponse:
        return await self._rpc.call(
            routing_key="backend.offer.generate_pdf",
            action="offer.generate_pdf",
            payload={"offer_id": str(offer_id)},
        )
