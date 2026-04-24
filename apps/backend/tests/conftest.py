"""Pytest fixtures: SQLite-backed test app with isolated DB per test."""

from __future__ import annotations

import os

# Configure env BEFORE importing app modules so settings pick up SQLite.
os.environ.setdefault("NOMAD_DATABASE_URL", "sqlite+pysqlite:///:memory:")
os.environ.setdefault(
    "NOMAD_JWT_SECRET",
    "test-secret-do-not-use-in-prod-please-use-32-bytes-minimum",
)

from collections.abc import Generator  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import Session, sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.api.deps import get_db  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.main import app  # noqa: E402
from app.models import User  # noqa: F401,E402  -- ensure metadata is populated


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    # In-memory SQLite shared across the connection pool for the test.
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        future=True,
    )
    Base.metadata.create_all(engine)
    TestSession = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

    def override_get_db() -> Generator[Session, None, None]:
        session = TestSession()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    try:
        with TestSession() as session:
            yield session
    finally:
        app.dependency_overrides.pop(get_db, None)
        Base.metadata.drop_all(engine)
        engine.dispose()


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def auth_headers(client: TestClient) -> dict[str, str]:
    """Register a fresh user and return Authorization header."""
    resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "alice@example.com",
            "password": "supersecret123",
            "display_name": "Alice",
        },
    )
    assert resp.status_code == 201, resp.text
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
