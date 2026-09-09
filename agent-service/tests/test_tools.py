from unittest.mock import AsyncMock, Mock
from uuid import UUID, uuid4

import pytest

from app.schemas.backend import BackendResponse
from app.tools.apartment import ApartmentTools
from app.tools.building import BuildingTools
from app.tools.client import ClientTools
from app.tools.competitor import CompetitorTools
from app.tools.construction import ConstructionTools
from app.tools.deal import DealTools
from app.tools.messages import MessagesTools
from app.tools.offer import OfferTools
from app.tools.recommendation import RecommendationTools


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("tool_class", "method_name", "argument", "routing_key", "action", "payload"),
    [
        (
            DealTools,
            "get_deal",
            UUID("11111111-1111-1111-1111-111111111111"),
            "backend.deal.get",
            "deal.get",
            {"deal_id": "11111111-1111-1111-1111-111111111111"},
        ),
        (
            ApartmentTools,
            "get_apartment",
            UUID("22222222-2222-2222-2222-222222222222"),
            "backend.apartment.get",
            "apartment.get",
            {"apartment_id": "22222222-2222-2222-2222-222222222222"},
        ),
        (
            BuildingTools,
            "get_building",
            UUID("33333333-3333-3333-3333-333333333333"),
            "backend.building.get",
            "building.get",
            {"building_id": "33333333-3333-3333-3333-333333333333"},
        ),
        (
            CompetitorTools,
            "list_competitors",
            "Центральный",
            "backend.competitor.list",
            "competitor.list",
            {"district": "Центральный"},
        ),
        (
            ConstructionTools,
            "get_construction_events",
            UUID("33333333-3333-3333-3333-333333333333"),
            "backend.construction.events.get",
            "construction.events.get",
            {"building_id": "33333333-3333-3333-3333-333333333333"},
        ),
        (
            MessagesTools,
            "get_deal_messages",
            UUID("11111111-1111-1111-1111-111111111111"),
            "backend.deal.messages.get",
            "deal.messages.get",
            {
                "deal_id": "11111111-1111-1111-1111-111111111111",
                "limit": 30,
            },
        ),
    ],
)
async def test_tool_uses_contract_routing_key_and_action(
    tool_class: type,
    method_name: str,
    argument: object,
    routing_key: str,
    action: str,
    payload: dict[str, str],
) -> None:
    expected = BackendResponse(
        request_id=uuid4(),
        success=True,
        data={"result": "ok"},
        error=None,
    )
    rpc = Mock(call=AsyncMock(return_value=expected))
    tool = tool_class(rpc)

    result = await getattr(tool, method_name)(argument)

    assert result == expected
    rpc.call.assert_awaited_once_with(
        routing_key=routing_key,
        action=action,
        payload=payload,
    )


@pytest.mark.asyncio
async def test_client_preferences_tool_uses_contract_payload() -> None:
    expected = BackendResponse(
        request_id=uuid4(),
        success=True,
        data={"updated": True},
        error=None,
    )
    rpc = Mock(call=AsyncMock(return_value=expected))
    tool = ClientTools(rpc)
    client_id = UUID("11111111-1111-1111-1111-111111111111")

    result = await tool.update_client_preferences(
        client_id,
        preferences={"rooms": 2, "floor_min": 7, "parking": True},
        budget_max=15_000_000,
    )

    assert result == expected
    rpc.call.assert_awaited_once_with(
        routing_key="backend.client.update_preferences",
        action="client.update_preferences",
        payload={
            "client_id": str(client_id),
            "preferences": {"rooms": 2, "floor_min": 7, "parking": True},
            "budget_max": 15_000_000,
        },
    )


@pytest.mark.asyncio
async def test_client_preferences_tool_omits_null_budget() -> None:
    rpc = Mock(call=AsyncMock(return_value=Mock()))
    tool = ClientTools(rpc)
    client_id = UUID("11111111-1111-1111-1111-111111111111")

    await tool.update_client_preferences(
        client_id,
        preferences={"rooms": 2},
    )

    payload = rpc.call.await_args.kwargs["payload"]
    assert payload == {
        "client_id": str(client_id),
        "preferences": {"rooms": 2},
    }
    assert "budget_max" not in payload


@pytest.mark.asyncio
async def test_get_client_uses_contract_routing_key_and_action() -> None:
    rpc = Mock(call=AsyncMock(return_value=Mock()))
    tool = ClientTools(rpc)
    client_id = UUID("11111111-1111-1111-1111-111111111111")

    await tool.get_client(client_id)

    rpc.call.assert_awaited_once_with(
        routing_key="backend.client.get",
        action="client.get",
        payload={"client_id": str(client_id)},
    )


@pytest.mark.asyncio
async def test_calculate_offer_uses_contract_routing_key_and_action() -> None:
    rpc = Mock(call=AsyncMock(return_value=Mock()))
    tool = OfferTools(rpc)
    deal_id = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")

    await tool.calculate_offer(deal_id, 3)

    rpc.call.assert_awaited_once_with(
        routing_key="backend.offer.calculate",
        action="offer.calculate",
        payload={"deal_id": str(deal_id), "discount_percent": 3},
    )


@pytest.mark.asyncio
async def test_create_offer_uses_contract_routing_key_and_action() -> None:
    rpc = Mock(call=AsyncMock(return_value=Mock()))
    tool = OfferTools(rpc)
    deal_id = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
    user_id = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")

    await tool.create_offer(deal_id, user_id, 3, "Текст КП")

    rpc.call.assert_awaited_once_with(
        routing_key="backend.offer.create",
        action="offer.create",
        payload={
            "deal_id": str(deal_id),
            "created_by": str(user_id),
            "discount_percent": 3,
            "generated_text": "Текст КП",
        },
    )


@pytest.mark.asyncio
async def test_request_offer_approval_uses_contract_routing_key_and_action() -> None:
    rpc = Mock(call=AsyncMock(return_value=Mock()))
    tool = OfferTools(rpc)
    offer_id = UUID("88888888-8888-8888-8888-888888888888")
    user_id = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")

    await tool.request_offer_approval(
        offer_id,
        user_id,
        "Запрошенная скидка превышает лимит менеджера",
    )

    rpc.call.assert_awaited_once_with(
        routing_key="backend.offer.request_approval",
        action="offer.request_approval",
        payload={
            "offer_id": str(offer_id),
            "requested_by": str(user_id),
            "reason": "Запрошенная скидка превышает лимит менеджера",
        },
    )


@pytest.mark.asyncio
async def test_get_offer_uses_contract_routing_key_and_action() -> None:
    rpc = Mock(call=AsyncMock(return_value=Mock()))
    tool = OfferTools(rpc)
    offer_id = UUID("88888888-8888-8888-8888-888888888888")

    await tool.get_offer(offer_id)

    rpc.call.assert_awaited_once_with(
        routing_key="backend.offer.get",
        action="offer.get",
        payload={"offer_id": str(offer_id)},
    )


@pytest.mark.asyncio
async def test_generate_offer_pdf_uses_contract_routing_key_and_action() -> None:
    rpc = Mock(call=AsyncMock(return_value=Mock()))
    tool = OfferTools(rpc)
    offer_id = UUID("88888888-8888-8888-8888-888888888888")

    await tool.generate_offer_pdf(offer_id)

    rpc.call.assert_awaited_once_with(
        routing_key="backend.offer.generate_pdf",
        action="offer.generate_pdf",
        payload={"offer_id": str(offer_id)},
    )


@pytest.mark.asyncio
async def test_list_deals_by_building_uses_contract_routing_key_and_action() -> None:
    rpc = Mock(call=AsyncMock(return_value=Mock()))
    tool = DealTools(rpc)
    building_id = UUID("33333333-3333-3333-3333-333333333333")

    await tool.list_deals_by_building(building_id)

    rpc.call.assert_awaited_once_with(
        routing_key="backend.deal.list_by_building",
        action="deal.list_by_building",
        payload={"building_id": str(building_id)},
    )


@pytest.mark.asyncio
async def test_create_recommendation_uses_contract_routing_key_and_action() -> None:
    rpc = Mock(call=AsyncMock(return_value=Mock()))
    tool = RecommendationTools(rpc)
    deal_id = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")

    await tool.create_recommendation(
        deal_id,
        "construction_risk",
        "Рекомендация менеджеру",
    )

    rpc.call.assert_awaited_once_with(
        routing_key="backend.recommendation.create",
        action="recommendation.create",
        payload={
            "deal_id": str(deal_id),
            "kind": "construction_risk",
            "recommendation": "Рекомендация менеджеру",
        },
    )
