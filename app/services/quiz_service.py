"""Quiz answer storage + personalisation logic."""

from __future__ import annotations

from datetime import datetime

from app.db import collections
from app.models.quiz import PersonalisationContext, QuizResponse, QuizSubmission


def _map_experience(option: str) -> str:
    opt = option.lower()
    if "never" in opt:
        return "complete_beginner"
    if "heard" in opt:
        return "heard_of_it"
    if "basics" in opt or "know" in opt:
        return "some_experience"
    if "invest" in opt:
        return "intermediate"
    return "heard_of_it"


def _map_goal(option: str) -> str:
    opt = option.lower()
    if "tax" in opt:
        return "tax_saving"
    if "compare" in opt:
        return "compare_options"
    if "start" in opt or "invest" in opt:
        return "want_to_invest"
    if "learn" in opt or "curious" in opt:
        return "just_curious"
    return "other"


def _map_savings(option: str) -> str | None:
    opt = option.lower()
    if "under" in opt or "2,000" in option or "2000" in opt:
        return "under_2k"
    if "10,000+" in option or "10000+" in opt or ("+" in option and "10" in opt):
        return "10k_plus"
    if "rather" in opt or "prefer" in opt:
        return "prefer_not_to_say"
    if "2,000" in option or "2000" in opt or "10,000" in option or "10000" in opt:
        return "2k_10k"
    return None


def _map_tone(option: str) -> str:
    opt = option.lower()
    if "5" in opt or "simple" in opt:
        return "explain_like_im_5"
    if "facts" in opt or "direct" in opt:
        return "give_me_the_facts"
    if "number" in opt or "math" in opt:
        return "show_me_numbers"
    return "give_me_the_facts"


class QuizService:
    async def process_submission(self, db, user_id: str, submission: QuizSubmission) -> QuizResponse:
        now = datetime.utcnow()
        existing = await db[collections.QUIZ_RESPONSES].find_one(
            {"user_id": user_id, "topic_id": submission.topic_id}
        )
        created_at = existing.get("created_at", now) if existing else now

        exp, goal, savings, tone = "heard_of_it", "just_curious", None, "give_me_the_facts"
        for ans in submission.answers:
            if not ans.selected_options:
                continue
            chosen = ans.selected_options[0]
            qid = ans.question_id.lower()
            if "experience" in qid or qid.endswith("q1"):
                exp = _map_experience(chosen)
            elif "goal" in qid or qid.endswith("q2"):
                goal = _map_goal(chosen)
            elif "savings" in qid or "month" in qid or qid.endswith("q3"):
                savings = _map_savings(chosen)
            elif "tone" in qid:
                tone = _map_tone(chosen)

        personalisation = PersonalisationContext(
            topic_id=submission.topic_id,
            user_id=user_id,
            experience_level=exp,  # type: ignore[arg-type]
            primary_goal=goal,  # type: ignore[arg-type]
            monthly_savings_range=savings,  # type: ignore[arg-type]
            preferred_tone=tone,  # type: ignore[arg-type]
            created_at=created_at,
            updated_at=now,
        )

        await db[collections.QUIZ_RESPONSES].update_one(
            {"user_id": user_id, "topic_id": submission.topic_id},
            {"$set": personalisation.model_dump()},
            upsert=True,
        )

        recommended_order = await self._recommended_subtopic_order(db, submission.topic_id, exp)
        return QuizResponse(
            topic_id=submission.topic_id,
            personalisation=personalisation,
            recommended_subtopic_order=recommended_order,
        )

    async def _recommended_subtopic_order(self, db, topic_id: str, exp: str) -> list[str]:
        topic = await db[collections.TOPICS].find_one({"id": topic_id})
        sub_topics = topic.get("sub_topics", []) if topic else []
        default_order = [st.get("id") for st in sub_topics if isinstance(st, dict) and st.get("id")]
        if not default_order:
            return []

        if exp in {"intermediate", "some_experience"}:
            advanced_keywords = ("tax", "elss", "index", "debt", "score", "itr", "nav", "ratio", "xirr")
            advanced = [x for x in default_order if any(k in x.lower() for k in advanced_keywords)]
            basics = [x for x in default_order if x not in advanced]
            return advanced + basics
        return default_order

    async def recommended_subtopic_order(self, db, topic_id: str, experience_level: str) -> list[str]:
        return await self._recommended_subtopic_order(db, topic_id, experience_level)

    async def get_personalisation(self, db, user_id: str, topic_id: str) -> PersonalisationContext | None:
        doc = await db[collections.QUIZ_RESPONSES].find_one({"user_id": user_id, "topic_id": topic_id})
        if not doc:
            return None
        return PersonalisationContext(**doc)

    async def delete_personalisation(self, db, user_id: str, topic_id: str) -> bool:
        res = await db[collections.QUIZ_RESPONSES].delete_one({"user_id": user_id, "topic_id": topic_id})
        return res.deleted_count > 0


quiz_service = QuizService()
