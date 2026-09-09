import json
import logging
from typing import Literal, Protocol
from uuid import UUID

from pydantic import ValidationError

from app.broker.backend_rpc import BackendRpcError
from app.schemas.negotiation import (
    ApartmentFacts,
    BuildingFacts,
    CompetitorListData,
    DealFacts,
    NegotiationContext,
    require_backend_data,
)
from app.schemas.dialog import ReplyAssistAnalysis
from app.tools.apartment import ApartmentTools
from app.tools.building import BuildingTools
from app.tools.competitor import CompetitorTools
from app.tools.deal import DealTools

logger = logging.getLogger(__name__)

NegotiationIntent = Literal["handle_objection", "compare_competitor"]

MISSING_DEAL_RESPONSE = (
    "Для точного анализа необходимо выбрать или передать сделку. "
    "Без данных по сделке и объекту нельзя формировать фактический контраргумент."
)
BACKEND_DATA_ERROR_RESPONSE = (
    "Не удалось получить данные по сделке или объекту. "
    "Для точного контраргумента нужны фактические данные."
)

NEGOTIATION_SYSTEM_PROMPT = """Ты помощник менеджера по продажам недвижимости.
Сформируй короткий практический ответ для менеджера по продажам.

Строгие правила:
- ФАКТЫ — только данные из секции «Фактический контекст backend» и текст менеджера.
- Текст менеджера может содержать слова клиента; не выдавай их за проверенные данные.
- ЗАПРЕЩЕНО придумывать цены, скидки и любые финансовые показатели.
- ЗАПРЕЩЕНО придумывать сроки строительства или сдачи.
- ЗАПРЕЩЕНО придумывать инфраструктуру, преимущества нашего объекта или недостатки
  конкурента.
- ЗАПРЕЩЕНО ссылаться на сведения, которых нет в фактическом контексте.
- Если данных недостаточно, явно скажи об этом менеджеру.

Intent описывает задачу:
- handle_objection — помочь корректно обработать возражение клиента;
- compare_competitor — помочь сравнить предложение с конкурентом без домыслов.

Желательная структура:
1. Краткая оценка возражения.
2. От двух до четырёх фактических контраргументов, если данных достаточно.
3. Готовая формулировка, которую менеджер может сказать клиенту.

Не выполняй расчёты и не сообщай неподтверждённые сведения.
"""

REPLY_ASSIST_ANALYSIS_PROMPT = """Определи тип и кратко опиши конкретное сообщение клиента.
Верни только structured output по переданной схеме.

Допустимые intent:
- price_objection — клиент возражает против цены;
- competitor_comparison — клиент сравнивает предложение с конкурентом;
- timing_objection — вопрос или возражение о сроках;
- property_objection — вопрос или возражение о характеристиках объекта;
- general_question — общий вопрос клиента;
- other_objection — другое возражение;
- unknown — смысл нельзя надёжно определить.

Строгие правила:
- Анализируй только текст сообщения ниже.
- Не придумывай факты о клиенте, цене, скидке, сроках, объекте или конкуренте.
- summary должна кратко пересказывать смысл сообщения, без новых сведений.

Сообщение клиента:
{message}
"""


class NegotiationLlmClient(Protocol):
    async def generate(
        self,
        message: str,
        *,
        system_prompt: str | None = None,
    ) -> str: ...

    async def parse_structured(
        self,
        prompt: str,
        response_model: type[ReplyAssistAnalysis],
    ) -> ReplyAssistAnalysis: ...


class NegotiationAgent:
    def __init__(
        self,
        llm: NegotiationLlmClient,
        deal_tools: DealTools,
        apartment_tools: ApartmentTools,
        building_tools: BuildingTools,
        competitor_tools: CompetitorTools,
    ) -> None:
        self._llm = llm
        self._deal_tools = deal_tools
        self._apartment_tools = apartment_tools
        self._building_tools = building_tools
        self._competitor_tools = competitor_tools

    async def generate(
        self,
        message: str,
        intent: NegotiationIntent,
        deal_id: UUID | None,
    ) -> str:
        if intent not in ("handle_objection", "compare_competitor"):
            raise ValueError(f"Unsupported negotiation intent: {intent}")
        if deal_id is None:
            return MISSING_DEAL_RESPONSE

        try:
            deal_response = await self._deal_tools.get_deal(deal_id)
            deal = DealFacts.model_validate(require_backend_data(deal_response.data))
            context = await self._load_context(deal)
        except BackendRpcError as exc:
            logger.warning(
                "Negotiation backend data unavailable: error_type=%s code=%s",
                type(exc).__name__,
                exc.code,
            )
            return BACKEND_DATA_ERROR_RESPONSE
        except (ValidationError, TypeError, ValueError) as exc:
            logger.warning(
                "Negotiation backend data is invalid: error_type=%s",
                type(exc).__name__,
            )
            return BACKEND_DATA_ERROR_RESPONSE

        return await self._generate_from_context(message, intent, context)

    async def reply_assist(
        self,
        message: str,
        deal: DealFacts,
    ) -> tuple[ReplyAssistAnalysis, str]:
        analysis: ReplyAssistAnalysis | None = None
        prompt = REPLY_ASSIST_ANALYSIS_PROMPT.format(message=message)
        for attempt in range(1, 3):
            try:
                parsed = await self._llm.parse_structured(prompt, ReplyAssistAnalysis)
                analysis = ReplyAssistAnalysis.model_validate(parsed)
                break
            except (json.JSONDecodeError, ValidationError, ValueError) as exc:
                logger.warning(
                    "Invalid structured reply analysis: attempt=%d/2 error_type=%s",
                    attempt,
                    type(exc).__name__,
                )
        if analysis is None:
            analysis = ReplyAssistAnalysis(
                intent="unknown",
                summary="Смысл сообщения не удалось надёжно классифицировать.",
            )

        intent: NegotiationIntent = (
            "compare_competitor"
            if analysis.intent == "competitor_comparison"
            else "handle_objection"
        )
        context = await self._load_context(deal)
        suggested_reply = await self._generate_from_context(message, intent, context)
        return analysis, suggested_reply

    async def _load_context(self, deal: DealFacts) -> NegotiationContext:
        apartment_response = await self._apartment_tools.get_apartment(
            deal.apartment_id
        )
        apartment = ApartmentFacts.model_validate(
            require_backend_data(apartment_response.data)
        )

        building_response = await self._building_tools.get_building(
            apartment.building_id
        )
        building = BuildingFacts.model_validate(
            require_backend_data(building_response.data)
        )

        competitors_response = await self._competitor_tools.list_competitors(
            building.district
        )
        competitors = CompetitorListData.model_validate(
            require_backend_data(competitors_response.data)
        )
        return NegotiationContext(
            deal=deal,
            apartment=apartment,
            building=building,
            competitors=competitors.competitors,
        )

    async def _generate_from_context(
        self,
        message: str,
        intent: NegotiationIntent,
        context: NegotiationContext,
    ) -> str:
        user_prompt = (
            f"Intent: {intent}\n\n"
            "Фактический контекст backend:\n"
            f"{context.model_dump_json(indent=2)}\n\n"
            "Текст менеджера:\n"
            f"{message}"
        )
        return await self._llm.generate(
            user_prompt,
            system_prompt=NEGOTIATION_SYSTEM_PROMPT,
        )
