import pytest
from fastapi.testclient import TestClient
from backend.server import app

client = TestClient(app)

def test_guardian_reach_status_varied_distribution():
    """Verify GET /api/asha/guardian-reach-status returns a varied channel distribution and days_since_flagged."""
    res = client.get("/api/asha/guardian-reach-status")
    assert res.status_code == 200
    data = res.json()
    
    assert "reach_records" in data
    records = data["reach_records"]
    assert len(records) > 0
    
    badges = {r["reach_badge"] for r in records}
    assert "app_login" in badges
    assert "ivr_call" in badges
    assert "sms" in badges
    assert "unreached" in badges
    
    for r in records:
        assert "days_since_flagged" in r
        assert r["days_since_flagged"] >= 1

def test_batch_notify_fallback_endpoint():
    """Verify POST /api/family/notify-fallback-batch triggers batch notifications for selected children."""
    res = client.post("/api/family/notify-fallback-batch", json={"child_ids": ["child-0128", "child-0130"], "channel": "both"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["affected_children_count"] == 2
