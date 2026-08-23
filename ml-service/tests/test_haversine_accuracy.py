import pytest
import math

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

def test_haversine_benchmark_accuracy():
    """
    Addendum 12 Fix 0 Unit Test:
    Verifies Haversine formula against known benchmark coordinate pairs in India.
    """
    shillong_center = (25.5788, 91.8933)
    neigrihms = (25.5921, 91.9211)
    east_khasi_heart = (25.5794, 91.8955)
    gmch_guwahati = (26.1558, 91.7612)
    aiims_delhi = (28.5672, 77.2100)

    # 1. Shillong center to East Khasi Heart Centre (Very close < 0.5 km)
    d_local = haversine_km(shillong_center[0], shillong_center[1], east_khasi_heart[0], east_khasi_heart[1])
    assert d_local < 0.5, f"Expected < 0.5 km, got {d_local} km"

    # 2. Shillong center to NEIGRIHMS (~3.16 km)
    d_neigrihms = haversine_km(shillong_center[0], shillong_center[1], neigrihms[0], neigrihms[1])
    assert 2.5 <= d_neigrihms <= 4.0, f"Expected between 2.5 and 4.0 km, got {d_neigrihms} km"

    # 3. Shillong to GMCH Guwahati (~65 km)
    d_guwahati = haversine_km(shillong_center[0], shillong_center[1], gmch_guwahati[0], gmch_guwahati[1])
    assert 60.0 <= d_guwahati <= 72.0, f"Expected between 60 and 72 km, got {d_guwahati} km"

    # 4. Shillong to AIIMS Delhi (~1490 km)
    d_delhi = haversine_km(shillong_center[0], shillong_center[1], aiims_delhi[0], aiims_delhi[1])
    assert 1450.0 <= d_delhi <= 1530.0, f"Expected between 1450 and 1530 km, got {d_delhi} km"
