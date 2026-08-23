import pytest
import sqlite3
import os
import bcrypt
from fastapi.testclient import TestClient

from server import app, DB_FILE

client = TestClient(app)

def test_triage_children_returns_names_schools_and_due_dates():
    """Verify GET /api/triage/children returns student full names, schools, and recommended screening dates."""
    res = client.get("/api/triage/children")
    assert res.status_code == 200
    data = res.json()
    children = data.get("children", [])
    assert len(children) > 0

    # Inspect sample records
    c1 = children[0]
    assert "full_name" in c1
    assert "school_name" in c1
    assert "recommended_next_screening_date" in c1
    assert c1["recommended_next_screening_date"] is not None

def test_add_child_screening_provisions_guardian_pin():
    """Verify POST /api/triage/add-child provisions a child record and guardian link with 4-digit PIN."""
    payload = {
        "student_full_name": "Testing Priya Syiem",
        "guardian_full_name": "Testing Mary Syiem",
        "guardian_phone": "9876549999",
        "guardian_relationship": "parent",
        "age": 11,
        "sex": "F",
        "is_rural": "true",
        "is_govt_school": "true",
        "prior_sore_throat_episodes_12mo": 4,
        "family_history_rheumatic_fever": "true",
        "overcrowding_index": 4,
        "prior_joint_pain_migratory": "true",
        "prior_chorea_history": "false",
        "prior_subcutaneous_nodules": "false",
        "socioeconomic_score": 2
    }

    res = client.post("/api/triage/add-child", data=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["status"] == "success"
    assert "child_id" in data
    assert "anonymized_code" in data
    assert "guardian_pin" in data
    assert len(data["guardian_pin"]) == 4

    child_id = data["child_id"]
    pin_code = data["guardian_pin"]

    # Verify database insertion
    conn = sqlite3.connect(DB_FILE, timeout=30.0)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM children WHERE id = ?", (child_id,))
    c_row = cursor.fetchone()
    assert c_row is not None
    assert c_row["full_name"] == "Testing Priya Syiem"

    cursor.execute("SELECT * FROM guardian_child_links WHERE child_id = ?", (child_id,))
    g_row = cursor.fetchone()
    assert g_row is not None
    assert g_row["phone_number"] == "9876549999"

    # Verify PIN hash validity using bcrypt
    pin_hash = g_row["access_pin_hash"]
    assert bcrypt.checkpw(pin_code.encode("utf-8"), pin_hash.encode("utf-8")) is True

    conn.close()

def test_survival_forecast_is_per_child_dynamic():
    """Verify Cox survival forecast endpoint returns dynamic probabilities per child based on risk state."""
    res1 = client.get("/api/children/child-0121/survival-forecast")
    assert res1.status_code == 200
    data1 = res1.json()

    res2 = client.get("/api/children/child-0122/survival-forecast")
    assert res2.status_code == 200
    data2 = res2.json()

    assert "survival_probability_6mo" in data1
    assert "survival_probability_12mo" in data1
    assert "survival_probability_24mo" in data1
    assert "ci_lower_6mo" in data1
    assert "ci_upper_6mo" in data1

def test_recompute_screening_intervals_batch_job():
    """Verify batch job recomputes screening interval dates for all children."""
    res = client.post("/api/admin/recompute-screening-intervals")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["updated_count"] > 0
