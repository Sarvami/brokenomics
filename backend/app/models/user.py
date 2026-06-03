"""User models and JWT token payloads."""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any

from bson import ObjectId
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from pydantic_core import core_schema


class PyObjectId(ObjectId):
    """Pydantic-friendly ObjectId that serializes to str."""

    @classmethod
    def __get_pydantic_core_schema__(
        cls, _source_type: Any, _handler: Any
    ) -> core_schema.CoreSchema:
        return core_schema.no_info_plain_validator_function(
            cls._validate,
            serialization=core_schema.plain_serializer_function_ser_schema(lambda v: str(v)),
        )

    @classmethod
    def _validate(cls, value: Any) -> ObjectId:
        if isinstance(value, ObjectId):
            return value
        if isinstance(value, str) and ObjectId.is_valid(value):
            return ObjectId(value)
        raise ValueError("Invalid ObjectId")


_USERNAME_RE = re.compile(r"^[a-zA-Z0-9_]{3,30}$")


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str = Field(min_length=8)
    display_name: str | None = None

    @field_validator("username")
    @classmethod
    def _validate_username(cls, value: str) -> str:
        if not _USERNAME_RE.fullmatch(value):
            raise ValueError("username must be 3-30 chars and contain only letters, numbers, underscores")
        return value


class UserInDB(BaseModel):
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

    id: PyObjectId = Field(alias="_id")
    username: str
    email: EmailStr
    display_name: str | None = None
    hashed_password: str
    created_at: datetime
    is_guest: bool = False

    @property
    def _id(self) -> PyObjectId:
        # Back-compat for code that expects Mongo-style `_id`.
        return self.id


class UserResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

    id: str
    username: str
    email: EmailStr
    display_name: str | None
    created_at: datetime
    is_guest: bool

    @classmethod
    def from_db(cls, user: UserInDB) -> "UserResponse":
        return cls(
            id=str(user.id),
            username=user.username,
            email=user.email,
            display_name=user.display_name,
            created_at=user.created_at,
            is_guest=user.is_guest,
        )


class GuestSessionCreate(BaseModel):
    device_fingerprint: str | None = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
