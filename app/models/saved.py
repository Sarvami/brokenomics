"""Saved items/bookmarks."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class SavedItem(BaseModel):
    user_id: str
    item_type: Literal["chat_message", "topic", "sub_topic", "external_link"]
    item_id: str
    title: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
