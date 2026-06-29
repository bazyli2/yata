from fastapi.testclient import TestClient


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
