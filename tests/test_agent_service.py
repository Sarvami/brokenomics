from __future__ import annotations

import asyncio

import pytest
from fastapi import HTTPException


class _DummyDetectIntentResponse:
    def __init__(self, text: str):
        class _Text:
            def __init__(self, text_value: str):
                self.text = [text_value]

        class _Msg:
            def __init__(self, text_value: str):
                self.text = _Text(text_value)

        class _QueryResult:
            def __init__(self, text_value: str):
                self.response_messages = [_Msg(text_value)]

        self.query_result = _QueryResult(text)


class _DummySessionsClient:
    def __init__(self, text: str):
        self._text = text

    async def detect_intent(self, request=None):
        return _DummyDetectIntentResponse(self._text)


@pytest.mark.asyncio
async def test_agent_service_parses_json(monkeypatch):
    import app.services.agent_service as mod

    monkeypatch.setattr(mod.dialogflow_cx_v3, "SessionsAsyncClient", lambda: _DummySessionsClient('{"answer": "ok"}'))
    svc = mod.AgentService()

    out = await svc.send_message(
        user_id="u1",
        session_id="s1",
        user_message="hi",
        system_prompt="sp",
        chat_history=[],
    )
    assert out["answer"] == "ok"


@pytest.mark.asyncio
async def test_agent_service_wraps_non_json_reply(monkeypatch):
    import app.services.agent_service as mod

    monkeypatch.setattr(mod.dialogflow_cx_v3, "SessionsAsyncClient", lambda: _DummySessionsClient("plain text"))
    svc = mod.AgentService()

    out = await svc.send_message(
        user_id="u1",
        session_id="s1",
        user_message="hi",
        system_prompt="sp",
        chat_history=[],
    )
    assert "plain text" in out["answer"]


@pytest.mark.asyncio
async def test_agent_service_timeout_raises_504(monkeypatch):
    import app.services.agent_service as mod

    monkeypatch.setattr(mod.dialogflow_cx_v3, "SessionsAsyncClient", lambda: _DummySessionsClient('{"answer": "ok"}'))
    svc = mod.AgentService()

    async def fake_wait_for(coro, timeout):
        raise asyncio.TimeoutError()

    monkeypatch.setattr(mod.asyncio, "wait_for", fake_wait_for)

    with pytest.raises(HTTPException) as exc:
        await svc.send_message(
            user_id="u1",
            session_id="s1",
            user_message="hi",
            system_prompt="sp",
            chat_history=[],
        )

    assert exc.value.status_code == 504


@pytest.mark.asyncio
async def test_agent_service_google_api_error_raises_503(monkeypatch):
    import app.services.agent_service as mod

    monkeypatch.setattr(mod.dialogflow_cx_v3, "SessionsAsyncClient", lambda: _DummySessionsClient('{"answer": "ok"}'))
    svc = mod.AgentService()

    async def fake_wait_for(coro, timeout):
        raise mod.GoogleAPICallError("boom")

    monkeypatch.setattr(mod.asyncio, "wait_for", fake_wait_for)

    with pytest.raises(HTTPException) as exc:
        await svc.send_message(
            user_id="u1",
            session_id="s1",
            user_message="hi",
            system_prompt="sp",
            chat_history=[],
        )

    assert exc.value.status_code == 503
