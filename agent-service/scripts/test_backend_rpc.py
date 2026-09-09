#!/usr/bin/env python3
"""End-to-end diagnostic client for BackendRpcClient and backend tools."""

from __future__ import annotations

import asyncio
import json
import sys
import time
from pathlib import Path
from uuid import UUID

import aio_pika
from aio_pika import ExchangeType
from aio_pika.abc import AbstractRobustConnection

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.broker.backend_rpc import BackendRpcClient, BackendRpcError  # noqa: E402
from app.config import get_settings  # noqa: E402
from app.schemas.backend import BackendResponse  # noqa: E402
from app.tools.apartment import ApartmentTools  # noqa: E402
from app.tools.building import BuildingTools  # noqa: E402
from app.tools.competitor import CompetitorTools  # noqa: E402
from app.tools.deal import DealTools  # noqa: E402

DEAL_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
APARTMENT_ID = UUID("22222222-2222-2222-2222-222222222222")
BUILDING_ID = UUID("33333333-3333-3333-3333-333333333333")


def print_response(name: str, response: BackendResponse) -> None:
    print(f"\n{name}:")
    print(json.dumps(response.model_dump(mode="json"), ensure_ascii=False, indent=2))


async def run() -> int:
    settings = get_settings()
    started_at = time.perf_counter()
    connection: AbstractRobustConnection | None = None
    rpc: BackendRpcClient | None = None

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

        rpc = BackendRpcClient(channel, exchange)
        await rpc.start()

        deal_tools = DealTools(rpc)
        apartment_tools = ApartmentTools(rpc)
        building_tools = BuildingTools(rpc)
        competitor_tools = CompetitorTools(rpc)

        print_response("get_deal", await deal_tools.get_deal(DEAL_ID))
        print_response(
            "get_apartment",
            await apartment_tools.get_apartment(APARTMENT_ID),
        )
        print_response(
            "get_building",
            await building_tools.get_building(BUILDING_ID),
        )
        print_response(
            "list_competitors",
            await competitor_tools.list_competitors("Центральный"),
        )
        return 0
    except BackendRpcError as exc:
        print(
            f"Backend RPC error: code={exc.code or 'UNKNOWN'} message={exc}",
            file=sys.stderr,
        )
        return 1
    except Exception as exc:
        print(
            f"Backend RPC diagnostic failed: {type(exc).__name__}. "
            "Check RabbitMQ and mock backend availability.",
            file=sys.stderr,
        )
        return 1
    finally:
        if rpc is not None:
            await rpc.close()
        if connection is not None and not connection.is_closed:
            await connection.close()
        print(f"\nelapsed: {time.perf_counter() - started_at:.2f} s")


if __name__ == "__main__":
    try:
        raise SystemExit(asyncio.run(run()))
    except KeyboardInterrupt:
        print("Backend RPC diagnostic interrupted by user.", file=sys.stderr)
        raise SystemExit(130) from None
