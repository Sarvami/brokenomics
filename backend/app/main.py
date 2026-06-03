"""FastAPI application entry point."""

from __future__ import annotations

import logging
import traceback
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import router as v1_router
from app.config import settings
from app.db.mongodb import close_mongo_connection, connect_to_mongo
from app.services.agent_service import agent_service
from app.utils.helpers import ensure_request_id
from app.utils.logger import configure_logging, get_logger


APP_VERSION = "1.0.0"
log = get_logger("main")

_mongodb_connected: bool = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _mongodb_connected
    try:
        await connect_to_mongo()
        _mongodb_connected = True
        log.info("MongoDB connected")
    except Exception as exc:  # noqa: BLE001
        _mongodb_connected = False
        log.error("MongoDB connection failed", extra={"extra_fields": {"error": str(exc)}})

    try:
        await agent_service.warmup()
    except Exception:
        pass

    log.info("App ready")
    yield

    await close_mongo_connection()
    _mongodb_connected = False


def _docs_url() -> str | None:
    return "/docs" if settings.APP_ENV != "production" else None


openapi_tags = [
    {"name": "auth", "description": "JWT auth, login, guest sessions"},
    {"name": "quiz", "description": "Personalisation quiz"},
    {"name": "topics", "description": "Topics, journey, progress"},
    {"name": "chat", "description": "AI chat endpoints"},
    {"name": "profile", "description": "Saved items/bookmarks"},
]


configure_logging(logging.DEBUG if settings.DEBUG else logging.INFO)

app = FastAPI(
    title="GenZ Finance Co-Pilot API",
    version=APP_VERSION,
    docs_url=_docs_url(),
    openapi_tags=openapi_tags,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"] ,
    allow_headers=["*"] ,
)


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    request_id = ensure_request_id(request.headers.get("X-Request-ID"))
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    details: list[dict[str, Any]] = []
    for err in exc.errors():
        details.append({"loc": err.get("loc"), "msg": err.get("msg"), "type": err.get("type")})
    return JSONResponse(status_code=422, content={"error": "Validation failed", "details": details})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    # Client gets sanitized message; logs keep traceback.
    log.error(
        "Unhandled exception",
        extra={
            "extra_fields": {
                "path": str(request.url.path),
                "method": request.method,
                "traceback": "".join(traceback.format_exception(type(exc), exc, exc.__traceback__)),
            }
        },
    )
    return JSONResponse(status_code=500, content={"error": "Something went wrong. Please try again."})


@app.get("/health")
async def health() -> dict[str, str]:
    return {
        "status": "healthy",
        "version": APP_VERSION,
        "mongodb": "connected" if _mongodb_connected else "disconnected",
        "environment": settings.APP_ENV,
    }


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "Yo 👋 I’m FinBro’s backend. Drop a question, bestie."}


app.include_router(v1_router, prefix="/api/v1")
