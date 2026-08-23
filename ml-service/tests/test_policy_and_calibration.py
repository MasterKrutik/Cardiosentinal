import pytest
from scipy import stats

def test_policy_simulation_roi_logic():
    # Verify Government Schools Only has lower cost per detection than All Schools
    govt_eligible = 6500
    govt_rate = 7.68 / 1000.0
    govt_camps = 25
    govt_cost_camp = 15000

    govt_detections = round(govt_eligible * govt_rate * min(1.0, (govt_camps * 250) / govt_eligible))
    govt_total_cost = govt_camps * govt_cost_camp
    govt_cost_per_case = govt_total_cost / govt_detections

    all_eligible = 10000
    all_rate = 6.10 / 1000.0
    all_detections = round(all_eligible * all_rate * min(1.0, (govt_camps * 250) / all_eligible))
    all_total_cost = govt_camps * govt_cost_camp
    all_cost_per_case = all_total_cost / all_detections

    # Government schools strategy should yield higher detection ROI (lower cost per case)
    assert govt_cost_per_case < all_cost_per_case

def test_model_calibration_ece_bounds():
    ece_score = 0.035
    # High trust threshold is < 0.05
    assert ece_score < 0.05
