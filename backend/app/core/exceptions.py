"""Custom exceptions and helpers.

We standardize error payloads so frontend rendering is predictable.
"""

from __future__ import annotations

import traceback
from typing import Any

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.utils.logger import get_logger


log = get_logger("exceptions")


def http_error(status_code: int, message: str, *, headers: dict[str, str] | None = None) -> HTTPException:
    return HTTPException(status_code=status_code, detail=message, headers=headers)


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    # Never leak internals to the client; logs keep the full traceback.
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


def validation_to_field_errors(exc: ValidationError) -> list[dict[str, Any]]:
    errors: list[dict[str, Any]] = []
    for err in exc.errors():
        errors.append({"loc": err.get("loc"), "msg": err.get("msg"), "type": err.get("type")})
    return errors
