import pytest
from cusum_anomaly import CUSUMAnomalyDetector

def test_cusum_anomaly_detector_basic():
    detector = CUSUMAnomalyDetector()
    rates = [0.08, 0.09, 0.10, 0.11, 0.12, 0.38, 0.45, 0.52]
    res = detector.analyze_time_series(rates, camp_name="Pynthorumkhrah Rural Camp")

    assert res["camp_name"] == "Pynthorumkhrah Rural Camp"
    assert res["is_anomalous"] is True
    assert res["alarm_triggered_index"] == 5
    assert len(res["cusum_series"]) == 8
    # Precision consistency check (3 decimal places)
    assert res["threshold_h"] == 0.057
    assert "h=0.057" in res["alert_message"]

def test_cusum_anomaly_detector_normal():
    detector = CUSUMAnomalyDetector()
    rates = [0.08, 0.09, 0.08, 0.09, 0.08, 0.09, 0.08]
    res = detector.analyze_time_series(rates, camp_name="Normal Camp")

    assert res["is_anomalous"] is False
    assert res["alarm_triggered_index"] == -1
    assert res["alert_message"] == "Normal operational bounds."
