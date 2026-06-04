"""Quiz routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user, get_optional_user
from app.db import collections
from app.db.mongodb import get_database
from app.models.quiz import PersonalisationContext, QuizQuestion, QuizResponse, QuizSubmission
from app.services.quiz_service import quiz_service


router = APIRouter(prefix="/quiz", tags=["quiz"])


@router.get("/questions/{topic_id}", response_model=list[QuizQuestion])
async def get_questions(topic_id: str, db=Depends(get_database)) -> list[QuizQuestion]:
    doc = await db[collections.QUIZ_QUESTIONS].find_one({"topic_id": topic_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Quiz not found")
    questions = doc.get("questions", [])
    return [QuizQuestion(**q) for q in questions if isinstance(q, dict)]


@router.post("/submit/{topic_id}", response_model=QuizResponse)
async def submit_quiz(
    topic_id: str,
    submission: QuizSubmission,
    user=Depends(get_optional_user),
    db=Depends(get_database),
) -> QuizResponse:
    user_id = str(user._id) if user else "anonymous"
    if submission.topic_id != topic_id:
        raise HTTPException(status_code=400, detail="topic_id mismatch")
    return await quiz_service.process_submission(db, user_id, submission)


@router.get("/personalisation/{topic_id}", response_model=PersonalisationContext)
async def get_personalisation(topic_id: str, user=Depends(get_optional_user), db=Depends(get_database)) -> PersonalisationContext:
    user_id = str(user._id) if user else "anonymous"
    ctx = await quiz_service.get_personalisation(db, user_id, topic_id)
    if not ctx:
        raise HTTPException(status_code=404, detail="Personalisation not found")
    return ctx


@router.delete("/personalisation/{topic_id}")
async def delete_personalisation(topic_id: str, user=Depends(get_current_user), db=Depends(get_database)) -> dict[str, bool]:
    deleted = await quiz_service.delete_personalisation(db, str(user._id), topic_id)
    return {"reset": deleted}
