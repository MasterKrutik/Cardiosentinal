"""
Addendum 36 — Regression Guard: District Heatmap Statistical Credibility
Ensures:
  1. population_prevalence_per_1000 is in a realistic literature range (3–10 / 1,000) for all districts
  2. cluster_detections contains ≥ 2 genuinely distinct district_ids
  3. No duplicate cluster IDs exist in the database
  4. No district snapshot subclinical_rate_per_1000 (triage rate) is mislabeled as prevalence
"""
import sys
import os
import sqlite3

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../backend')))

DB_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../backend/cardiosentinel.db'))


def get_conn():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


def test_population_prevalence_in_literature_range():
    """Guard 1: population_prevalence_per_1000 must be within 3.0–10.0 for all districts.
    This catches the 586/1,000 bug class where triage flag rates are mislabeled as prevalence.
    """
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT district_id, population_prevalence_per_1000
        FROM district_surveillance_snapshots
        WHERE population_prevalence_per_1000 IS NOT NULL
    """)
    rows = cursor.fetchall()
    conn.close()

    assert len(rows) > 0, "No snapshot rows found — run seed_data.py first"

    for row in rows:
        dist_id = row['district_id']
        rate = row['population_prevalence_per_1000']
        assert 3.0 <= rate <= 10.0, (
            f"CREDIBILITY BUG: district {dist_id} has population_prevalence_per_1000 = {rate}, "
            f"which is outside the literature-plausible range of 3.0–10.0 / 1,000. "
            f"Check that refresh_district_snapshots_job() uses _compute_literature_prevalence(), "
            f"not the raw triage flag rate."
        )


def test_clusters_span_multiple_distinct_districts():
    """Guard 2: cluster_detections must have ≥ 2 distinct district_ids.
    Ensures we seeded 3 real clusters, not just 1 Meghalaya cluster.
    """
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT district_id FROM cluster_detections WHERE is_significant = 1")
    distinct_districts = [r['district_id'] for r in cursor.fetchall()]
    conn.close()

    assert len(distinct_districts) >= 2, (
        f"Only {len(distinct_districts)} distinct district(s) in cluster_detections: {distinct_districts}. "
        f"Expected ≥ 2 (Meghalaya + AP + Bihar). Run seed_data.py to populate."
    )


def test_no_duplicate_cluster_ids():
    """Guard 3: No duplicate UUIDs in cluster_detections.
    The DELETE-before-seed pattern in seed_data.py should prevent this.
    """
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT id, COUNT(*) as cnt FROM cluster_detections GROUP BY id HAVING cnt > 1")
    dupes = cursor.fetchall()
    conn.close()

    assert len(dupes) == 0, (
        f"Duplicate cluster IDs found: {[dict(r) for r in dupes]}. "
        f"Ensure seed_data.py runs 'DELETE FROM cluster_detections' before inserting."
    )


def test_triage_flag_rate_not_confused_with_prevalence():
    """Guard 4: The raw triage flag rate (flagged/screened * 1000) for the demo dataset
    is expected to be high (>50/1000 given the risk-enriched demo cohort).
    Confirm this rate is NOT stored in population_prevalence_per_1000.
    """
    conn = get_conn()
    cursor = conn.cursor()
    # Get the triage rate for East Khasi Hills (the curated demo district)
    cursor.execute("""
        SELECT subclinical_rate_per_1000, population_prevalence_per_1000
        FROM district_surveillance_snapshots
        WHERE district_id = 'dist-meghalaya-01'
        ORDER BY snapshot_date DESC LIMIT 1
    """)
    row = cursor.fetchone()
    conn.close()

    if row is None:
        return  # No snapshot yet — OK, skip

    triage_rate = row['subclinical_rate_per_1000']
    pop_prev = row['population_prevalence_per_1000']

    # The triage rate from the demo cohort is expected to be high (>>10)
    # but population_prevalence must be in literature range
    assert pop_prev is None or pop_prev <= 10.0, (
        f"population_prevalence_per_1000 = {pop_prev} — this looks like the triage flag rate "
        f"({triage_rate}/1,000) was stored in the prevalence column. Fix _compute_literature_prevalence()."
    )
