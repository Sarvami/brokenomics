"""Motor async MongoDB client and database access.

Designed for Cloud Run: connect on startup, close cleanly on shutdown.
"""

from __future__ import annotations

from typing import Any

from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING

from app.config import settings
from app.db import collections
from app.utils.logger import get_logger


log = get_logger("mongodb")

motor_client: AsyncIOMotorClient | None = None
database: AsyncIOMotorDatabase | None = None


async def connect_to_mongo() -> None:
    global motor_client, database

    motor_client = AsyncIOMotorClient(settings.MONGODB_URL)
    database = motor_client[settings.MONGODB_DB_NAME]

    # Ping early so we fail fast during deploy, not mid-demo.
    await database.command("ping")
    log.info("MongoDB ping ok", extra={"extra_fields": {"db": settings.MONGODB_DB_NAME}})

    await _ensure_indexes(database)
    log.info("MongoDB indexes ensured")


async def close_mongo_connection() -> None:
    global motor_client, database
    if motor_client is not None:
        motor_client.close()
    motor_client = None
    database = None
    log.info("MongoDB connection closed")


async def _ensure_indexes(db: AsyncIOMotorDatabase) -> None:
    # Indexing is a UX win: history/progress endpoints stay snappy.
    await db[collections.USERS].create_index([("email", ASCENDING)], unique=True)
    await db[collections.USERS].create_index([("username", ASCENDING)], unique=True)

    await db[collections.QUIZ_RESPONSES].create_index(
        [("user_id", ASCENDING), ("topic_id", ASCENDING)]
    )
    await db[collections.TOPIC_PROGRESS].create_index(
        [("user_id", ASCENDING), ("topic_id", ASCENDING)]
    )
    await db[collections.TOPIC_PROGRESS].create_index([("updated_at", ASCENDING)])

    await db[collections.CHAT_HISTORY].create_index(
        [("user_id", ASCENDING), ("topic_id", ASCENDING)]
    )
    await db[collections.CHAT_HISTORY].create_index([("created_at", ASCENDING)])

    await db[collections.SAVED_ITEMS].create_index([("user_id", ASCENDING)])
    await db[collections.SAVED_ITEMS].create_index(
        [("user_id", ASCENDING), ("item_type", ASCENDING)]
    )


def _require_db() -> AsyncIOMotorDatabase:
    if database is None:
        raise RuntimeError("MongoDB not initialised. Did lifespan startup run?")
    return database


async def get_database() -> AsyncIOMotorDatabase:
    return _require_db()


DbDep = Depends(get_database)
