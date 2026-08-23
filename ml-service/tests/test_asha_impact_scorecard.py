import pytest
from fastapi.testclient import TestClient
from backend.server import app

client = TestClient(app)

def test_asha_impact_scorecard_endpoint():
    """Verify GET /api/asha/impact-scorecard returns literature-grounded attribution data."""
    res = client.get("/api/asha/impact-scorecard")
    assert res.status_code == 200
    data = res.json()
    
    assert "asha_name" in data
    assert "total_children_screened" in data
    assert "total_children_flagged" in data
    assert "estimated_counterfactual_detections" in data
    assert "detection_gap_multiplier" in data
    assert data["estimated_counterfactual_detections"] == 23

def test_asha_impact_certificate_pdf_endpoint():
    """Verify GET /api/asha/impact-certificate.pdf returns a valid ReportLab PDF file."""
    res = client.get("/api/asha/impact-certificate.pdf")
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert len(res.content) > 1000
    assert res.content.startswith(b"%PDF")
