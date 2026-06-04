"""Chat endpoints — the main AI orchestration surface."""

from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request

from app.core.rate_limiter import rate_limit
from app.core.security import get_current_user, get_optional_user
from app.db import collections
from app.db.mongodb import get_database
from app.models.chat import ChatMessage, ChatRequest, ChatResponse
from app.services.agent_service import agent_service
from app.services.progress_service import progress_service
from app.services.prompt_builder import build_system_prompt
from app.services.quiz_service import quiz_service
from app.services.response_formatter import format_agent_response
from app.utils.logger import get_logger


router = APIRouter(prefix="/chat", tags=["chat"])
log = get_logger("chat")


@router.post("/message", response_model=ChatResponse, dependencies=[Depends(rate_limit)])
async def post_message(
    request: Request,
    payload: ChatRequest,
    user=Depends(get_optional_user),
    db=Depends(get_database),
) -> ChatResponse:
    # 1. Resolve user identity (real user or guest session)
    user_id = str(user._id) if user else (request.client.host if request.client else "anonymous")

    # Validate topic early so we never 500 on bad IDs.
    topic_doc = await db[collections.TOPICS].find_one({"id": payload.topic_id}, {"_id": 0})
    if not topic_doc:
        raise HTTPException(status_code=404, detail="Unknown topic_id")

    # 2. Fetch PersonalisationContext
    personalisation = await quiz_service.get_personalisation(db, user_id, payload.topic_id)

    # 6. Generate or reuse session_id
    session_id = payload.session_id or str(uuid.uuid4())

    # 3. Fetch last 10 ChatMessage records
    cursor = (
        db[collections.CHAT_HISTORY]
        .find({"user_id": user_id, "topic_id": payload.topic_id, "session_id": session_id}, {"_id": 0})
        .sort("created_at", -1)
        .limit(10)
    )
    history_docs = await cursor.to_list(length=10)
    history_docs.reverse()
    chat_history = [ChatMessage(**d["message"]) for d in history_docs if isinstance(d, dict) and isinstance(d.get("message"), dict)]

    # 4. Build a concise chat history summary
    last = chat_history[-6:]
    summary_lines = []
    for m in last:
        role = "You" if m.role == "user" else "FinBro"
        summary_lines.append(f"{role}: {m.content[:180]}")
    chat_history_summary = "\n".join(summary_lines) if summary_lines else None

    # 5. Build system prompt
    system_prompt = build_system_prompt(
        topic_id=payload.topic_id,
        sub_topic_id=payload.sub_topic_id,
        personalisation=personalisation,
        chat_history_summary=chat_history_summary,
        current_journey_step=None,
    )

    # 7. Call Agent Builder
    user_message = ChatMessage(role="user", content=payload.message)
    try:
        raw = await agent_service.send_message(
            user_id=user_id,
            session_id=session_id,
            user_message=payload.message,
            system_prompt=system_prompt,
            chat_history=chat_history,
        )
    except HTTPException as exc:
        log.warning("Agent failure", extra={"user_id": user_id, "extra_fields": {"status": exc.status_code}})
        raw = {
            "answer": "FinBro’s having a moment 🥲. Try again in a few seconds.",
            "jargon_terms": [],
            "suggested_followups": ["Can you explain it simpler?", "What should I do first?"],
            "related_sub_topics": [],
            "tool_used": None,
            "sources": [],
            "journey_step_hint": None,
        }
    except Exception as exc:  # noqa: BLE001
        log.error("Unexpected agent error", extra={"user_id": user_id, "extra_fields": {"error": str(exc)}})
        raw = {
            "answer": "FinBro’s having a moment 🥲. Try again in a few seconds.",
            "jargon_terms": [],
            "suggested_followups": [],
            "related_sub_topics": [],
            "tool_used": None,
            "sources": [],
            "journey_step_hint": None,
        }

    # 8. Parse into ChatResponse
    response = format_agent_response(raw, session_id=session_id, user_message=payload.message)

    # 9. Save user + assistant messages
    now = datetime.utcnow()
    await db[collections.CHAT_HISTORY].insert_many(
        [
            {
                "user_id": user_id,
                "topic_id": payload.topic_id,
                "session_id": session_id,
                "created_at": now,
                "message": user_message.model_dump(),
            },
            {
                "user_id": user_id,
                "topic_id": payload.topic_id,
                "session_id": session_id,
                "created_at": now,
                "message": response.message.model_dump(),
            },
        ]
    )

    # 10. Update topic_progress
    if payload.sub_topic_id:
        await progress_service.update_progress(db, user_id, payload.topic_id, payload.sub_topic_id, 0)

    # 11. Return
    return response


@router.get("/history/{topic_id}", response_model=list[ChatMessage])
async def get_history(topic_id: str, user=Depends(get_current_user), db=Depends(get_database)) -> list[ChatMessage]:
    user_id = str(user._id)
    cursor = (
        db[collections.CHAT_HISTORY]
        .find({"user_id": user_id, "topic_id": topic_id}, {"_id": 0})
        .sort("created_at", 1)
        .limit(50)
    )
    docs = await cursor.to_list(length=50)
    return [ChatMessage(**d["message"]) for d in docs if isinstance(d, dict) and isinstance(d.get("message"), dict)]


@router.delete("/history/{topic_id}")
async def delete_history(topic_id: str, user=Depends(get_current_user), db=Depends(get_database)) -> dict:
    user_id = str(user._id)
    await db[collections.CHAT_HISTORY].delete_many({"user_id": user_id, "topic_id": topic_id})
    return {"deleted": True, "message": "Conversation cleared. Fresh start!"}


@router.get("/session/{topic_id}")
async def get_session(topic_id: str, request: Request, user=Depends(get_optional_user), db=Depends(get_database)) -> dict[str, str]:
    user_id = str(user._id) if user else (request.client.host if request.client else "anonymous")
    doc = await db[collections.TOPIC_PROGRESS].find_one({"user_id": user_id, "topic_id": topic_id})
    session_id = doc.get("active_session_id") if doc else None
    if not isinstance(session_id, str) or not session_id:
        session_id = str(uuid.uuid4())
        await db[collections.TOPIC_PROGRESS].update_one(
            {"user_id": user_id, "topic_id": topic_id},
            {"$set": {"active_session_id": session_id, "updated_at": datetime.utcnow()}},
            upsert=True,
        )
    return {"session_id": session_id}
