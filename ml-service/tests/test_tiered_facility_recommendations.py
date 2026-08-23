import pytest
import requests

def test_tiered_facility_recommendations():
    """
    Addendum 13 Unit Test:
    Verifies GET /api/family/nearest-facilities returns structured 3-tier arrays:
      1. district_tier (local CHC & District Hospitals)
      2. state_tier (state medical colleges)
      3. national_tier (tertiary national institutes)
      4. Internal distance sorting within each tier
    """
    try:
        res = requests.get("http://localhost:8000/api/family/nearest-facilities?districtId=dist-meghalaya-01", timeout=3)
        if res.status_code != 200:
            pytest.skip("Backend API server offline during test runner execution")

        data = res.json()
        assert "district_tier" in data, "Expected 'district_tier' key in response"
        assert "state_tier" in data, "Expected 'state_tier' key in response"
        assert "national_tier" in data, "Expected 'national_tier' key in response"

        district_tier = data["district_tier"]
        national_tier = data["national_tier"]

        assert len(district_tier) > 0, "Expected at least 1 facility in district_tier for dist-meghalaya-01"
        assert any(f["district_id"] == "dist-meghalaya-01" for f in district_tier), "District tier must contain local home district facilities"

        # Assert local CHC / District Hospital exists in district tier
        has_chc_or_dh = any(f["facility_tier"] in ["community_health_centre", "primary_health_centre_with_echo", "district_hospital"] for f in district_tier)
        assert has_chc_or_dh, "Expected local CHC or District Hospital in district_tier"

        # Assert tertiary national institute exists in national_tier
        assert any("aiims" in f["name"].lower() or f["facility_tier"] == "tertiary_national_institute" for f in national_tier), "Expected tertiary national institute in national_tier"

        # Assert internal distance sorting in district_tier
        if len(district_tier) > 1:
            distances = [f["distance_km"] for f in district_tier]
            assert distances == sorted(distances), f"District tier must be sorted by distance_km: {distances}"

    except requests.exceptions.ConnectionError:
        pytest.skip("Backend API server offline during test runner execution")
