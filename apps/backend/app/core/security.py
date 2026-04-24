"""Password hashing and JWT helpers."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt
import jwt

from app.core.config import settings

# bcrypt has a 72-byte input limit; we pre-hash longer inputs deterministically
# is not used here. Instead we simply truncate per bcrypt's documented behavior
# by relying on bcrypt itself to enforce the limit (raises on >72 bytes since 4.x).
# To stay portable we truncate manually so longer passwords still work.
_BCRYPT_MAX_BYTES = 72


def _truncate_for_bcrypt(password: str) -> bytes:
    encoded = password.encode("utf-8")
    if len(encoded) > _BCRYPT_MAX_BYTES:
        encoded = encoded[:_BCRYPT_MAX_BYTES]
    return encoded


def hash_password(password: str) -> str:
    """Hash a password using bcrypt and return the hash as a string."""
    if not password:
        raise ValueError("password must not be empty")
    return bcrypt.hashpw(_truncate_for_bcrypt(password), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    if not password or not password_hash:
        return False
    try:
        return bcrypt.checkpw(_truncate_for_bcrypt(password), password_hash.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(subject: uuid.UUID | str, expires_minutes: int | None = None) -> str:
    """Create a signed JWT access token for the given subject (user id)."""
    expire_minutes = expires_minutes or settings.jwt_expire_minutes
    now = datetime.now(UTC)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=expire_minutes)).timestamp()),
        "type": "access",
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT, raising jwt.PyJWTError on failure."""
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
