from fastapi.testclient import TestClient


def test_register_then_login(client: TestClient) -> None:
    resp = client.post(
        "/api/v1/auth/register",
        json={"email": "Bob@Example.com", "password": "hunter22pass", "display_name": "Bob"},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"]["email"] == "bob@example.com"

    # login with same creds
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "bob@example.com", "password": "hunter22pass"},
    )
    assert resp.status_code == 200
    assert resp.json()["access_token"]


def test_register_duplicate_email_conflicts(client: TestClient) -> None:
    payload = {"email": "dup@example.com", "password": "abcdefgh1"}
    assert client.post("/api/v1/auth/register", json=payload).status_code == 201
    assert client.post("/api/v1/auth/register", json=payload).status_code == 409


def test_login_wrong_password(client: TestClient) -> None:
    client.post(
        "/api/v1/auth/register",
        json={"email": "c@example.com", "password": "rightpass1"},
    )
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "c@example.com", "password": "wrongpass1"},
    )
    assert resp.status_code == 401


def test_me_requires_auth(client: TestClient, auth_headers: dict[str, str]) -> None:
    assert client.get("/api/v1/auth/me").status_code == 401
    resp = client.get("/api/v1/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "alice@example.com"


def test_me_rejects_garbage_token(client: TestClient) -> None:
    resp = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer not.a.jwt"})
    assert resp.status_code == 401
