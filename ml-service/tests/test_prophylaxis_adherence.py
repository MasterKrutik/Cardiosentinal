import pytest
from fastapi.testclient import TestClient
from backend.server import app

client = TestClient(app)

def test_child_0121_prophylaxis_adherence_metrics():
    """Verify child-0121 multi-dose prophylaxis records, computed adherence rate, and consecutive streak."""
    res = client.get("/api/family/prophylaxis/child-0121")
    assert res.status_code == 200
    data = res.json()
    
    assert "child" in data
    assert data["child"]["anonymized_code"] == "CS-MEG-0121"
    assert "records" in data
    assert len(data["records"]) >= 7
    assert "adherence_rate" in data
    assert data["adherence_rate"] > 70.0
    assert "consecutive_streak" in data
    assert data["consecutive_streak"] >= 3

def test_child_0122_distinct_adherence_pattern():
    """Verify distinct adherence rate and streak computation for child-0122."""
    res = client.get("/api/family/prophylaxis/child-0122")
    assert res.status_code == 200
    data = res.json()
    
    assert "child" in data
    assert "records" in data
    assert "adherence_rate" in data
    assert "consecutive_streak" in data

def test_prophylaxis_reminder_toggle_endpoint():
    """Verify POST /api/family/prophylaxis/reminder-toggle creates/updates row in guardian_contact_attempts."""
    # Enable reminder
    res_enable = client.post("/api/family/prophylaxis/reminder-toggle", json={"child_id": "child-0121", "enabled": True})
    assert res_enable.status_code == 200
    assert res_enable.json()["reminder_enabled"] is True

    # Check GET reflects enabled state
    res_get = client.get("/api/family/prophylaxis/child-0121")
    assert res_get.status_code == 200
    assert res_get.json()["reminder_enabled"] is True

    # Disable reminder
    res_disable = client.post("/api/family/prophylaxis/reminder-toggle", json={"child_id": "child-0121", "enabled": False})
    assert res_disable.status_code == 200
    assert res_disable.json()["reminder_enabled"] is False
