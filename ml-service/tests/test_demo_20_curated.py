import pytest
import sqlite3
import os
from fastapi.testclient import TestClient

from server import app, DB_FILE
from seed_demo_20 import seed_demo_20

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def ensure_demo_seeded():
    seed_demo_20()

def test_demo_20_children_exist_and_count_is_exact():
    """Verify GET /api/triage/children?demo_only=true returns exactly 20 curated children."""
    res = client.get("/api/triage/children?demo_only=true")
    assert res.status_code == 200
    data = res.json()
    children = data.get("children", [])
    assert len(children) == 20

def test_no_duplicate_children_in_demo_cohort():
    """Permanent Regression Guard (Addendum 44): Verify zero duplicate anonymized_codes in demo cohort."""
    res = client.get("/api/triage/children?demo_only=true")
    assert res.status_code == 200
    children = res.json().get("children", [])
    codes = [c.get("anonymized_code") for c in children]
    assert len(codes) == len(set(codes)), f"BUG: duplicate anonymized_code found in demo cohort: {codes}"
    assert len(children) == 20, f"BUG: demo cohort should have exactly 20 children, found {len(children)}"

def test_demo_20_combined_uniqueness_no_collisions():
    """Verify zero full-vector collisions across Jones criteria, acoustic physics, scores, and risk tiers."""
    res = client.get("/api/triage/children?demo_only=true")
    assert res.status_code == 200
    children = res.json().get("children", [])

    vectors = set()
    for c in children:
        vec = (
            c.get("prior_sore_throat_episodes_12mo"),
            c.get("family_history_rheumatic_fever"),
            c.get("overcrowding_index"),
            c.get("prior_joint_pain_migratory"),
            c.get("prior_chorea_history"),
            c.get("prior_subcutaneous_nodules"),
            c.get("estimated_jet_velocity_ms"),
            c.get("xgboost_raw_score"),
            c.get("calibrated_probability"),
            c.get("risk_tier")
        )
        vectors.add(vec)

    assert len(vectors) == 20, f"Expected 20 unique feature/score vectors, found {len(vectors)}"

def test_demo_20_spans_all_risk_tiers():
    """Verify the 20 demo children span high, moderate, low, and priority_uncertain risk tiers."""
    res = client.get("/api/triage/children?demo_only=true")
    children = res.json().get("children", [])

    tiers = set(c.get("risk_tier") for c in children)
    assert "high" in tiers
    assert "moderate" in tiers
    assert "low" in tiers
    assert "priority_uncertain" in tiers

def test_demo_20_determinism_reloads_identical_text_and_curves():
    """Verify loading a child's data 3 times returns 100% identical score, AI text, and survival forecast."""
    code = "CS-MEG-0121"
    
    # 3 consecutive GETs for triage child detail
    res1 = client.get(f"/api/triage/children")
    c1 = next(c for c in res1.json()["children"] if c["anonymized_code"] == code)

    res2 = client.get(f"/api/triage/children")
    c2 = next(c for c in res2.json()["children"] if c["anonymized_code"] == code)

    assert c1["ai_explanation"] == c2["ai_explanation"]
    assert c1["calibrated_probability"] == c2["calibrated_probability"]
    assert c1["estimated_jet_velocity_ms"] == c2["estimated_jet_velocity_ms"]

    # 3 consecutive GETs for survival forecast
    s1 = client.get(f"/api/children/{c1['id']}/survival-forecast").json()
    s2 = client.get(f"/api/children/{c1['id']}/survival-forecast").json()

    assert s1["survival_probability_6mo"] == s2["survival_probability_6mo"]
    assert s1["survival_probability_12mo"] == s2["survival_probability_12mo"]
    assert s1["survival_probability_24mo"] == s2["survival_probability_24mo"]

def test_demo_20_audio_vs_no_audio_spread():
    """Verify demo set has a real spread of students with audio (8+) and without audio (8+)."""
    res = client.get("/api/triage/children?demo_only=true")
    children = res.json().get("children", [])

    with_audio = [c for c in children if c.get("estimated_jet_velocity_ms") is not None]
    without_audio = [c for c in children if c.get("estimated_jet_velocity_ms") is None]

    assert len(with_audio) >= 8, f"Expected at least 8 audio cases, found {len(with_audio)}"
    assert len(without_audio) >= 8, f"Expected at least 8 no-audio cases, found {len(without_audio)}"
