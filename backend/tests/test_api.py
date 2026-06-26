import pytest


@pytest.mark.asyncio
async def test_health(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_create_and_get_ticket(client):
    resp = await client.post("/api/tickets", json={
        "title": "Test ticket",
        "description": "Test description",
        "priority": "high",
        "category": "test",
    })
    assert resp.status_code == 201
    ticket = resp.json()

    resp = await client.get(f"/api/tickets/{ticket['id']}")
    assert resp.status_code == 200
    assert resp.json()["title"] == "Test ticket"


@pytest.mark.asyncio
async def test_create_note(client):
    resp = await client.post("/api/tickets", json={"title": "Note ticket"})
    ticket_id = resp.json()["id"]

    resp = await client.post("/api/notes", json={
        "ticket_id": ticket_id,
        "content": "Test note",
    })
    assert resp.status_code == 201
    assert resp.json()["content"] == "Test note"


@pytest.mark.asyncio
async def test_sla_summary(client):
    resp = await client.get("/api/sla/summary")
    assert resp.status_code == 200
    data = resp.json()
    assert "total" in data
    assert "overdue" in data
