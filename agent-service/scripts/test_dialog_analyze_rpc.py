#!/usr/bin/env python3
"""Run the dialog analysis flow through the real RabbitMQ RPC path."""

from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path
from uuid import UUID

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.rpc_client import positive_timeout, run_single_call  # noqa: E402

ROUTING_KEY = "agent.dialog.analyze"
ACTION = "dialog.analyze"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("deal_id", type=UUID, help="Deal UUID")
    parser.add_argument("user_id", type=UUID, help="Manager/user UUID")
    parser.add_argument(
        "--timeout",
        type=positive_timeout,
        default=30.0,
        help="RPC response timeout in seconds (default: 30)",
    )
    return parser.parse_args()


async def run(args: argparse.Namespace) -> int:
    return await run_single_call(
        routing_key=ROUTING_KEY,
        action=ACTION,
        payload={
            "deal_id": str(args.deal_id),
            "user_id": str(args.user_id),
        },
        timeout=args.timeout,
    )


if __name__ == "__main__":
    try:
        raise SystemExit(asyncio.run(run(parse_args())))
    except KeyboardInterrupt:
        print("Dialog analysis diagnostic interrupted.", file=sys.stderr)
        raise SystemExit(130) from None
