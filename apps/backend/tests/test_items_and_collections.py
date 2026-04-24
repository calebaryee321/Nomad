from fastapi.testclient import TestClient


def _create_collection(client: TestClient, headers: dict[str, str], name: str) -> dict:
    resp = client.post("/api/v1/collections", headers=headers, json={"name": name})
    assert resp.status_code == 201, resp.text
    return resp.json()


def test_collection_crud(client: TestClient, auth_headers: dict[str, str]) -> None:
    # empty
    assert client.get("/api/v1/collections", headers=auth_headers).json() == []

    created = _create_collection(client, auth_headers, "Recipes")
    assert created["name"] == "Recipes"

    # update
    resp = client.patch(
        f"/api/v1/collections/{created['id']}",
        headers=auth_headers,
        json={"name": "Cooking", "color": "#ff8800"},
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Cooking"
    assert resp.json()["color"] == "#ff8800"

    # list shows it
    listing = client.get("/api/v1/collections", headers=auth_headers).json()
    assert len(listing) == 1 and listing[0]["id"] == created["id"]

    # delete
    assert (
        client.delete(f"/api/v1/collections/{created['id']}", headers=auth_headers).status_code
        == 204
    )
    assert client.get("/api/v1/collections", headers=auth_headers).json() == []


def test_save_share_intent_link_dedupes_per_user(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    # Simulate Android share-intent receive: app POSTs the URL.
    payload = {
        "url": "https://www.instagram.com/reel/AbCdEf-123/?igshid=foo",
        "user_note": "watch later",
        "tags": ["food", "Recipes", "  food  "],
    }
    resp = client.post("/api/v1/items", headers=auth_headers, json=payload)
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["source_platform"] == "instagram"
    assert body["item_type"] == "video"
    assert body["normalized_url"] == "https://www.instagram.com/reel/AbCdEf-123/"
    assert sorted(body["tags"]) == ["food", "recipes"]
    item_id = body["id"]

    # Re-submit same URL (different surface form) — should return same item.
    resp2 = client.post(
        "/api/v1/items",
        headers=auth_headers,
        json={"url": "instagram.com/reel/AbCdEf-123"},
    )
    assert resp2.status_code == 201
    assert resp2.json()["id"] == item_id


def test_item_listing_filters_and_search(client: TestClient, auth_headers: dict[str, str]) -> None:
    coll = _create_collection(client, auth_headers, "Travel")

    a = client.post(
        "/api/v1/items",
        headers=auth_headers,
        json={
            "url": "https://www.instagram.com/p/AAA111/",
            "title": "Sunset in Lisbon",
            "collection_id": coll["id"],
        },
    ).json()
    b = client.post(
        "/api/v1/items",
        headers=auth_headers,
        json={"url": "https://www.instagram.com/p/BBB222/", "title": "Cooking pasta"},
    ).json()

    all_items = client.get("/api/v1/items", headers=auth_headers).json()
    assert {i["id"] for i in all_items} == {a["id"], b["id"]}

    travel = client.get(
        "/api/v1/items", headers=auth_headers, params={"collection_id": coll["id"]}
    ).json()
    assert [i["id"] for i in travel] == [a["id"]]

    search = client.get("/api/v1/items", headers=auth_headers, params={"q": "pasta"}).json()
    assert [i["id"] for i in search] == [b["id"]]


def test_update_and_delete_item(client: TestClient, auth_headers: dict[str, str]) -> None:
    item = client.post(
        "/api/v1/items",
        headers=auth_headers,
        json={"url": "https://www.instagram.com/p/ZZZ999/"},
    ).json()

    resp = client.patch(
        f"/api/v1/items/{item['id']}",
        headers=auth_headers,
        json={"user_note": "edit", "tags": ["alpha", "beta"]},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["user_note"] == "edit"
    assert sorted(body["tags"]) == ["alpha", "beta"]

    # tags listing reflects them
    tags = client.get("/api/v1/tags", headers=auth_headers).json()
    assert sorted(t["name"] for t in tags) == ["alpha", "beta"]

    assert client.delete(f"/api/v1/items/{item['id']}", headers=auth_headers).status_code == 204
    assert client.get(f"/api/v1/items/{item['id']}", headers=auth_headers).status_code == 404


def test_cannot_assign_other_users_collection(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    # alice is the user in auth_headers; create a second user.
    other = client.post(
        "/api/v1/auth/register",
        json={"email": "mallory@example.com", "password": "anotherpass1"},
    ).json()
    other_headers = {"Authorization": f"Bearer {other['access_token']}"}
    mallorys = _create_collection(client, other_headers, "Private")

    resp = client.post(
        "/api/v1/items",
        headers=auth_headers,
        json={"url": "https://example.com/x", "collection_id": mallorys["id"]},
    )
    assert resp.status_code == 400


def test_items_require_auth(client: TestClient) -> None:
    assert client.get("/api/v1/items").status_code == 401
    assert client.post("/api/v1/items", json={"url": "https://x.test/"}).status_code == 401


def test_cannot_access_other_users_items(client: TestClient, auth_headers: dict[str, str]) -> None:
    # Alice owns the item.
    item = client.post(
        "/api/v1/items", headers=auth_headers, json={"url": "https://x.test/secret"}
    ).json()

    # Mallory is a separate user.
    other = client.post(
        "/api/v1/auth/register",
        json={"email": "mallory2@example.com", "password": "anotherpass1"},
    ).json()
    other_headers = {"Authorization": f"Bearer {other['access_token']}"}

    # Mallory cannot view, modify, or delete Alice's item.
    assert client.get(f"/api/v1/items/{item['id']}", headers=other_headers).status_code == 404
    assert (
        client.patch(
            f"/api/v1/items/{item['id']}",
            headers=other_headers,
            json={"user_note": "hijack"},
        ).status_code
        == 404
    )
    assert client.delete(f"/api/v1/items/{item['id']}", headers=other_headers).status_code == 404

    # Alice's item is untouched.
    alice_view = client.get(f"/api/v1/items/{item['id']}", headers=auth_headers).json()
    assert alice_view["user_note"] is None

    # Mallory's listing doesn't include Alice's item.
    mallory_list = client.get("/api/v1/items", headers=other_headers).json()
    assert mallory_list == []
