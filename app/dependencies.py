"""Shared FastAPI dependencies.

This module avoids circular imports by keeping cross-cutting dependencies here.
"""

from __future__ import annotations

from fastapi import Depends

from app.core.security import get_current_user, get_optional_user
from app.db.mongodb import get_database


__all__ = [
    "get_database",
    "get_current_user",
    "get_optional_user",
    "Depends",
]
