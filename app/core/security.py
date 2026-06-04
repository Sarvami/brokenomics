"""JWT security, password hashing, and user dependencies."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from bson import ObjectId
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings
from app.db.collections import USERS
from app.db.mongodb import get_database
from app.models.user import UserInDB


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))

    payload = dict(data)
    if "sub" not in payload:
        raise ValueError("create_access_token requires a 'sub' field")

    payload.update({"iat": int(now.timestamp()), "exp": int(expire.timestamp())})
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def _token_error(detail: str) -> HTTPException:
    return HTTPException(
        status_code=401,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def decode_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError as exc:
        raise _token_error("Invalid or expired token") from exc


async def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db=Depends(get_database),
) -> UserInDB:
    if not token:
        raise _token_error("Missing bearer token")
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not isinstance(user_id, str) or not ObjectId.is_valid(user_id):
        raise _token_error("Invalid token subject")

    doc = await db[USERS].find_one({"_id": ObjectId(user_id)})
    if not doc:
        raise _token_error("User not found")
    return UserInDB(**doc)


async def get_optional_user(
    token: str | None = Depends(oauth2_scheme),
    db=Depends(get_database),
) -> UserInDB | None:
    if not token:
        return None
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not isinstance(user_id, str) or not ObjectId.is_valid(user_id):
            return None
        doc = await db[USERS].find_one({"_id": ObjectId(user_id)})
        if not doc:
            return None
        return UserInDB(**doc)
    except HTTPException:
        return None
