#!/usr/bin/env python3
"""Local-only mock Go Backend for Agent Service RPC diagnostics."""

from __future__ import annotations

import asyncio
import json
import logging
import sys
from pathlib import Path
from typing import Any, Callable
from uuid import UUID

import aio_pika
from aio_pika import ExchangeType, IncomingMessage
from aio_pika.abc import AbstractChannel, AbstractRobustConnection
from pydantic import ValidationError

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import get_settings  # noqa: E402
from app.schemas.backend import BackendError, BackendRequest, BackendResponse  # noqa: E402

logger = logging.getLogger("mock-backend")

QUEUE_NAME = "mock-backend"
ROUTING_KEYS = (
    "backend.deal.get",
    "backend.apartment.get",
    "backend.building.get",
    "backend.competitor.list",
    "backend.construction.events.get",
    "backend.deal.messages.get",
    "backend.client.update_preferences",
    "backend.client.get",
    "backend.offer.calculate",
    "backend.offer.create",
    "backend.offer.request_approval",
    "backend.offer.get",
    "backend.offer.generate_pdf",
    "backend.deal.list_by_building",
    "backend.recommendation.create",
)

CLIENT_ID = "11111111-1111-1111-1111-111111111111"
APARTMENT_ID = "22222222-2222-2222-2222-222222222222"
BUILDING_ID = "33333333-3333-3333-3333-333333333333"
OFFER_ID = "88888888-8888-8888-8888-888888888888"


def require_string(payload: dict[str, Any], field: str) -> str:
    value = payload.get(field)
    if not isinstance(value, str) or not value:
        raise ValueError(f"payload.{field} must be a non-empty string")
    return value


def deal_data(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": require_string(payload, "deal_id"),
        "client_id": CLIENT_ID,
        "apartment_id": APARTMENT_ID,
        "stage": "negotiation",
        "next_action": "Подготовить контраргумент",
    }


def deals_by_building_data(payload: dict[str, Any]) -> dict[str, Any]:
    require_string(payload, "building_id")
    return {
        "deals": [
            {
                "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                "status": "active",
            }
        ]
    }


def apartment_data(payload: dict[str, Any]) -> dict[str, Any]:
    require_string(payload, "apartment_id")
    return {
        "id": APARTMENT_ID,
        "building_id": BUILDING_ID,
        "number": "142",
        "floor": 8,
        "rooms": 2,
        "area": 64.5,
        "price": 14200000,
        "status": "available",
    }


def building_data(payload: dict[str, Any]) -> dict[str, Any]:
    require_string(payload, "building_id")
    return {
        "id": BUILDING_ID,
        "name": "ЖК Альфа",
        "district": "Центральный",
        "readiness_percent": 76,
        "planned_delivery": "2027-06-01",
        "forecast_delivery": "2027-07-15",
    }


def competitor_data(payload: dict[str, Any]) -> dict[str, Any]:
    require_string(payload, "district")
    return {
        "competitors": [
            {
                "project_name": "ЖК Конкурент",
                "district": "Центральный",
                "price_per_sqm": 210000,
                "advantages": "Более низкая цена",
                "disadvantages": (
                    "Более поздний срок сдачи и отсутствие собственной парковки"
                ),
            }
        ]
    }


def construction_events_data(payload: dict[str, Any]) -> dict[str, Any]:
    require_string(payload, "building_id")
    return {
        "events": [
            {
                "type": "delivery_delay",
                "title": "Задержка поставки окон",
                "risk_level": "medium",
                "delay_days": 14,
            }
        ]
    }


def deal_messages_data(payload: dict[str, Any]) -> dict[str, Any]:
    require_string(payload, "deal_id")
    limit = payload.get("limit")
    if not isinstance(limit, int) or isinstance(limit, bool) or limit <= 0:
        raise ValueError("payload.limit must be a positive integer")
    return {
        "messages": [
            {
                "id": "44444444-4444-4444-4444-444444444444",
                "direction": "manager_to_client",
                "body": "Какой бюджет рассматриваете?",
            },
            {
                "id": "55555555-5555-5555-5555-555555555555",
                "direction": "client_to_manager",
                "body": "До 15 миллионов. Нужна двухкомнатная квартира.",
            },
            {
                "id": "66666666-6666-6666-6666-666666666666",
                "direction": "client_to_manager",
                "body": "Желательно не ниже 7 этажа, парковка обязательна.",
            },
            {
                "id": "77777777-7777-7777-7777-777777777777",
                "direction": "client_to_manager",
                "body": "Ещё переживаю, что у конкурента дешевле.",
            },
        ]
    }


def update_client_preferences_data(payload: dict[str, Any]) -> dict[str, Any]:
    client_id = require_string(payload, "client_id")
    preferences = payload.get("preferences")
    if not isinstance(preferences, dict):
        raise ValueError("payload.preferences must be an object")
    budget_max = payload.get("budget_max")
    if budget_max is not None and (
        not isinstance(budget_max, int) or isinstance(budget_max, bool) or budget_max < 0
    ):
        raise ValueError("payload.budget_max must be a non-negative integer")
    return {
        "client_id": client_id,
        "preferences": preferences,
        "budget_max": budget_max,
        "updated": True,
    }


def client_data(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": require_string(payload, "client_id"),
        "full_name": "Иван Иванов",
        "budget_max": 15000000,
        "preferences": {
            "rooms": 2,
            "floor_min": 7,
            "parking": True,
        },
    }


def calculate_offer_data(payload: dict[str, Any]) -> dict[str, Any]:
    require_string(payload, "deal_id")
    discount_percent = payload.get("discount_percent")
    if not isinstance(discount_percent, (int, float)) or isinstance(
        discount_percent, bool
    ):
        raise ValueError("payload.discount_percent must be a number")
    if discount_percent < 0:
        raise ValueError("payload.discount_percent must be non-negative")

    base_price = 14_200_000
    discount_amount = round(base_price * discount_percent / 100)
    return {
        "base_price": base_price,
        "discount_percent": discount_percent,
        "discount_amount": discount_amount,
        "total_price": base_price - discount_amount,
        "max_manager_discount": 3,
        "requires_approval": discount_percent > 3,
    }


def create_offer_data(payload: dict[str, Any]) -> dict[str, Any]:
    require_string(payload, "deal_id")
    require_string(payload, "created_by")
    require_string(payload, "generated_text")
    discount_percent = payload.get("discount_percent")
    if not isinstance(discount_percent, (int, float)) or isinstance(
        discount_percent, bool
    ):
        raise ValueError("payload.discount_percent must be a number")
    status = "pending_approval" if discount_percent > 3 else "created"
    return {"offer_id": OFFER_ID, "status": status}


def request_offer_approval_data(payload: dict[str, Any]) -> dict[str, Any]:
    offer_id = require_string(payload, "offer_id")
    require_string(payload, "requested_by")
    require_string(payload, "reason")
    return {"offer_id": offer_id, "status": "waiting_approval"}


def offer_data(payload: dict[str, Any]) -> dict[str, Any]:
    offer_id = require_string(payload, "offer_id")
    return {
        "id": offer_id,
        "deal_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        "status": "approved",
    }


def generate_offer_pdf_data(payload: dict[str, Any]) -> dict[str, Any]:
    offer_id = require_string(payload, "offer_id")
    return {
        "offer_id": offer_id,
        "document_url": "/documents/offers/123.pdf",
    }


def recommendation_data(payload: dict[str, Any]) -> dict[str, Any]:
    require_string(payload, "deal_id")
    kind = require_string(payload, "kind")
    require_string(payload, "recommendation")
    if kind != "construction_risk":
        raise ValueError("payload.kind must be construction_risk")
    return {
        "recommendation_id": "99999999-9999-9999-9999-999999999999",
        "created": True,
    }


HANDLERS: dict[str, tuple[str, Callable[[dict[str, Any]], dict[str, Any]]]] = {
    "deal.get": ("backend.deal.get", deal_data),
    "deal.list_by_building": (
        "backend.deal.list_by_building",
        deals_by_building_data,
    ),
    "apartment.get": ("backend.apartment.get", apartment_data),
    "building.get": ("backend.building.get", building_data),
    "competitor.list": ("backend.competitor.list", competitor_data),
    "construction.events.get": (
        "backend.construction.events.get",
        construction_events_data,
    ),
    "deal.messages.get": ("backend.deal.messages.get", deal_messages_data),
    "client.update_preferences": (
        "backend.client.update_preferences",
        update_client_preferences_data,
    ),
    "client.get": ("backend.client.get", client_data),
    "offer.calculate": ("backend.offer.calculate", calculate_offer_data),
    "offer.create": ("backend.offer.create", create_offer_data),
    "offer.request_approval": (
        "backend.offer.request_approval",
        request_offer_approval_data,
    ),
    "offer.get": ("backend.offer.get", offer_data),
    "offer.generate_pdf": (
        "backend.offer.generate_pdf",
        generate_offer_pdf_data,
    ),
    "recommendation.create": (
        "backend.recommendation.create",
        recommendation_data,
    ),
}


def extract_request_id(body: bytes) -> UUID | None:
    try:
        raw = json.loads(body)
        return UUID(str(raw.get("request_id"))) if isinstance(raw, dict) else None
    except (json.JSONDecodeError, UnicodeDecodeError, TypeError, ValueError):
        return None


async def publish_response(
    channel: AbstractChannel,
    incoming: IncomingMessage,
    response: BackendResponse,
) -> None:
    message = aio_pika.Message(
        body=response.model_dump_json().encode("utf-8"),
        content_type="application/json",
        correlation_id=incoming.correlation_id,
        delivery_mode=aio_pika.DeliveryMode.NOT_PERSISTENT,
    )
    await channel.default_exchange.publish(message, routing_key=incoming.reply_to)


def error_response(
    request_id: UUID,
    code: str,
    message: str,
) -> BackendResponse:
    return BackendResponse(
        request_id=request_id,
        success=False,
        data=None,
        error=BackendError(code=code, message=message),
    )


async def handle_request(message: IncomingMessage, channel: AbstractChannel) -> None:
    if not message.reply_to:
        logger.error("Rejecting request without reply_to: routing_key=%s", message.routing_key)
        await message.reject(requeue=False)
        return
    if not message.correlation_id:
        logger.error("Rejecting request without correlation_id: routing_key=%s", message.routing_key)
        await message.reject(requeue=False)
        return

    request_id = extract_request_id(message.body)
    if request_id is None:
        logger.error(
            "Rejecting request without valid request_id: routing_key=%s correlation_id=%s",
            message.routing_key,
            message.correlation_id,
        )
        await message.reject(requeue=False)
        return

    try:
        request = BackendRequest.model_validate_json(message.body)
    except ValidationError as exc:
        logger.warning(
            "Invalid request: routing_key=%s request_id=%s error=%s",
            message.routing_key,
            request_id,
            exc,
        )
        response = error_response(request_id, "VALIDATION_ERROR", "Invalid request")
    else:
        logger.info(
            "Request: routing_key=%s action=%s request_id=%s correlation_id=%s",
            message.routing_key,
            request.action,
            request.request_id,
            message.correlation_id,
        )
        route_and_handler = HANDLERS.get(request.action)
        if route_and_handler is None or route_and_handler[0] != message.routing_key:
            response = error_response(
                request.request_id,
                "UNKNOWN_ACTION",
                "Unsupported action",
            )
        else:
            try:
                data = route_and_handler[1](request.payload)
            except ValueError as exc:
                response = error_response(
                    request.request_id,
                    "VALIDATION_ERROR",
                    str(exc),
                )
            else:
                response = BackendResponse(
                    request_id=request.request_id,
                    success=True,
                    data=data,
                    error=None,
                )

    try:
        await publish_response(channel, message, response)
    except Exception:
        logger.exception(
            "Failed to publish response: request_id=%s correlation_id=%s",
            request_id,
            message.correlation_id,
        )
        await message.nack(requeue=True)
        return

    await message.ack()
    logger.info(
        "Response sent: success=%s request_id=%s correlation_id=%s",
        response.success,
        request_id,
        message.correlation_id,
    )


async def run() -> None:
    settings = get_settings()
    connection: AbstractRobustConnection | None = None

    try:
        connection = await aio_pika.connect_robust(
            settings.rabbitmq_url.get_secret_value()
        )
        channel = await connection.channel()
        exchange = await channel.declare_exchange(
            settings.rabbitmq_exchange,
            ExchangeType.TOPIC,
            durable=True,
            passive=True,
        )
        queue = await channel.declare_queue(
            QUEUE_NAME,
            durable=False,
            exclusive=True,
            auto_delete=True,
        )
        for routing_key in ROUTING_KEYS:
            await queue.bind(exchange, routing_key=routing_key)

        await queue.consume(lambda message: handle_request(message, channel), no_ack=False)
        logger.info(
            "Mock backend started: queue=%s routing_keys=%s",
            QUEUE_NAME,
            ",".join(ROUTING_KEYS),
        )
        await asyncio.Future()
    finally:
        if connection is not None and not connection.is_closed:
            await connection.close()
            logger.info("RabbitMQ connection closed")


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    try:
        asyncio.run(run())
    except KeyboardInterrupt:
        logger.info("Mock backend stopped by user")
    except Exception as exc:
        logger.error(
            "Mock backend failed: %s. Check RabbitMQ availability and environment settings.",
            type(exc).__name__,
        )
        raise SystemExit(1) from None
