"""Aggregates all v1 routers."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import auth, chat, profile, quiz, topics


router = APIRouter()

router.include_router(auth.router)
router.include_router(quiz.router)
router.include_router(topics.router)
router.include_router(chat.router)
router.include_router(profile.router)
