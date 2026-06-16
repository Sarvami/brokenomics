from __future__ import annotations

import pytest

from app.db import collections


@pytest.mark.asyncio
async def test_get_quiz_questions(client, mock_db):
    await mock_db[collections.QUIZ_QUESTIONS].insert_one(
        {
            "topic_id": "mutual-funds",
            "questions": [
                {
                    "question_id": "experience_q1",
                    "question_text": "How would you describe your knowledge?",
                    "options": ["Never heard of it"],
                    "option_type": "single",
                }
            ],
        }
    )

    res = await client.get("/api/v1/quiz/questions/mutual-funds")
    assert res.status_code == 200
    questions = res.json()
    assert len(questions) == 1
    assert questions[0]["question_id"] == "experience_q1"


@pytest.mark.asyncio
async def test_submit_quiz_persists_personalisation(client, mock_db):
    await mock_db[collections.TOPICS].insert_one(
        {
            "id": "mutual-funds",
            "title": "Mutual Funds",
            "sub_topics": [
                {"id": "sip-basics", "title": "SIP basics"},
                {"id": "nav-explained", "title": "NAV"},
            ],
        }
    )

    res = await client.post(
        "/api/v1/quiz/submit/mutual-funds",
        json={
            "topic_id": "mutual-funds",
            "answers": [
                {"question_id": "experience_q1", "selected_options": ["Never heard of it"]},
                {"question_id": "goal_q2", "selected_options": ["Want to start investing"]},
                {"question_id": "savings_q3", "selected_options": ["Under ₹2,000"]},
            ],
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["topic_id"] == "mutual-funds"
    assert body["personalisation"]["experience_level"] == "complete_beginner"
    assert body["personalisation"]["primary_goal"] == "want_to_invest"
    assert body["personalisation"]["monthly_savings_range"] == "under_2k"
    assert body["recommended_subtopic_order"] == ["sip-basics", "nav-explained"]

    stored = await mock_db[collections.QUIZ_RESPONSES].find_one({"topic_id": "mutual-funds"})
    assert stored is not None
    assert stored["experience_level"] == "complete_beginner"


@pytest.mark.asyncio
async def test_submit_quiz_topic_id_mismatch_returns_400(client):
    res = await client.post(
        "/api/v1/quiz/submit/mutual-funds",
        json={"topic_id": "stocks-trading", "answers": []},
    )
    assert res.status_code == 400
