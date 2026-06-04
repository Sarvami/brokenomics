"""Converts agent output into frontend-friendly response models."""

from __future__ import annotations

from typing import Any

from app.models.chat import ChatMessage, ChatResponse, FlowchartStep, JargonTerm, TopicJourneyResponse
from app.models.quiz import PersonalisationContext


def format_agent_response(raw_response: dict[str, Any], session_id: str, user_message: str) -> ChatResponse:
    _ = user_message

    answer = raw_response.get("answer")
    if not isinstance(answer, str) or not answer.strip():
        answer = "Sorry, I couldn't generate a response right now. Try asking again!"

    jargon_terms: list[JargonTerm] = []
    if isinstance(raw_response.get("jargon_terms"), list):
        for item in raw_response["jargon_terms"]:
            if isinstance(item, dict) and isinstance(item.get("term"), str) and isinstance(item.get("plain_english"), str):
                jargon_terms.append(JargonTerm(term=item["term"], plain_english=item["plain_english"]))

    suggested_followups = raw_response.get("suggested_followups")
    if not isinstance(suggested_followups, list):
        suggested_followups = []

    related_sub_topics = raw_response.get("related_sub_topics")
    if not isinstance(related_sub_topics, list):
        related_sub_topics = []

    sources = raw_response.get("sources")
    if not isinstance(sources, list):
        sources = []

    tool_used = raw_response.get("tool_used")
    if tool_used not in ("elastic_mcp", "web_search", None):
        tool_used = None

    journey_step_hint = raw_response.get("journey_step_hint")
    journey_step = int(journey_step_hint) if isinstance(journey_step_hint, int) else None

    assistant_message = ChatMessage(
        role="assistant",
        content=answer,
        sources=[str(s) for s in sources if isinstance(s, (str, int))],
        tool_used=tool_used,
        jargon_terms=jargon_terms,
    )

    return ChatResponse(
        session_id=session_id,
        message=assistant_message,
        suggested_followups=[str(x) for x in suggested_followups if isinstance(x, str)][:3],
        related_sub_topics=[str(x) for x in related_sub_topics if isinstance(x, str)][:10],
        journey_step=journey_step,
    )


def format_journey_response(
    topic_id: str,
    gemini_journey_output: dict[str, Any] | None,
    default_journey: list[dict[str, Any]],
    personalisation: PersonalisationContext | None,
) -> TopicJourneyResponse:
    steps_raw: Any = default_journey
    personalised = False

    if gemini_journey_output and isinstance(gemini_journey_output.get("steps"), list):
        steps_raw = gemini_journey_output["steps"]
        personalised = True

    steps: list[FlowchartStep] = []
    for item in steps_raw:
        if isinstance(item, dict):
            try:
                steps.append(FlowchartStep(**item))
            except Exception:
                continue

    return TopicJourneyResponse(
        topic_id=topic_id,
        steps=steps,
        personalisation_applied=personalised and personalisation is not None,
    )
