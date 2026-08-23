import pytest
from kulldorff_scan import KulldorffSpaceTimeScanStatistic

def test_cluster_detection_sanity():
    """
    Addendum 6 Fix 2: Asserts that running Kulldorff space-time scan statistic against
    seeded camp data returns at least 1 significant cluster (is_significant = True) AND
    that not every camp is flagged (avoiding miscalibrated 100% false-positive rate).
    """
    scanner = KulldorffSpaceTimeScanStatistic(n_mc_replications=999)

    camp_records = [
        {"camp_id": "camp-01", "school_name": "Mawsynram Govt School", "latitude": 25.31, "longitude": 91.58, "observed_cases": 2, "total_screened": 120},
        {"camp_id": "camp-02", "school_name": "Sohra District School", "latitude": 25.27, "longitude": 91.73, "observed_cases": 3, "total_screened": 110},
        {"camp_id": "camp-03", "school_name": "Pynthorumkhrah Rural School", "latitude": 25.59, "longitude": 91.91, "observed_cases": 24, "total_screened": 130}, # Outbreak spike
        {"camp_id": "camp-04", "school_name": "Nongpoh Community School", "latitude": 25.90, "longitude": 91.88, "observed_cases": 1, "total_screened": 100},
        {"camp_id": "camp-05", "school_name": "Jowai Central School", "latitude": 25.44, "longitude": 92.20, "observed_cases": 2, "total_screened": 115}
    ]

    results = scanner.detect_clusters(camp_records)

    sig_clusters = [r for r in results if r["is_significant"]]
    non_sig = [r for r in results if not r["is_significant"]]

    assert len(sig_clusters) >= 1, f"Expected at least 1 significant cluster, got {len(sig_clusters)}"
    assert len(non_sig) >= 1, f"Expected at least 1 non-significant camp, got {len(non_sig)} (avoiding 100% false positives)"
    assert any(c["camp_id"] == "camp-03" for c in sig_clusters), "Expected camp-03 to be flagged as a significant space-time cluster"
