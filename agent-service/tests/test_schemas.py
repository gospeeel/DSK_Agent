from uuid import UUID

import pytest
from pydantic import ValidationError

from app.schemas.messages import AgentRequest
from app.schemas.responses import AgentResponse


REQUEST_ID = "11111111-1111-1111-1111-111111111111"
USER_ID = "22222222-2222-2222-2222-222222222222"
SESSION_ID = "33333333-3333-3333-3333-333333333333"


def test_chat_request_is_validated() -> None:
    request = AgentRequest.model_validate(
        {
            "request_id": REQUEST_ID,
            "action": "chat",
            "payload": {
                "user_id": USER_ID,
                "session_id": SESSION_ID,
                "deal_id": None,
                "message": "Привет",
            },
        }
    )

    assert request.request_id == UUID(REQUEST_ID)
    assert request.payload.message == "Привет"


def test_unknown_action_is_rejected() -> None:
    with pytest.raises(ValidationError):
        AgentRequest.model_validate(
            {
                "request_id": REQUEST_ID,
                "action": "unknown",
                "payload": {
                    "user_id": USER_ID,
                    "session_id": SESSION_ID,
                    "deal_id": None,
                    "message": "Привет",
                },
            }
        )


def test_success_response_matches_contract() -> None:
    response = AgentResponse.ok(
        UUID(REQUEST_ID),
        "Здравствуйте",
        "general",
        "general_chat",
    )

    assert response.model_dump(mode="json") == {
        "request_id": REQUEST_ID,
        "success": True,
        "data": {
            "message": "Здравствуйте",
            "agent": "general",
            "intent": "general_chat",
        },
        "error": None,
    }
