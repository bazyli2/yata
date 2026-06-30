from fastapi.testclient import TestClient

from tests.conftest import FAKE_USER


def test_items_crud_flow(client: TestClient) -> None:
    # Initially empty
    res = client.get("/api/items")
    assert res.status_code == 200
    assert res.json() == []

    # Create
    res = client.post("/api/items", json={"name": "first", "description": "hello"})
    assert res.status_code == 201
    created = res.json()
    assert created["id"] >= 1
    assert created["name"] == "first"
    assert created["description"] == "hello"
    assert created["user_id"] == FAKE_USER["sub"]
    item_id = created["id"]

    # Read by id
    res = client.get(f"/api/items/{item_id}")
    assert res.status_code == 200
    assert res.json()["name"] == "first"

    # List
    res = client.get("/api/items")
    assert res.status_code == 200
    items = res.json()
    assert len(items) == 1

    # Delete
    res = client.delete(f"/api/items/{item_id}")
    assert res.status_code == 204

    # 404 after delete
    res = client.get(f"/api/items/{item_id}")
    assert res.status_code == 404


def test_unauthenticated_request_is_rejected(client: TestClient) -> None:
    """Without the auth override, endpoints should require a token.

    This test removes the dependency override to verify that the
    HTTPBearer scheme rejects requests without an Authorization header.
    """
    from app.auth import get_current_user
    from app.main import app

    # Remove the auth override so the real dependency runs.
    app.dependency_overrides.pop(get_current_user, None)
    try:
        res = client.get("/api/items")
        # FastAPI's HTTPBearer rejects requests with no Authorization header.
        # The exact status depends on the Starlette version (401 or 403);
        # both indicate the request was rejected for missing credentials.
        assert res.status_code in (401, 403)
    finally:
        # Restore for other tests (fixture cleanup will also clear).
        async def _override() -> dict:
            return FAKE_USER

        app.dependency_overrides[get_current_user] = _override
