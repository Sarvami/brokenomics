# Brokenomics — Backend

> Gen Z India-first personal finance co-pilot. FastAPI + MongoDB + Google Cloud Agent Builder.

Production-grade async Python backend. Pairs with the React frontend in `../frontend`.

---

## Architecture

```
React Frontend (Vite)
  │
  │  HTTPS + JWT Bearer
  ▼
FastAPI  ──►  MongoDB Atlas (Motor async)
  │
  ├──►  Google Cloud Agent Builder (Gemini)
  │         └── Elastic MCP (India finance knowledge base)
  │
  └──►  Cloud Run (deployment target)
```

---

## Quick Start

### Prerequisites

- Python 3.12
- MongoDB Atlas connection string (or local MongoDB)
- (Optional) Google Cloud credentials for Agent Builder + Elastic for the knowledge base

### Run locally

```bash
# 1. Clone and enter the backend directory
cd backend

# 2. Copy env template and fill in your values
cp .env.example .env

# 3. Install dependencies
pip install -r requirements.txt

# 4. Seed demo topics
python -m scripts.seed_topics

# 5. Start the dev server
uvicorn app.main:app --reload
```

API runs at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### Run tests

```bash
pytest -q
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values below.

| Variable | Description | Example |
|---|---|---|
| `APP_ENV` | Environment — `development` / `staging` / `production` | `development` |
| `DEBUG` | Enable verbose debug logging | `false` |
| `SECRET_KEY` | JWT signing key — **must be ≥ 32 chars** | `a-very-long-random-string` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT lifetime in minutes | `10080` (7 days) |
| `MONGODB_URL` | MongoDB Atlas connection URI | `mongodb+srv://user:pass@cluster.mongodb.net/` |
| `MONGODB_DB_NAME` | Database name | `genz_finance` |
| `GOOGLE_CLOUD_PROJECT` | GCP project ID | `my-project-123` |
| `GOOGLE_CLOUD_LOCATION` | GCP region | `us-central1` |
| `AGENT_BUILDER_AGENT_ID` | Agent Builder agent ID | `1234567890` |
| `ELASTIC_CLOUD_ID` | Elastic Cloud ID | `cluster:dXMtZWFzdC0x...` |
| `ELASTIC_API_KEY` | Elastic API key | `base64-encoded-key` |
| `ELASTIC_INDEX_NAME` | Knowledge base index | `indian_finance_knowledge` |
| `RATE_LIMIT_PER_MINUTE` | Max chat requests per minute per user | `30` |
| `ALLOWED_ORIGINS` | CORS allowlist as a JSON array string | `'["http://localhost:5173"]'` |
| `REDIS_URL` | Optional — shared rate limiting across replicas | `redis://:pass@host:6379/0` |

---

## API Reference

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | — | Create a new account (`application/json`) |
| `POST` | `/api/v1/auth/login` | — | Login (`application/x-www-form-urlencoded`, fields: `username`, `password`) |
| `POST` | `/api/v1/auth/guest-session` | — | Create a guest JWT (no body required) |
| `GET` | `/api/v1/auth/me` | Bearer | Get current user profile |

### Topics

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/topics` | — | List all topics with metadata |
| `GET` | `/api/v1/topics/{topic_id}` | — | Single topic details |
| `GET` | `/api/v1/topics/{topic_id}/journey` | — | 5-step learning journey for a sub-topic |

### Quiz

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/quiz/questions/{topic_id}` | — | 2-3 personalisation questions |
| `POST` | `/api/v1/quiz/submit/{topic_id}` | Optional | Submit answers, returns `recommended_subtopic_order` |

### Chat

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/chat/message` | Optional | Send a message — returns `message`, `suggested_followups`, `related_sub_topics`, `jargon_terms` |
| `GET` | `/api/v1/chat/history/{topic_id}` | Bearer | Chat history for a topic |

### Profile

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/profile/saved` | Bearer | Get saved items |
| `POST` | `/api/v1/profile/saved` | Bearer | Save an item |
| `GET` | `/api/v1/profile/progress` | Bearer | Get learning progress |

### Health

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Service health + MongoDB connectivity check |

---

## Auth Notes

- Login uses **OAuth2 password flow** — send `username` (email) and `password` as `application/x-www-form-urlencoded`.
- Register uses **JSON** — send `email`, `password`, `first_name`, `last_name`.
- Guest sessions return a short-lived JWT with limited scope — no body required.
- All tokens are **JWT signed with `SECRET_KEY`** using HS256.

---

## Project Structure

```
app/
├── api/v1/
│   ├── auth.py          login, register, guest-session
│   ├── chat.py          chat message + history
│   ├── profile.py       saved items + progress
│   ├── quiz.py          questions + submit
│   ├── router.py        mounts all v1 routers
│   └── topics.py        topics + journey
├── core/
│   ├── exceptions.py    custom HTTP exceptions
│   ├── rate_limiter.py  per-user rate limiting (in-memory + optional Redis)
│   └── security.py      JWT create/verify
├── db/
│   ├── collections.py   typed collection accessors
│   └── mongodb.py       Motor async client + lifespan connect/disconnect
├── models/
│   ├── chat.py          Chat, Message Pydantic models
│   ├── quiz.py          Quiz question/answer models
│   ├── saved.py         SavedItem model
│   ├── topic.py         Topic, SubTopic, JourneyStep models
│   └── user.py          User, GuestUser models
├── services/
│   ├── agent_service.py       Agent Builder integration
│   ├── progress_service.py    progress tracking
│   ├── prompt_builder.py      system prompt construction
│   ├── quiz_service.py        quiz personalisation logic
│   └── response_formatter.py chat response shaping
├── config.py            Pydantic Settings (reads .env)
├── dependencies.py      FastAPI dependency injectors (get_current_user etc.)
└── main.py              app factory, CORS, lifespan
scripts/
└── seed_topics.py       seeds 6 topics + sub-topics into MongoDB
tests/
├── conftest.py
├── test_agent_service.py
├── test_chat.py
└── test_quiz.py
```

---

## Deployment — Google Cloud Run

1. Create an **Artifact Registry** Docker repository (default name in `cloudbuild.yaml`: `genz-finance`).
2. Add secrets to **Secret Manager**:
   - `GENZ_SECRET_KEY`
   - `GENZ_MONGODB_URL`
   - `GENZ_ELASTIC_API_KEY`
3. Trigger a build:
   ```bash
   gcloud builds submit --config cloudbuild.yaml
   ```
4. Cloud Run service is deployed automatically by `cloudbuild.yaml`.

---

## Frontend

The React frontend lives in `../frontend`. See [`../frontend/README.md`](../frontend/README.md) for setup instructions.

During local development the frontend expects the API at `http://localhost:8000`. Update `src/lib/api.js` to point at a deployed backend.
