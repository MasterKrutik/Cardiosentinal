"""
Addendum 37 — Regression Guard: Echo Van Forecaster Credibility & Cost Metrics
Ensures:
  1. All deployments have distinct, per-row computed ranking rationales (no static duplicate text)
  2. cost_per_case_caught_inr is computed, positive, and realistic
  3. Forecast-driven cases caught > baseline fixed rotation cases caught
  4. GIS coordinates (latitude, longitude) and start/end dates exist for map and timeline strip
  5. Priority badges use standardized High / Medium strings
"""
import sys
import os
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../backend')))
from server import app

client = TestClient(app)

def test_resource_forecast_endpoint_structure():
    """Guard 1: Response includes baseline vs forecast comparison stats and summary metrics."""
    res = client.get("/api/district/resource-forecast")
    assert res.status_code == 200
    data = res.json()

    assert "deployments" in data
    assert len(data["deployments"]) >= 3
    assert "baseline_fixed_rotation_caught" in data
    assert "forecast_optimized_caught" in data
    assert "additional_cases_caught" in data
    assert "efficiency_multiplier" in data
    assert "daily_operating_cost_inr" in data

    # Verify forecast-driven yield superiority
    assert data["forecast_optimized_caught"] > data["baseline_fixed_rotation_caught"]
    assert data["additional_cases_caught"] == data["forecast_optimized_caught"] - data["baseline_fixed_rotation_caught"]


def test_deployments_distinct_rationales_and_coordinates():
    """Guard 2: Every deployment row has a distinct why_this_ranking rationale, coordinates, and cost metric."""
    res = client.get("/api/district/resource-forecast")
    assert res.status_code == 200
    data = res.json()
    deployments = data["deployments"]

    rationales = set()
    for idx, dep in enumerate(deployments):
        # 1. Rationale uniqueness check
        why = dep.get("why_this_ranking")
        assert why is not None and len(why) > 20, f"Deployment #{idx+1} missing valid rationale"
        assert why not in rationales, f"Duplicate ranking rationale detected: '{why}'"
        rationales.add(why)

        # 2. Coordinates check
        assert "latitude" in dep and dep["latitude"] is not None
        assert "longitude" in dep and dep["longitude"] is not None
        assert 20.0 <= dep["latitude"] <= 30.0  # Meghalaya / East Khasi Hills region
        assert 88.0 <= dep["longitude"] <= 95.0

        # 3. Cost-efficiency check
        assert "cost_per_case_caught_inr" in dep
        assert dep["cost_per_case_caught_inr"] > 0
        assert dep["total_deployment_cost_inr"] > 0

        # 4. Schedule dates check
        assert "start_date" in dep
        assert "end_date" in dep

        # 5. Priority badge standardization
        assert dep["recommended_van_priority"] in ("High", "Medium", "Low")


def test_top_recommended_deployment_matches_rank_1():
    """Guard 3: Top recommended deployment matches rank #1 deployment in deployments list."""
    res = client.get("/api/district/resource-forecast")
    assert res.status_code == 200
    data = res.json()

    top = data.get("top_recommended_deployment")
    assert top is not None
    assert top["school_name"] == data["deployments"][0]["school_name"]
    assert top["forecasted_subclinical_cases_30d"] == data["deployments"][0]["forecasted_subclinical_cases_30d"]
