import pytest
import datetime
from fastapi.testclient import TestClient
from backend.server import app

client = TestClient(app)

def test_prophylaxis_dates_are_real_and_varied():
    """Hard automated regression guard ensuring real 2026 dates, exact 21-day offset, and varied sparklines."""
    res = client.get("/api/prophylaxis/records")
    assert res.status_code == 200
    data = res.json()
    
    records = data["prophylaxis_records"]
    assert len(records) > 0, "prophylaxis_records should not be empty"

    last_dose_dates = [r["penicillin_dose_date"] for r in records]
    next_due_dates = [r["next_due_date"] for r in records]

    # Guard 1: dates must not all be identical across children
    assert len(set(last_dose_dates)) > 1, "BUG: all last_dose_date values are identical"
    assert len(set(next_due_dates)) > 1, "BUG: all next_due_date values are identical"

    # Guard 2: no literal placeholder date allowed
    banned_date = "2025-09-01"
    assert banned_date not in last_dose_dates, "BUG: hardcoded placeholder date 2025-09-01 still present in last_dose_date"
    assert banned_date not in next_due_dates, "BUG: hardcoded placeholder date 2025-09-01 still present in next_due_dates"

    # Guard 3: next_due_date must always be exactly 21 days after last_dose_date
    for r in records:
        d_dt = datetime.datetime.strptime(r["penicillin_dose_date"], "%Y-%m-%d").date()
        nd_dt = datetime.datetime.strptime(r["next_due_date"], "%Y-%m-%d").date()
        assert (nd_dt - d_dt).days == 21, (
            f"BUG: {r.get('child_id')} next_due_date ({nd_dt}) is not last_dose_date ({d_dt}) + 21 days"
        )

    # Guard 4: dates must fall in a real, current year range (2026), not 2025
    for r in records:
        d_dt = datetime.datetime.strptime(r["penicillin_dose_date"], "%Y-%m-%d").date()
        assert d_dt.year >= 2026, (
            f"BUG: {r.get('child_id')} last_dose_date is in the wrong year: {d_dt}"
        )

    # Guard 5: sparkline patterns differ across at least 3 different children
    sparkline_patterns = {tuple(r["sparkline"]) for r in records if "sparkline" in r}
    assert len(sparkline_patterns) >= 3, f"BUG: sparkline patterns are not visibly varied! Found: {sparkline_patterns}"

    # Guard 6: confirm no row has self-contradictory status/action (missed or discontinued cannot be on_track/current)
    for r in records:
        st = r["adherence_status"]
        if st in ["missed", "discontinued"]:
            assert r.get("days_overdue", 0) > 0, f"BUG: {r['anonymized_code']} has status {st} but days_overdue <= 0"
