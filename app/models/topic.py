"""Topic metadata, sub-topics, and user progress."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class SubTopic(BaseModel):
    id: str
    title: str
    description: str


class Topic(BaseModel):
    id: str
    title: str
    description: str
    icon_name: str
    difficulty_tags: list[str] = Field(default_factory=list)
    sample_questions: list[str] = Field(default_factory=list)
    sub_topics: list[SubTopic] = Field(default_factory=list)


class TopicSummary(BaseModel):
    id: str
    title: str
    description: str
    icon_name: str
    difficulty_tags: list[str] = Field(default_factory=list)
    sample_questions: list[str] = Field(default_factory=list)
    sub_topics: list[SubTopic] = Field(default_factory=list)


class ProgressRecord(BaseModel):
    user_id: str
    topic_id: str
    percent_complete: float = 0.0
    sub_topics_seen: list[str] = Field(default_factory=list)
    last_active: datetime | None = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)
