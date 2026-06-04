from __future__ import annotations

import os

import pytest
import pytest_asyncio


def _ensure_test_env() -> None:
    # Settings are instantiated at import time (app.config.settings), so environment
    # must be ready before importing any app modules.
    os.environ.setdefault("APP_ENV", "development")
    os.environ.setdefault("DEBUG", "false")

    os.environ.setdefault("SECRET_KEY", "test-secret-key-32-characters-minimum!!")
    os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
    os.environ.setdefault("ALGORITHM", "HS256")

    os.environ.setdefault("MONGODB_URL", "mongodb://localhost:27017")
    os.environ.setdefault("MONGODB_DB_NAME", "test_db")

    os.environ.setdefault("GOOGLE_CLOUD_PROJECT", "test-project")
    os.environ.setdefault("GOOGLE_CLOUD_LOCATION", "us-central1")
    os.environ.setdefault("AGENT_BUILDER_AGENT_ID", "test-agent")

    os.environ.setdefault("ELASTIC_CLOUD_ID", "test-cloud")
    os.environ.setdefault("ELASTIC_API_KEY", "test-api-key")
    os.environ.setdefault("ELASTIC_INDEX_NAME", "test-index")

    os.environ.setdefault("RATE_LIMIT_PER_MINUTE", "9999")
    os.environ.setdefault("ALLOWED_ORIGINS", '["http://testserver"]')


_ensure_test_env()


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


@pytest.fixture
def mock_db():
    from mongomock_motor import AsyncMongoMockClient

    db_name = os.environ.get("MONGODB_DB_NAME", "test_db")
    client = AsyncMongoMockClient()
    return client[db_name]


@pytest.fixture
def app_with_overrides(mock_db, monkeypatch):
    from app.core.rate_limiter import rate_limit
    from app.db.mongodb import get_database
    import app.main as app_main

    async def _noop():
        return None

    # If the ASGI test client triggers lifespan, ensure it never touches real
    # external services.
    monkeypatch.setattr(app_main, "connect_to_mongo", _noop)
    monkeypatch.setattr(app_main, "close_mongo_connection", _noop)
    monkeypatch.setattr(app_main.agent_service, "warmup", _noop)

    app = app_main.app

    async def _override_get_database():
        return mock_db

    async def _override_rate_limit():
        return None

    app.dependency_overrides[get_database] = _override_get_database
    app.dependency_overrides[rate_limit] = _override_rate_limit

    yield app

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def client(app_with_overrides):
    import httpx

    transport = httpx.ASGITransport(app=app_with_overrides)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac
