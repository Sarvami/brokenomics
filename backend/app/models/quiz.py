"""Quiz models for personalisation."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class QuizQuestion(BaseModel):
    question_id: str
    question_text: str
    options: list[str]
    option_type: Literal["single", "multiple"]


class QuizAnswer(BaseModel):
    question_id: str
    selected_options: list[str]


class QuizSubmission(BaseModel):
    topic_id: str
    answers: list[QuizAnswer]


class PersonalisationContext(BaseModel):
    topic_id: str
    user_id: str
    experience_level: Literal[
        "complete_beginner",
        "heard_of_it",
        "some_experience",
        "intermediate",
    ]
    primary_goal: Literal[
        "just_curious",
        "want_to_invest",
        "compare_options",
        "tax_saving",
        "other",
    ]
    monthly_savings_range: (
        Literal["under_2k", "2k_10k", "10k_plus", "prefer_not_to_say"] | None
    ) = None
    preferred_tone: Literal["explain_like_im_5", "give_me_the_facts", "show_me_numbers"]
    created_at: datetime
    updated_at: datetime


class QuizResponse(BaseModel):
    topic_id: str
    personalisation: PersonalisationContext
    recommended_subtopic_order: list[str]
