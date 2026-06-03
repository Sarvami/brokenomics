"""Seed topics, quiz questions, and default journeys into MongoDB.

Idempotent upserts so you can rerun safely.

Run:
  python -m scripts.seed_topics
"""

from __future__ import annotations

import asyncio
from typing import Any

from motor.motor_asyncio import AsyncIOMotorClient

from app.config import settings
from app.db import collections


TOPICS: list[dict[str, Any]] = [
    {
        "id": "mutual_funds",
        "title": "Mutual Funds",
        "description": "SIPs, ELSS, index funds — the beginner-friendly investing lane.",
        "icon_name": "mutual_funds",
        "difficulty_tags": ["beginner", "long_term"],
        "sample_questions": [
            "What is a SIP?",
            "SIP vs lumpsum — what should I do?",
            "What is NAV and why does it change?",
            "ELSS for 80C — worth it?",
            "Index fund vs active fund?",
        ],
        "sub_topics": [
            {"id": "sip_basics", "title": "SIP basics", "description": "How SIP works and why it’s popular."},
            {"id": "lumpsum_vs_sip", "title": "Lumpsum vs SIP", "description": "When each makes sense."},
            {"id": "nav_basics", "title": "NAV", "description": "The price of a mutual fund unit."},
            {"id": "elss_80c", "title": "ELSS & 80C", "description": "Tax-saving funds in India."},
            {"id": "index_funds", "title": "Index funds", "description": "Low-cost market-tracking funds."},
        ],
    },
    {
        "id": "stocks_trading",
        "title": "Stocks & Trading",
        "description": "Shares, NSE/BSE, and how prices move (without the hype).",
        "icon_name": "stocks",
        "difficulty_tags": ["beginner", "risk"],
        "sample_questions": [
            "What is a share?",
            "NSE vs BSE — what’s the difference?",
            "What is market cap?",
            "How do stock prices change?",
            "What is a limit order?",
        ],
        "sub_topics": [
            {"id": "shares_basics", "title": "Shares 101", "description": "Ownership, voting, profits."},
            {"id": "nse_bse", "title": "NSE vs BSE", "description": "Indian stock exchanges."},
            {"id": "price_basics", "title": "Price movement", "description": "Demand, news, expectations."},
            {"id": "orders", "title": "Orders", "description": "Market vs limit orders."},
            {"id": "risk_management", "title": "Risk basics", "description": "Volatility and position sizing."},
        ],
    },
    {
        "id": "banking",
        "title": "Banking",
        "description": "Savings accounts, FDs/RDs, and smart everyday money habits.",
        "icon_name": "banking",
        "difficulty_tags": ["beginner"],
        "sample_questions": [
            "What’s a zero-balance account?",
            "FD vs RD — which one is better?",
            "How does savings interest work?",
            "How safe is my money in a bank?",
            "What is KYC?",
        ],
        "sub_topics": [
            {"id": "savings_interest", "title": "Savings interest", "description": "How banks pay interest."},
            {"id": "fd_basics", "title": "Fixed deposits", "description": "Returns, lock-in, tax."},
            {"id": "rd_basics", "title": "Recurring deposits", "description": "Monthly saving discipline."},
            {"id": "zero_balance", "title": "Zero balance", "description": "Accounts with no minimum balance."},
            {"id": "kyc", "title": "KYC", "description": "Why verification is required in India."},
        ],
    },
    {
        "id": "loans_credit",
        "title": "Loans & Credit",
        "description": "EMIs, credit scores, and how debt can help or hurt.",
        "icon_name": "loans",
        "difficulty_tags": ["beginner", "important"],
        "sample_questions": [
            "What is EMI?",
            "What is a credit score?",
            "Home loan vs personal loan?",
            "Why do interest rates matter?",
            "How to improve my credit score?",
        ],
        "sub_topics": [
            {"id": "emi_basics", "title": "EMI", "description": "How monthly repayments work."},
            {"id": "credit_score", "title": "Credit score", "description": "CIBIL basics."},
            {"id": "loan_types", "title": "Loan types", "description": "Secured vs unsecured loans."},
            {"id": "interest_rates", "title": "Interest rates", "description": "Fixed vs floating."},
            {"id": "credit_habits", "title": "Good credit habits", "description": "Paying on time, utilisation."},
        ],
    },
    {
        "id": "taxes_saving",
        "title": "Taxes & Saving",
        "description": "80C, ITR basics, and legal tax-saving in India.",
        "icon_name": "tax",
        "difficulty_tags": ["beginner", "practical"],
        "sample_questions": [
            "What is 80C?",
            "ELSS vs PPF vs NPS?",
            "What is ITR and who should file?",
            "Old vs new tax regime?",
            "How to save tax legally?",
        ],
        "sub_topics": [
            {"id": "80c", "title": "80C", "description": "Deductions and limits."},
            {"id": "itr_basics", "title": "ITR basics", "description": "Filing overview."},
            {"id": "regimes", "title": "Old vs New regime", "description": "Trade-offs."},
            {"id": "elss_vs_ppf", "title": "ELSS vs PPF", "description": "Lock-in, risk, return."},
            {"id": "nps", "title": "NPS", "description": "Retirement + tax angle."},
        ],
    },
    {
        "id": "investing_101",
        "title": "Investing 101",
        "description": "Risk vs return, diversification, and starting early.",
        "icon_name": "investing",
        "difficulty_tags": ["beginner"],
        "sample_questions": [
            "What is diversification?",
            "What is inflation and why it matters?",
            "How to start investing as a student?",
            "What’s the difference between saving and investing?",
            "How much risk should I take?",
        ],
        "sub_topics": [
            {"id": "risk_return", "title": "Risk vs return", "description": "The core trade-off."},
            {"id": "diversification", "title": "Diversification", "description": "Don’t bet the farm."},
            {"id": "inflation", "title": "Inflation", "description": "Why cash loses value."},
            {"id": "time_value", "title": "Start early", "description": "Compounding basics."},
            {"id": "asset_classes", "title": "Asset classes", "description": "Equity, debt, gold, cash."},
        ],
    },
]


def quiz_questions_for(topic_id: str) -> dict[str, Any]:
    return {
        "topic_id": topic_id,
        "questions": [
            {
                "question_id": "experience_q1",
                "question_text": "How would you describe your knowledge of this topic?",
                "options": ["Never heard of it", "Heard the name", "Know the basics", "I have experience"],
                "option_type": "single",
            },
            {
                "question_id": "goal_q2",
                "question_text": "What’s your main goal right now?",
                "options": ["Just learning", "Want to start investing", "Comparing options", "Saving tax"],
                "option_type": "single",
            },
            {
                "question_id": "savings_q3",
                "question_text": "How much can you set aside each month?",
                "options": ["Under ₹2,000", "₹2,000–₹10,000", "₹10,000+", "Rather not say"],
                "option_type": "single",
            },
        ],
    }


def default_journey_for(topic_id: str) -> dict[str, Any]:
    if topic_id == "mutual_funds":
        steps = [
            {
                "step_number": 1,
                "title": "rn: watching money disappear every month 💸",
                "content": "If money feels like it vanishes after UPI spends, you’re not alone — let’s fix the system.",
                "tone": "hook",
                "meme_tag": "money_vanish",
            },
            {
                "step_number": 2,
                "title": "Mutual fund in 1 sentence",
                "content": "A mutual fund pools money from many people and invests it in assets like stocks/bonds.",
                "tone": "explain",
            },
            {
                "step_number": 3,
                "title": "How SIP works",
                "content": "Your ₹500/month → fund → diversified basket → you own units (NAV changes daily).",
                "tone": "mechanism",
            },
            {
                "step_number": 4,
                "title": "Numbers (example)",
                "content": "If you invest ₹500/month for 10 years at 12% annualised (example), it can grow meaningfully over time (not guaranteed).",
                "tone": "numbers",
            },
            {
                "step_number": 5,
                "title": "Honest truth",
                "content": "Markets go down sometimes. Returns aren’t guaranteed — time in market matters.",
                "tone": "honest",
            },
            {
                "step_number": 6,
                "title": "Action plan",
                "content": "Step 1: emergency fund. Step 2: pick a diversified fund category. Step 3: start a small SIP and increase slowly.",
                "tone": "action",
            },
        ]
    else:
        steps = [
            {
                "step_number": 1,
                "title": "Let’s get you sorted",
                "content": "We’ll go from confusion → clarity → action in 6 steps.",
                "tone": "hook",
            },
            {
                "step_number": 2,
                "title": "What this is",
                "content": "A simple explanation of the core idea in India-first terms.",
                "tone": "explain",
            },
            {
                "step_number": 3,
                "title": "How it works",
                "content": "A clear mechanism flow you can repeat back.",
                "tone": "mechanism",
            },
            {
                "step_number": 4,
                "title": "Numbers",
                "content": "A realistic INR example so it feels tangible.",
                "tone": "numbers",
            },
            {
                "step_number": 5,
                "title": "Be honest",
                "content": "Risks, common traps, and what NOT to do.",
                "tone": "honest",
            },
            {
                "step_number": 6,
                "title": "Next action",
                "content": "A safe first step you can do this week.",
                "tone": "action",
            },
        ]
    return {"topic_id": topic_id, "steps": steps}


async def main() -> None:
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]

    for topic in TOPICS:
        await db[collections.TOPICS].update_one({"id": topic["id"]}, {"$set": topic}, upsert=True)

    for topic in TOPICS:
        topic_id = topic["id"]
        await db[collections.QUIZ_QUESTIONS].update_one(
            {"topic_id": topic_id},
            {"$set": quiz_questions_for(topic_id)},
            upsert=True,
        )

        await db[collections.DEFAULT_JOURNEYS].update_one(
            {"topic_id": topic_id},
            {"$set": default_journey_for(topic_id)},
            upsert=True,
        )

    client.close()
    print(f"Seeded topics/quizzes/journeys for {len(TOPICS)} topics")


if __name__ == "__main__":
    asyncio.run(main())

