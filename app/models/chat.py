"""Chat models for requests/responses and stored messages."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


MessageRole = Literal["user", "assistant", "system"]


class JargonTerm(BaseModel):
    term: str
    plain_english: str


class ChatMessage(BaseModel):
    role: MessageRole
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    sources: list[str] = Field(default_factory=list)
    tool_used: str | None = None  # "elastic_mcp" | "web_search" | None
    jargon_terms: list[JargonTerm] = Field(default_factory=list)


class ChatRequest(BaseModel):
    topic_id: str
    sub_topic_id: str | None = None
    message: str = Field(max_length=500)
    session_id: str | None = None


class ChatResponse(BaseModel):
    session_id: str
    message: ChatMessage
    suggested_followups: list[str] = Field(default_factory=list)
    related_sub_topics: list[str] = Field(default_factory=list)
    journey_step: int | None = None


class FlowchartStep(BaseModel):
    step_number: int
    title: str
    content: str
    tone: Literal["hook", "explain", "mechanism", "numbers", "honest", "action"]
    meme_tag: str | None = None


class TopicJourneyResponse(BaseModel):
    topic_id: str
    steps: list[FlowchartStep]
    personalisation_applied: bool
