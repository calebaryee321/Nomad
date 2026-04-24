"""Pydantic request/response schemas for the API."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import ProcessingStatus, SavedItemType, SourcePlatform

# ----- auth ---------------------------------------------------------------


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=200)
    display_name: str | None = Field(default=None, max_length=255)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=200)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    display_name: str | None
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ----- collections --------------------------------------------------------


class CollectionCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    color: str | None = Field(default=None, max_length=32)
    icon: str | None = Field(default=None, max_length=64)


class CollectionUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    color: str | None = Field(default=None, max_length=32)
    icon: str | None = Field(default=None, max_length=64)


class CollectionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    color: str | None
    icon: str | None
    created_at: datetime
    updated_at: datetime


# ----- tags ---------------------------------------------------------------


class TagOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str


# ----- saved items --------------------------------------------------------


class SavedItemCreate(BaseModel):
    url: str = Field(min_length=1, max_length=4096)
    title: str | None = Field(default=None, max_length=255)
    user_note: str | None = None
    collection_id: uuid.UUID | None = None
    tags: list[str] = Field(default_factory=list)


class SavedItemUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    user_note: str | None = None
    collection_id: uuid.UUID | None = None
    tags: list[str] | None = None


class SavedItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    source_platform: SourcePlatform
    source_url: str
    normalized_url: str
    item_type: SavedItemType
    title: str | None
    user_note: str | None
    collection_id: uuid.UUID | None
    processing_status: ProcessingStatus
    tags: list[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
