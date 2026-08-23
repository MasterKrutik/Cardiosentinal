import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../backend')))

import pytest
from fastapi.testclient import TestClient
from server import app, DB_FILE
import sqlite3


client = TestClient(app)

def test_journey_timeline_fields_child_0121():
    """Verify child-0121 dynamic timeline progress metrics and timestamps (Step 3 Active)."""
    res = client.get("/api/family/journey/child-0121")
    assert res.status_code == 200
    data = res.json()

    assert data["active_step"] == 3
    assert data["current_stage"] == "referral"
    assert data["progress_percentage"] == 75
    assert "Step 3 of 4" in data["step_label"]
    assert "screening_date" in data
    assert "triage_date" in data
    assert "referral_date" in data
    assert "Recommended within 7 days" in data["target_visit_window"]

def test_journey_timeline_progress_step_4():
    """Verify child with echo_completed=True advances to Step 4 of 4 (100% progress)."""
    conn = sqlite3.connect(DB_FILE, timeout=30)
    cursor = conn.cursor()
    # child_id is UNIQUE in referrals — insert only if row doesn't exist, then force echo_completed=1
    cursor.execute("""
        INSERT OR IGNORE INTO referrals (id, child_id, risk_score_id, referred_to_facility, referral_date, echo_completed, echo_result)
        VALUES ('ref-child-0122-test', 'child-0122', 'score-0122', 'NEIGRIHMS Cardiology Wing', DATE('now'), 1, 'definite_rhd')
    """)
    cursor.execute("UPDATE referrals SET echo_completed = 1, echo_result = 'definite_rhd' WHERE child_id = 'child-0122'")
    conn.commit()
    conn.close()

    res = client.get("/api/family/journey/child-0122")
    assert res.status_code == 200
    data = res.json()

    assert data["active_step"] == 4, f"Expected step 4 but got {data.get('active_step')} (stage={data.get('current_stage')})"
    assert data["current_stage"] == "prophylaxis"
    assert data["progress_percentage"] == 100
    assert "Step 4 of 4" in data["step_label"]

    # Revert — reset echo_completed back to 0 and remove test row if it was ours
    conn = sqlite3.connect(DB_FILE, timeout=30)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM referrals WHERE id = 'ref-child-0122-test'")
    cursor.execute("UPDATE referrals SET echo_completed = 0, echo_result = 'not_yet_done' WHERE child_id = 'child-0122'")
    conn.commit()
    conn.close()
