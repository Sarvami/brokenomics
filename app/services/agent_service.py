"""Google Cloud Agent Builder bridge.

Uses Dialogflow CX Sessions API (Agent Builder transport). Defensive by design:
the demo should never crash if the AI is slow or fails formatting.
"""

from __future__ import annotations

import asyncio
import json
import time
from typing import Any

from fastapi import HTTPException
from google.auth.exceptions import DefaultCredentialsError
from google.api_core.exceptions import GoogleAPICallError
from google.cloud import dialogflowcx_v3 as dialogflow_cx_v3
from google.protobuf import struct_pb2

from app.config import settings
from app.models.chat import ChatMessage
from app.utils.logger import get_logger


log = get_logger("agent_service")


class AgentService:
    def __init__(self) -> None:
        self.project = settings.GOOGLE_CLOUD_PROJECT
        self.location = settings.GOOGLE_CLOUD_LOCATION
        self.agent_id = settings.AGENT_BUILDER_AGENT_ID
        # Lazy-init: local dev + unit tests should not require Google ADC.
        self._client: dialogflow_cx_v3.SessionsAsyncClient | None = None
        log.info(
            "Agent client initialised",
            extra={"extra_fields": {"project": self.project, "location": self.location}},
        )

    def _client_or_raise(self) -> dialogflow_cx_v3.SessionsAsyncClient:
        if self._client is None:
            try:
                self._client = dialogflow_cx_v3.SessionsAsyncClient()
            except DefaultCredentialsError as exc:
                log.warning(
                    "Google ADC not configured",
                    extra={"extra_fields": {"error": str(exc)}},
                )
                raise HTTPException(status_code=503, detail="AI credentials not configured.") from exc
        return self._client

    def _session_path(self, session_id: str) -> str:
        return (
            f"projects/{self.project}/locations/{self.location}/agents/{self.agent_id}"
            f"/sessions/{session_id}"
        )

    async def warmup(self) -> None:
        start = time.perf_counter()
        try:
            await self.send_message(
                user_id="warmup",
                session_id="warmup",
                user_message="ping",
                system_prompt="Return JSON only: {\"answer\": \"pong\"}",
                chat_history=[],
            )
            ms = int((time.perf_counter() - start) * 1000)
            log.info("Agent warmup ok", extra={"extra_fields": {"latency_ms": ms}})
        except Exception as exc:  # noqa: BLE001
            log.warning(
                "Agent warmup failed (non-fatal)",
                extra={"extra_fields": {"error": str(exc)}},
            )

    async def send_message(
        self,
        user_id: str,
        session_id: str,
        user_message: str,
        system_prompt: str,
        chat_history: list[ChatMessage],
    ) -> dict[str, Any]:
        session = self._session_path(session_id)

        payload = struct_pb2.Struct()
        payload.update(
            {
                "system_prompt": system_prompt,
                "user_id": user_id,
                "chat_history": [
                    {"role": m.role, "content": m.content, "timestamp": m.timestamp.isoformat()}
                    for m in chat_history[-8:]
                ],
            }
        )

        request = dialogflow_cx_v3.DetectIntentRequest(
            session=session,
            query_input=dialogflow_cx_v3.QueryInput(
                text=dialogflow_cx_v3.TextInput(text=user_message),
                language_code="en",
            ),
            query_params=dialogflow_cx_v3.QueryParameters(payload=payload),
        )

        start = time.perf_counter()
        try:
            client = self._client_or_raise()
            response = await asyncio.wait_for(client.detect_intent(request=request), timeout=30)
        except asyncio.TimeoutError as exc:
            raise HTTPException(status_code=504, detail="AI timed out (>30s).") from exc
        except GoogleAPICallError as exc:
            raise HTTPException(status_code=503, detail="AI service unavailable right now.") from exc

        latency_ms = int((time.perf_counter() - start) * 1000)
        log.info("Agent responded", extra={"user_id": user_id, "extra_fields": {"latency_ms": latency_ms}})

        text_reply = _extract_text_reply(response)
        if not text_reply:
            return _fallback("Sorry, I couldn't generate a response right now. Try again!", tool_used=None)

        try:
            return json.loads(text_reply)
        except json.JSONDecodeError:
            log.warning(
                "Agent reply not JSON; wrapping fallback",
                extra={"user_id": user_id, "extra_fields": {"raw": text_reply[:500]}},
            )
            return _fallback(text_reply, tool_used=None)


def _extract_text_reply(response: Any) -> str:
    try:
        msgs = response.query_result.response_messages
        parts: list[str] = []
        for m in msgs:
            if getattr(m, "text", None) and m.text.text:
                parts.extend(list(m.text.text))
        return "\n".join([p for p in parts if p]).strip()
    except Exception:
        return ""


def _fallback(answer: str, tool_used: str | None) -> dict[str, Any]:
    return {
        "answer": answer,
        "jargon_terms": [],
        "suggested_followups": [],
        "related_sub_topics": [],
        "tool_used": tool_used,
        "sources": [],
        "journey_step_hint": None,
    }


agent_service = AgentService()
