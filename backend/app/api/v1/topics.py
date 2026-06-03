"""Topic metadata and journey endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_optional_user
from app.db import collections
from app.db.mongodb import get_database
from app.models.chat import TopicJourneyResponse
from app.models.topic import ProgressRecord, SubTopic, TopicSummary
from app.services.agent_service import agent_service
from app.services.progress_service import progress_service
from app.services.quiz_service import quiz_service
from app.services.response_formatter import format_journey_response


router = APIRouter(prefix="/topics", tags=["topics"])


@router.get("/", response_model=list[TopicSummary])
async def list_topics(db=Depends(get_database)) -> list[TopicSummary]:
    cursor = db[collections.TOPICS].find({}, {"_id": 0})
    topics = await cursor.to_list(length=100)
    return [TopicSummary(**t) for t in topics if isinstance(t, dict)]


@router.get("/{topic_id}/progress", response_model=ProgressRecord)
async def get_progress(topic_id: str, user=Depends(get_optional_user), db=Depends(get_database)) -> ProgressRecord:
    user_id = str(user._id) if user else "anonymous"
    return await progress_service.get_progress(db, user_id, topic_id)


@router.post("/{topic_id}/progress", response_model=ProgressRecord)
async def post_progress(
    topic_id: str,
    body: dict,
    user=Depends(get_optional_user),
    db=Depends(get_database),
) -> ProgressRecord:
    user_id = str(user._id) if user else "anonymous"
    sub_topic_id = body.get("sub_topic_id")
    time_spent_seconds = int(body.get("time_spent_seconds", 0))
    if not isinstance(sub_topic_id, str) or not sub_topic_id:
        raise HTTPException(status_code=400, detail="sub_topic_id required")
    return await progress_service.update_progress(db, user_id, topic_id, sub_topic_id, time_spent_seconds)


@router.get("/{topic_id}/journey", response_model=TopicJourneyResponse)
async def get_journey(topic_id: str, user=Depends(get_optional_user), db=Depends(get_database)) -> TopicJourneyResponse:
    user_id = str(user._id) if user else "anonymous"
    personalisation = await quiz_service.get_personalisation(db, user_id, topic_id)

    journey_doc = await db[collections.DEFAULT_JOURNEYS].find_one({"topic_id": topic_id}, {"_id": 0})
    default_steps = journey_doc.get("steps", []) if journey_doc else []

    # Try to personalise via the agent; fall back to seeded journey.
    gemini_output = None
    if personalisation is not None:
        try:
            prompt = (
                "Return JSON only: {\"steps\": [{\"step_number\":1,\"title\":\"...\",\"content\":\"...\",\"tone\":\"hook\",\"meme_tag\":null}, ...]} "
                f"for topic_id={topic_id}, experience={personalisation.experience_level}, goal={personalisation.primary_goal}."
            )
            gemini_output = await agent_service.send_message(
                user_id=user_id,
                session_id=f"journey-{uuid.uuid4()}",
                user_message=f"Generate a 6-step journey for {topic_id}.",
                system_prompt=prompt,
                chat_history=[],
            )
        except Exception:
            gemini_output = None

    return format_journey_response(topic_id, gemini_output, default_steps, personalisation)


@router.get("/{topic_id}/sub-topics", response_model=list[SubTopic])
async def get_sub_topics(topic_id: str, user=Depends(get_optional_user), db=Depends(get_database)) -> list[SubTopic]:
    topic = await db[collections.TOPICS].find_one({"id": topic_id}, {"_id": 0})
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    sub_topics = [SubTopic(**st) for st in topic.get("sub_topics", []) if isinstance(st, dict)]

    if user is None:
        return sub_topics
    ctx = await quiz_service.get_personalisation(db, str(user._id), topic_id)
    if not ctx:
        return sub_topics

    # Use the same ordering as quiz recommendation (by IDs)
    recommended_ids = await quiz_service.recommended_subtopic_order(db, topic_id, ctx.experience_level)
    by_id = {st.id: st for st in sub_topics}
    ordered = [by_id[sid] for sid in recommended_ids if sid in by_id]
    remaining = [st for st in sub_topics if st.id not in set(recommended_ids)]
    return ordered + remaining
