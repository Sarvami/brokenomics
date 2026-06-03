# GenZ Finance Co-Pilot — Backend

Production-grade async FastAPI backend for a Gen Z India-first personal finance co-pilot.

## Architecture Diagram

```
React Frontend
  |
  | HTTPS (JWT)
  v
FastAPI (Cloud Run)
  |-- MongoDB Atlas (Motor)
  |-- Google Cloud Agent Builder (Gemini)
  '-- Elastic MCP (retrieval over India finance KB)
```

## Quick Start

### Prerequisites
- Python 3.12
- MongoDB connection string
- (Optional) Google Cloud credentials for Agent Builder

### Run locally
1. cp .env.example .env and fill values
2. pip install -r requirements.txt
3. Seed demo data: python -m scripts.seed_topics
4. Run API: uvicorn app.main:app --reload

## Environment Variables

| Name | Description | Example |
|---|---|---|
| `APP_ENV` | `development`/`staging`/`production` | `development` |
| `DEBUG` | enable debug logs | `false` |
| `SECRET_KEY` | JWT signing key (>= 32 chars) | `a-very-long-random-string...` |
| `MONGODB_URL` | MongoDB Atlas URI | `mongodb+srv://...` |
| `MONGODB_DB_NAME` | database name | `genz_finance` |
| `GOOGLE_CLOUD_PROJECT` | GCP project id | `my-project` |
| `GOOGLE_CLOUD_LOCATION` | GCP region | `us-central1` |
| `AGENT_BUILDER_AGENT_ID` | Agent Builder agent id | `1234567890` |
| `ELASTIC_CLOUD_ID` | Elastic Cloud id | `cluster:...` |
| `ELASTIC_API_KEY` | Elastic API key | `base64...` |
| `ELASTIC_INDEX_NAME` | KB index name | `indian_finance_knowledge` |
| `RATE_LIMIT_PER_MINUTE` | chat requests per minute | `30` |
| `ALLOWED_ORIGINS` | CORS allowlist JSON array | `["http://localhost:5173"]` |
| `REDIS_URL` | optional shared rate limiting | `redis://...` |

## API Endpoints (Core)

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health status + Mongo connectivity |
| POST | `/api/v1/auth/register` | Register user |
| POST | `/api/v1/auth/login` | Login (OAuth2 form) |
| POST | `/api/v1/auth/guest-session` | Create guest JWT |
| GET | `/api/v1/topics/` | Topic metadata |
| GET | `/api/v1/topics/{topic_id}/journey` | 6-step journey response |
| GET | `/api/v1/quiz/questions/{topic_id}` | Quiz questions |
| POST | `/api/v1/quiz/submit/{topic_id}` | Submit quiz + save personalisation |
| POST | `/api/v1/chat/message` | Main chat endpoint (rate-limited) |

## Deployment to Google Cloud Run

1. Create an Artifact Registry Docker repo (default in config: `genz-finance`).
2. Create secrets in Secret Manager: `GENZ_SECRET_KEY`, `GENZ_MONGODB_URL`, `GENZ_ELASTIC_API_KEY`.
3. Trigger Cloud Build using cloudbuild.yaml.

## Running Tests

pytest -q

