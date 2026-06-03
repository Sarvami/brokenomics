"""Structured JSON logging for Cloud Run.

We keep logs machine-readable so Logs Explorer queries are easy.
"""

from __future__ import annotations

import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "service": getattr(record, "service", record.name),
            "message": record.getMessage(),
            "user_id": getattr(record, "user_id", None),
        }

        if record.exc_info:
            payload["traceback"] = self.formatException(record.exc_info)

        extra_fields = getattr(record, "extra_fields", None)
        if isinstance(extra_fields, dict):
            payload.update(extra_fields)

        return json.dumps(payload, ensure_ascii=False)


def configure_logging(level: int = logging.INFO) -> None:
    root = logging.getLogger()
    root.setLevel(level)

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())

    # Avoid duplicate handlers in reload/dev.
    root.handlers = [handler]


def get_logger(service: str) -> logging.LoggerAdapter:
    base_logger = logging.getLogger(service)
    return logging.LoggerAdapter(base_logger, {"service": service})
