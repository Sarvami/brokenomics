from __future__ import annotations

import pytest

from app.db import collections


@pytest.mark.asyncio
async def test_chat_message_happy_path(client, mock_db, monkeypatch):
    import app.api.v1.chat as chat_routes

    await mock_db[collections.TOPICS].insert_one({"id": "mutual_funds", "title": "Mutual Funds", "sub_topics": []})

    async def fake_send_message(*, user_id, session_id, user_message, system_prompt, chat_history):
        return {
            "answer": "Hello from fake agent",
            "jargon_terms": [],
            "suggested_followups": ["What is SIP?"],
            "related_sub_topics": [],
            "tool_used": None,
            "sources": ["doc1"],
            "journey_step_hint": None,
        }

    monkeypatch.setattr(chat_routes.agent_service, "send_message", fake_send_message)

    res = await client.post(
        "/api/v1/chat/message",
        json={"topic_id": "mutual_funds", "message": "Hi", "sub_topic_id": None, "session_id": None},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["session_id"]
    assert body["message"]["role"] == "assistant"
    assert "fake agent" in body["message"]["content"]

    # User+assistant messages are persisted.
    count = await mock_db[collections.CHAT_HISTORY].count_documents({})
    assert count == 2


@pytest.mark.asyncio
async def test_chat_message_unknown_topic_returns_404(client):
    res = await client.post(
        "/api/v1/chat/message",
        json={"topic_id": "does_not_exist", "message": "Hi"},
    )
    assert res.status_code == 404
