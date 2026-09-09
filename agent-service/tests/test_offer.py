from unittest.mock import AsyncMock, Mock
from uuid import UUID, uuid4

import pytest

from app.agents.offer import (
    BACKEND_DATA_ERROR_RESPONSE,
    MISSING_DEAL_RESPONSE,
    OFFER_SAVE_ERROR_RESPONSE,
    OFFER_SYSTEM_PROMPT,
    OfferAgent,
)
from app.broker.backend_rpc import BackendRpcError, BackendRpcTimeoutError
from app.graphs.offer_graph import APPROVAL_REQUEST_ERROR_RESPONSE
from app.schemas.backend import BackendResponse


DEAL_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
USER_ID = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
CLIENT_ID = UUID("11111111-1111-1111-1111-111111111111")
APARTMENT_ID = UUID("22222222-2222-2222-2222-222222222222")


def backend_response(data: dict) -> BackendResponse:
    return BackendResponse(
        request_id=uuid4(),
        success=True,
        data=data,
        error=None,
    )


def calculation_data(*, requires_approval: bool = False) -> dict:
    return {
        "base_price": 14_200_000,
        "discount_percent": 3,
        "discount_amount": 426_000,
        "total_price": 13_774_000,
        "max_manager_discount": 3,
        "requires_approval": requires_approval,
    }


def make_dependencies() -> tuple[Mock, Mock, Mock, Mock, Mock]:
    llm = Mock(generate=AsyncMock(return_value="Персональный текст КП"))
    deal_tools = Mock(
        get_deal=AsyncMock(
            return_value=backend_response(
                {
                    "id": str(DEAL_ID),
                    "client_id": str(CLIENT_ID),
                    "apartment_id": str(APARTMENT_ID),
                    "stage": "negotiation",
                }
            )
        )
    )
    client_tools = Mock(
        get_client=AsyncMock(
            return_value=backend_response(
                {
                    "id": str(CLIENT_ID),
                    "full_name": "Иван Иванов",
                    "budget_max": 15_000_000,
                    "preferences": {"rooms": 2, "parking": True},
                }
            )
        )
    )
    apartment_tools = Mock(
        get_apartment=AsyncMock(
            return_value=backend_response(
                {
                    "id": str(APARTMENT_ID),
                    "building_id": "33333333-3333-3333-3333-333333333333",
                    "number": "142",
                    "floor": 8,
                    "rooms": 2,
                    "area": 64.5,
                    "price": 14_200_000,
                    "status": "available",
                }
            )
        )
    )
    offer_tools = Mock(
        calculate_offer=AsyncMock(return_value=backend_response(calculation_data())),
        create_offer=AsyncMock(
            return_value=backend_response(
                {
                    "offer_id": "88888888-8888-8888-8888-888888888888",
                    "status": "created",
                }
            )
        ),
        request_offer_approval=AsyncMock(
            return_value=backend_response(
                {
                    "offer_id": "88888888-8888-8888-8888-888888888888",
                    "status": "waiting_approval",
                }
            )
        ),
    )
    return llm, deal_tools, client_tools, apartment_tools, offer_tools


@pytest.mark.asyncio
async def test_create_offer_uses_factual_backend_workflow() -> None:
    llm, deal_tools, client_tools, apartment_tools, offer_tools = make_dependencies()
    agent = OfferAgent(llm, deal_tools, client_tools, apartment_tools, offer_tools)

    result = await agent.generate("Сформируй КП", "create_offer", DEAL_ID, USER_ID)

    deal_tools.get_deal.assert_awaited_once_with(DEAL_ID)
    client_tools.get_client.assert_awaited_once_with(CLIENT_ID)
    apartment_tools.get_apartment.assert_awaited_once_with(APARTMENT_ID)
    offer_tools.calculate_offer.assert_awaited_once_with(DEAL_ID, 0)
    offer_tools.create_offer.assert_awaited_once_with(
        DEAL_ID,
        USER_ID,
        3.0,
        "Персональный текст КП",
    )

    prompt = llm.generate.await_args.args[0]
    assert "Иван Иванов" in prompt
    assert '"number": "142"' in prompt
    assert '"base_price": 14200000' in prompt
    assert '"discount_amount": 426000' in prompt
    assert '"total_price": 13774000' in prompt
    assert '"request_id"' not in prompt
    assert '"success"' not in prompt
    assert '"error"' not in prompt
    assert llm.generate.await_args.kwargs["system_prompt"] == OFFER_SYSTEM_PROMPT

    assert "Персональный текст КП" in result
    assert "14 200 000 ₽" in result
    assert "13 774 000 ₽" in result
    assert "Предложение сохранено." in result
    offer_tools.request_offer_approval.assert_not_awaited()


@pytest.mark.asyncio
async def test_requires_approval_creates_offer_and_requests_approval() -> None:
    llm, deal_tools, client_tools, apartment_tools, offer_tools = make_dependencies()
    offer_tools.calculate_offer.return_value = backend_response(
        calculation_data(requires_approval=True)
    )
    offer_tools.create_offer.return_value = backend_response(
        {
            "offer_id": "88888888-8888-8888-8888-888888888888",
            "status": "pending_approval",
        }
    )
    agent = OfferAgent(llm, deal_tools, client_tools, apartment_tools, offer_tools)

    result = await agent.generate("Сформируй КП", "create_offer", DEAL_ID, USER_ID)

    assert "Персональный текст КП" in result
    assert "Запрос на согласование отправлен" in result
    llm.generate.assert_awaited_once()
    offer_tools.create_offer.assert_awaited_once()
    offer_tools.request_offer_approval.assert_awaited_once_with(
        UUID("88888888-8888-8888-8888-888888888888"),
        USER_ID,
        "Запрошенная скидка превышает лимит менеджера",
    )

    state = await agent._graph.run(
        {
            "user_id": USER_ID,
            "deal_id": DEAL_ID,
            "message": "Сформируй КП",
            "intent": "create_offer",
            "discount_percent": 5,
            "approval_required": False,
        }
    )
    assert state["approval_status"] == "waiting"
    assert state["offer_id"] == UUID("88888888-8888-8888-8888-888888888888")


@pytest.mark.asyncio
async def test_calculate_offer_returns_backend_values_without_creating_offer() -> None:
    llm, deal_tools, client_tools, apartment_tools, offer_tools = make_dependencies()
    agent = OfferAgent(llm, deal_tools, client_tools, apartment_tools, offer_tools)

    result = await agent.generate("Рассчитай КП", "calculate_offer", DEAL_ID, USER_ID)

    assert "Базовая стоимость: 14 200 000 ₽" in result
    assert "Скидка: 3%" in result
    assert "Итоговая стоимость: 13 774 000 ₽" in result
    llm.generate.assert_not_awaited()
    offer_tools.create_offer.assert_not_awaited()
    offer_tools.request_offer_approval.assert_not_awaited()


@pytest.mark.asyncio
async def test_missing_deal_does_not_call_tools_or_llm() -> None:
    llm, deal_tools, client_tools, apartment_tools, offer_tools = make_dependencies()
    agent = OfferAgent(llm, deal_tools, client_tools, apartment_tools, offer_tools)

    result = await agent.generate("Сформируй КП", "create_offer", None, USER_ID)

    assert result == MISSING_DEAL_RESPONSE
    deal_tools.get_deal.assert_not_awaited()
    client_tools.get_client.assert_not_awaited()
    apartment_tools.get_apartment.assert_not_awaited()
    offer_tools.calculate_offer.assert_not_awaited()
    offer_tools.create_offer.assert_not_awaited()
    llm.generate.assert_not_awaited()


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("dependency", "error"),
    [
        ("deal", BackendRpcTimeoutError("timeout", code="TIMEOUT")),
        ("deal", BackendRpcError("deal missing", code="DEAL_NOT_FOUND")),
        ("client", BackendRpcError("client missing", code="CLIENT_NOT_FOUND")),
        (
            "apartment",
            BackendRpcError("apartment missing", code="APARTMENT_NOT_FOUND"),
        ),
    ],
)
async def test_backend_read_error_returns_safe_response(
    dependency: str,
    error: BackendRpcError,
) -> None:
    llm, deal_tools, client_tools, apartment_tools, offer_tools = make_dependencies()
    failing_method = {
        "deal": deal_tools.get_deal,
        "client": client_tools.get_client,
        "apartment": apartment_tools.get_apartment,
    }[dependency]
    failing_method.side_effect = error
    agent = OfferAgent(llm, deal_tools, client_tools, apartment_tools, offer_tools)

    result = await agent.generate("Сформируй КП", "create_offer", DEAL_ID, USER_ID)

    assert result == BACKEND_DATA_ERROR_RESPONSE
    llm.generate.assert_not_awaited()
    offer_tools.create_offer.assert_not_awaited()


@pytest.mark.asyncio
async def test_create_error_preserves_generated_text() -> None:
    llm, deal_tools, client_tools, apartment_tools, offer_tools = make_dependencies()
    offer_tools.create_offer.side_effect = BackendRpcError(
        "create failed",
        code="CREATE_FAILED",
    )
    agent = OfferAgent(llm, deal_tools, client_tools, apartment_tools, offer_tools)

    result = await agent.generate("Сформируй КП", "create_offer", DEAL_ID, USER_ID)

    assert "Персональный текст КП" in result
    assert "14 200 000 ₽" in result
    assert OFFER_SAVE_ERROR_RESPONSE in result
    assert "Предложение сохранено." not in result


@pytest.mark.asyncio
async def test_request_approval_error_preserves_offer_and_generated_text() -> None:
    llm, deal_tools, client_tools, apartment_tools, offer_tools = make_dependencies()
    offer_tools.calculate_offer.return_value = backend_response(
        calculation_data(requires_approval=True)
    )
    offer_tools.create_offer.return_value = backend_response(
        {
            "offer_id": "88888888-8888-8888-8888-888888888888",
            "status": "pending_approval",
        }
    )
    offer_tools.request_offer_approval.side_effect = BackendRpcError(
        "approval failed",
        code="APPROVAL_FAILED",
    )
    agent = OfferAgent(llm, deal_tools, client_tools, apartment_tools, offer_tools)

    state = await agent._graph.run(
        {
            "user_id": USER_ID,
            "deal_id": DEAL_ID,
            "message": "Сформируй КП",
            "intent": "create_offer",
            "discount_percent": 5,
            "approval_required": False,
        }
    )

    assert state["offer_id"] == UUID("88888888-8888-8888-8888-888888888888")
    assert state["error"] == "APPROVAL_REQUEST_ERROR"
    assert "Персональный текст КП" in state["result_message"]
    assert APPROVAL_REQUEST_ERROR_RESPONSE in state["result_message"]


@pytest.mark.asyncio
async def test_gigachat_error_is_controlled_graph_state() -> None:
    llm, deal_tools, client_tools, apartment_tools, offer_tools = make_dependencies()
    llm.generate.side_effect = RuntimeError("LLM unavailable")
    agent = OfferAgent(llm, deal_tools, client_tools, apartment_tools, offer_tools)

    result = await agent.generate("Сформируй КП", "create_offer", DEAL_ID, USER_ID)

    assert result == "Не удалось подготовить текст коммерческого предложения."
    offer_tools.create_offer.assert_not_awaited()


@pytest.mark.asyncio
async def test_offer_graph_is_compiled_once() -> None:
    llm, deal_tools, client_tools, apartment_tools, offer_tools = make_dependencies()
    agent = OfferAgent(llm, deal_tools, client_tools, apartment_tools, offer_tools)
    compiled = agent._graph.compiled

    await agent.generate("Сформируй КП", "create_offer", DEAL_ID, USER_ID)
    await agent.generate("Сформируй ещё раз", "create_offer", DEAL_ID, USER_ID)

    assert agent._graph.compiled is compiled


@pytest.mark.asyncio
async def test_parallel_offer_graph_executions_keep_state_separate() -> None:
    import asyncio

    llm, deal_tools, client_tools, apartment_tools, offer_tools = make_dependencies()

    async def generate_for_prompt(prompt: str, **_: object) -> str:
        return "Текст A" if "Запрос A" in prompt else "Текст B"

    llm.generate.side_effect = generate_for_prompt
    agent = OfferAgent(llm, deal_tools, client_tools, apartment_tools, offer_tools)

    first, second = await asyncio.gather(
        agent.generate("Запрос A", "create_offer", DEAL_ID, USER_ID),
        agent.generate("Запрос B", "create_offer", DEAL_ID, USER_ID),
    )

    assert "Текст A" in first and "Текст B" not in first
    assert "Текст B" in second and "Текст A" not in second


def test_offer_prompt_forbids_financial_and_factual_invention() -> None:
    prompt = OFFER_SYSTEM_PROMPT.lower()

    assert "запрещено пересчитывать цену" in prompt
    assert "менять discount" in prompt
    assert "придумывать стоимость" in prompt
    assert "характеристики квартиры" in prompt
    assert "данные клиента" in prompt
