import pytest
from fastapi.testclient import TestClient
from backend.server import app

client = TestClient(app)

def test_asha_today_route_endpoint_structure():
    """Verify GET /api/asha/route-today returns rich route stops, travel metrics, and priority children."""
    res = client.get("/api/asha/route-today")
    assert res.status_code == 200
    data = res.json()
    
    assert "route_stops" in data
    assert "summary" in data
    assert "base_location" in data
    assert "asha_worker" in data
    
    stops = data["route_stops"]
    assert len(stops) >= 3
    
    for s in stops:
        assert "name" in s
        assert "latitude" in s
        assert "longitude" in s
        assert "travel_distance_km" in s
        assert "travel_time_mins" in s
        assert "rank_rationale" in s
        assert "recheck_children" in s
        assert len(s["recheck_children"]) > 0

def test_toggle_stop_visited_endpoint():
    """Verify POST /api/asha/toggle-stop-visited toggles visited state cleanly."""
    res = client.post("/api/asha/toggle-stop-visited", json={"stop_id": "stop-01", "visited": True})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["stop_id"] == "stop-01"
    assert data["visited"] is True
