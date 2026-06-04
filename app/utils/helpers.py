"""Small shared helpers."""

from __future__ import annotations

import uuid


def ensure_request_id(existing: str | None) -> str:
    if existing and existing.strip():
        return existing.strip()
    return str(uuid.uuid4())
