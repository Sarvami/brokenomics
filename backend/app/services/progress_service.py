"""Topic progress read/write logic."""

from __future__ import annotations

from datetime import datetime

from app.db import collections
from app.models.topic import ProgressRecord


class ProgressService:
    async def get_progress(self, db, user_id: str, topic_id: str) -> ProgressRecord:
        doc = await db[collections.TOPIC_PROGRESS].find_one({"user_id": user_id, "topic_id": topic_id})
        if not doc:
            return ProgressRecord(user_id=user_id, topic_id=topic_id)
        return ProgressRecord(**doc)

    async def update_progress(
        self,
        db,
        user_id: str,
        topic_id: str,
        sub_topic_id: str,
        time_spent_seconds: int,
    ) -> ProgressRecord:
        _ = time_spent_seconds
        now = datetime.utcnow()
        existing = await db[collections.TOPIC_PROGRESS].find_one({"user_id": user_id, "topic_id": topic_id})

        seen = set(existing.get("sub_topics_seen", []) if isinstance(existing, dict) else [])
        seen.add(sub_topic_id)

        record = ProgressRecord(
            user_id=user_id,
            topic_id=topic_id,
            percent_complete=min(100.0, float(len(seen)) * 10.0),
            sub_topics_seen=sorted(seen),
            last_active=now,
            updated_at=now,
        )

        await db[collections.TOPIC_PROGRESS].update_one(
            {"user_id": user_id, "topic_id": topic_id},
            {"$set": record.model_dump()},
            upsert=True,
        )
        return record


progress_service = ProgressService()
