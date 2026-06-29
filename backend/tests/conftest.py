from collections.abc import Generator
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

# Import models so they're registered with Base.metadata.
from app import models  # noqa: F401
from app.auth import get_current_user
from app.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = "sqlite+pysqlite:///:memory:"

# A fake user payload returned by the overridden auth dependency.
FAKE_USER: dict[str, Any] = {
    "sub": "auth0|test-user-1",
    "aud": "https://yata-api",
    "iss": "https://test.auth0.com/",
}


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        future=True,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(
        bind=engine,
        autocommit=False,
        autoflush=False,
        expire_on_commit=False,
        future=True,
    )
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def _override_get_db() -> Generator[Session, None, None]:
        try:
            yield db_session
        finally:
            pass

    async def _override_get_current_user() -> dict[str, Any]:
        return FAKE_USER

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_current_user] = _override_get_current_user
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
