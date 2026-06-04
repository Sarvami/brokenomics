"""Auth routes: register/login/guest session + current user."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm

from app.core.security import create_access_token, get_current_user, hash_password, verify_password
from app.db.collections import USERS
from app.db.mongodb import get_database
from app.models.user import GuestSessionCreate, Token, UserCreate, UserInDB, UserResponse


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token)
async def register(payload: UserCreate, db=Depends(get_database)) -> Token:
    existing_email = await db[USERS].find_one({"email": payload.email})
    if existing_email:
        from fastapi import HTTPException

        raise HTTPException(status_code=400, detail="Email already registered")

    existing_username = await db[USERS].find_one({"username": payload.username})
    if existing_username:
        from fastapi import HTTPException

        raise HTTPException(status_code=400, detail="Username already taken")

    now = datetime.utcnow()
    doc = {
        "username": payload.username,
        "email": str(payload.email),
        "display_name": payload.display_name,
        "hashed_password": hash_password(payload.password),
        "created_at": now,
        "is_guest": False,
    }
    res = await db[USERS].insert_one(doc)
    user = UserInDB(**{**doc, "_id": res.inserted_id})

    token = create_access_token({"sub": str(user._id)}, expires_delta=timedelta(minutes=60 * 24 * 7))
    return Token(access_token=token, user=UserResponse.from_db(user))


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db=Depends(get_database)) -> Token:
    # OAuth2 form uses `username` field; we treat it as email.
    user_doc = await db[USERS].find_one({"email": form_data.username})
    if not user_doc:
        from fastapi import HTTPException

        raise HTTPException(status_code=401, detail="Invalid credentials", headers={"WWW-Authenticate": "Bearer"})

    user = UserInDB(**user_doc)
    if user.is_guest or not user.hashed_password:
        from fastapi import HTTPException

        raise HTTPException(status_code=401, detail="Invalid credentials", headers={"WWW-Authenticate": "Bearer"})

    if not verify_password(form_data.password, user.hashed_password):
        from fastapi import HTTPException

        raise HTTPException(status_code=401, detail="Invalid credentials", headers={"WWW-Authenticate": "Bearer"})

    token = create_access_token({"sub": str(user._id)}, expires_delta=timedelta(minutes=60 * 24 * 7))
    return Token(access_token=token, user=UserResponse.from_db(user))


@router.post("/guest-session", response_model=Token)
async def guest_session(payload: GuestSessionCreate | None = None, db=Depends(get_database)) -> Token:
    _ = payload
    now = datetime.utcnow()
    guest_id = str(uuid.uuid4())
    username = f"guest_{guest_id[:8]}"
    email = f"guest_{guest_id}@guest.local"
    doc = {
        "username": username,
        "email": email,
        "display_name": "Guest",
        "hashed_password": "",
        "created_at": now,
        "is_guest": True,
    }
    res = await db[USERS].insert_one(doc)
    user = UserInDB(**{**doc, "_id": res.inserted_id})
    token = create_access_token({"sub": str(user._id)}, expires_delta=timedelta(minutes=60 * 24 * 7))
    return Token(access_token=token, user=UserResponse.from_db(user))


@router.get("/me", response_model=UserResponse)
async def me(current_user: UserInDB = Depends(get_current_user)) -> UserResponse:
    return UserResponse.from_db(current_user)


@router.post("/logout")
async def logout() -> dict[str, str]:
    return {"message": "Logged out. Come back soon! 👋"}
