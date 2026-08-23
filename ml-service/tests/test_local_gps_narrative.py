import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend")))
from server import app

client = TestClient(app)

def test_local_narrative_home_mode():
    """Verify default home mode returns East Khasi Hills Shillong data."""
    res = client.get("/api/location/local-narrative?mode=home")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["mode"] == "home"
    assert data["is_home_mode"] is True
    assert data["detected_city"] == "Shillong"
    assert data["detected_state"] == "Meghalaya"
    assert data["school"]["locality_badge"] == "Home District Partner School"
    assert "Projected Illustrative Estimate" in data["projected_estimate"]["narrative_text"]
    assert data["projected_estimate"]["projected_flagged_count"] >= 1

def test_local_narrative_mumbai_coordinates():
    """Verify live mode for Mumbai GPS returns Mumbai school and facility."""
    res = client.get("/api/location/local-narrative?lat=19.0760&lng=72.8777&mode=live")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["mode"] == "live"
    assert data["is_home_mode"] is False
    assert data["detected_city"] == "Mumbai"
    assert data["detected_state"] == "Maharashtra"
    assert "Mumbai" in data["school"]["name"] or "Mumbai" in data["school"]["city"]
    assert data["school"]["distance_km"] <= 25.0
    assert "Nearest Local Partner School" in data["school"]["locality_badge"]
    assert "Asian Heart Institute" in data["nearest_facility"]["name"]
    assert data["nearest_facility"]["distance_km"] <= 25.0

def test_local_narrative_gap2_gap5_determinism():
    """Verify Gap 2 distance threshold and Gap 5 deterministic math."""
    res = client.get("/api/location/local-narrative?lat=19.0760&lng=72.8777&mode=live")
    data = res.json()
    # Gap 5 determinism check
    est = data["projected_estimate"]
    assert est["student_count"] > 0
    assert est["prevalence_rate_used"] == "6.45 / 1,000"
    # 480 * 6.45 / 1000 = 3.096 -> 3
    assert est["projected_flagged_count"] == 3
    assert "disclaimer" in est

    # Gap 2 regional fallback check (simulate remote location in deep desert: lat 27.0, lng 70.0)
    res_remote = client.get("/api/location/local-narrative?lat=27.0000&lng=70.0000&mode=live")
    data_remote = res_remote.json()
    assert data_remote["school"]["is_out_of_locality"] is True
    assert "Nearest Regional Partner School" in data_remote["school"]["locality_badge"]
