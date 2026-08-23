import pytest
from screening_optimizer import POMDPScreeningOptimizer

def test_screening_interval_diversity():
    """
    Addendum 6 Fix 2: Asserts that across a range of child risk profiles,
    the POMDP screening interval optimizer assigns at least 3 distinct interval buckets
    (preventing default collapse to a single fixed interval).
    """
    optimizer = POMDPScreeningOptimizer()

    test_cases = [
        {"prob": 0.15, "unc": 0.02, "slope": "stable"},         # Low risk -> 365 days
        {"prob": 0.45, "unc": 0.08, "slope": "stable"},         # Moderate risk -> 180 days
        {"prob": 0.55, "unc": 0.12, "slope": "deteriorating"},  # Elevated deteriorating -> 60 days
        {"prob": 0.78, "unc": 0.18, "slope": "deteriorating"}   # High risk + high unc -> 30 days
    ]

    assigned_intervals = set()

    for tc in test_cases:
        res = optimizer.optimize_interval(tc["prob"], tc["unc"], tc["slope"])
        assigned_intervals.add(res["recommended_interval_days"])

    assert len(assigned_intervals) >= 3, f"Expected at least 3 distinct interval buckets, got {len(assigned_intervals)}: {assigned_intervals}"
