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
        "id": "mutual-funds",
        "title": "Mutual Funds",
        "description": "SIPs, ELSS, index funds — the beginner-friendly investing lane.",
        "icon_name": "mutual-funds",
        "difficulty_tags": ["beginner", "long_term"],
        "sample_questions": [
            "What is a SIP?",
            "SIP vs lumpsum — what should I do?",
            "What is NAV and why does it change?",
            "ELSS for 80C — worth it?",
            "Index fund vs active fund?",
        ],
        "sub_topics": [
            {"id": "what-are-mf", "title": "What Even Is a Mutual Fund?", "description": "If SIP is your parents' answer to everything, time to actually understand why."},
            {"id": "types-of-mf", "title": "Equity vs Debt vs Hybrid", "description": "Not all mutual funds slap the same. Know what you're buying."},
            {"id": "sip-basics", "title": "SIP 101", "description": "Systematic Investment Plan — the 'set it and forget it' of investing."},
            {"id": "nav-explained", "title": "NAV Explained", "description": "It's not your network access value. It's what your fund is actually worth."},
            {"id": "direct-vs-regular", "title": "Direct vs Regular Plans", "description": "One of them is literally stealing from you. We're not joking."},
            {"id": "elss", "title": "ELSS — Save Tax & Build Wealth", "description": "Two birds, one stone. Save on taxes and build wealth at the same time."},
        ],
    },
    {
        "id": "stocks-trading",
        "title": "Stocks & Trading",
        "description": "Shares, NSE/BSE, and how prices move (without the hype).",
        "icon_name": "stocks-trading",
        "difficulty_tags": ["beginner", "risk"],
        "sample_questions": [
            "What is a share?",
            "NSE vs BSE — what’s the difference?",
            "What is market cap?",
            "How do stock prices change?",
            "What is a limit order?",
        ],
        "sub_topics": [
            {"id": "stock-basics", "title": "What Is a Stock, Actually?", "description": "You own a tiny piece of Infosys. No, really. That's what a stock is."},
            {"id": "nse-bse", "title": "NSE vs BSE — What's the Diff?", "description": "India has two stock exchanges. Both matter. Here's why."},
            {"id": "demat-trading", "title": "Demat & Trading Accounts", "description": "Before you buy your first share, you need these two things."},
            {"id": "fundamental-analysis", "title": "Reading a Company's Report Card", "description": "P/E ratio, EPS, balance sheet — less scary than they sound."},
            {"id": "technical-analysis", "title": "Charts & Candlesticks", "description": "The art of reading stock charts without losing your mind."},
            {"id": "indices", "title": "Sensex & Nifty Decoded", "description": "Why do people freak out when Sensex drops 500 points?"},
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
            {"id": "savings-vs-current", "title": "Savings vs Current Account", "description": "One earns interest, one doesn't. Guess which one your business needs."},
            {"id": "fd-rd", "title": "FDs & RDs — Still Worth It?", "description": "Your grandma swears by FDs. Is she wrong, or are you missing out?"},
            {"id": "upi-neft-rtgs", "title": "UPI, NEFT, RTGS, IMPS", "description": "We use UPI daily but most of us have no clue how it actually works."},
            {"id": "credit-score-banking", "title": "How Banks See Your Credit Score", "description": "That three-digit number decides if you get a loan or a no."},
            {"id": "digital-banking", "title": "Neo Banks & Digital Banking", "description": "Fi, Jupiter, Niyo — are these actually better than HDFC?"},
            {"id": "rbi-basics", "title": "What Does RBI Actually Do?", "description": "The boss of all Indian banks. More powerful than your CA."},
        ],
    },
    {
        "id": "loans-credit",
        "title": "Loans & Credit",
        "description": "EMIs, credit scores, and how debt can help or hurt.",
        "icon_name": "loans-credit",
        "difficulty_tags": ["beginner", "important"],
        "sample_questions": [
            "What is EMI?",
            "What is a credit score?",
            "Home loan vs personal loan?",
            "Why do interest rates matter?",
            "How to improve my credit score?",
        ],
        "sub_topics": [
            {"id": "credit-score", "title": "CIBIL Score — Your Financial Identity", "description": "750+ and lenders will chase you. Below 650? Good luck getting approved."},
            {"id": "credit-cards", "title": "Credit Cards Done Right", "description": "Free flights, cashback, and zero interest — if you play by the rules."},
            {"id": "home-loan", "title": "Home Loan 101", "description": "30 years of EMIs. Is it an asset or a trap? Let's find out."},
            {"id": "personal-loan", "title": "Personal Loans — When to Say No", "description": "Easy to get, hard to repay. The fine print nobody reads."},
            {"id": "bnpl", "title": "BNPL — Buy Now, Cry Later?", "description": "Zomato Pay Later, LazyPay, Simpl — harmless convenience or a debt spiral?"},
            {"id": "debt-management", "title": "Getting Out of Debt", "description": "Avalanche vs snowball methods, and why small expenses add up fast."},
        ],
    },
    {
        "id": "taxes-saving",
        "title": "Taxes & Saving",
        "description": "80C, ITR basics, and legal tax-saving in India.",
        "icon_name": "taxes-saving",
        "difficulty_tags": ["beginner", "practical"],
        "sample_questions": [
            "What is 80C?",
            "ELSS vs PPF vs NPS?",
            "What is ITR and who should file?",
            "Old vs new tax regime?",
            "How to save tax legally?",
        ],
        "sub_topics": [
            {"id": "income-tax-slabs", "title": "Income Tax Slabs Explained", "description": "Old regime vs new regime — which one actually saves you more money?"},
            {"id": "80c-deductions", "title": "80C — Your Tax-Saving Toolkit", "description": "PPF, ELSS, LIC, NPS — all the 80C options ranked honestly."},
            {"id": "itr-filing", "title": "Filing ITR Without a CA", "description": "It's not as scary as it looks. We walk through every section."},
            {"id": "gst-basics", "title": "GST — Why Everything Is 18%", "description": "Understanding GST so you stop being confused by your restaurant bill."},
            {"id": "tax-saving-fd", "title": "Tax-Saving FDs & NSC", "description": "Low risk, locked in for 5 years. Good or just boring? Depends on your goals."},
            {"id": "advance-tax", "title": "Advance Tax & TDS", "description": "Freelancers, this one's for you. Don't get surprised at year end."},
        ],
    },
    {
        "id": "investing-101",
        "title": "Investing 101",
        "description": "Risk vs return, diversification, and starting early.",
        "icon_name": "investing-101",
        "difficulty_tags": ["beginner"],
        "sample_questions": [
            "What is diversification?",
            "What is inflation and why it matters?",
            "How to start investing as a student?",
            "What’s the difference between saving and investing?",
            "How much risk should I take?",
        ],
        "sub_topics": [
            {"id": "asset-classes", "title": "Assets: Equity, Debt, Gold, Real Estate", "description": "Four buckets where all money goes. Know each before you invest a rupee."},
            {"id": "risk-return", "title": "Risk vs Return — The Eternal Tradeoff", "description": "Higher return = higher risk. Always. No exceptions. Period."},
            {"id": "compounding", "title": "Compounding — The 8th Wonder", "description": "Einstein said it. Your bank doesn't want you to know it. We'll explain it."},
            {"id": "diversification", "title": "Don't Put All Eggs in One Basket", "description": "Diversification is just a fancy word for 'spread your bets'."},
            {"id": "inflation", "title": "Inflation — The Silent Wealth Killer", "description": "Your ₹100 today is worth ₹96 next year. Yes, really."},
            {"id": "emergency-fund", "title": "Emergency Fund First, Invest Later", "description": "3–6 months of expenses in liquid cash. Non-negotiable."},
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
    if topic_id == "mutual-funds":
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

