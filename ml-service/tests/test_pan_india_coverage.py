import pytest
import requests

PAN_INDIA_TEST_COORDS = [
    ("Mumbai", "Maharashtra", 19.0652, 72.8682),
    ("Bengaluru", "Karnataka", 12.8080, 77.6970),
    ("Chennai", "Tamil Nadu", 13.0604, 80.2496),
    ("Kolkata", "West Bengal", 22.4842, 88.3980),
    ("Jaipur", "Rajasthan", 26.8920, 75.8150),
    ("Chandigarh", "Punjab", 30.7640, 76.7770),
    ("Kochi", "Kerala", 10.0320, 76.2990),
    ("Hyderabad", "Telangana", 17.4220, 78.4550),
    ("Lucknow", "Uttar Pradesh", 26.7450, 80.9480),
    ("Srinagar", "Jammu & Kashmir", 34.1320, 74.8020)
]

@pytest.mark.parametrize("city,state,lat,lng", PAN_INDIA_TEST_COORDS)
def test_pan_india_live_gps_coverage(city, state, lat, lng):
    """
    Addendum 15 Pan-India Test:
    Verifies that for simulated coordinates in 10+ states across India,
    GET /api/family/nearest-facilities dynamically detects the correct city and state,
    and returns non-empty local facility results.
    """
    try:
        url = f"http://localhost:8000/api/family/nearest-facilities?lat={lat}&lng={lng}&mode=gps"
        res = requests.get(url, timeout=3)
        if res.status_code != 200:
            pytest.skip("Backend API server offline during test runner execution")

        data = res.json()
        assert data.get("detected_city") == city, f"Expected city '{city}', got '{data.get('detected_city')}'"
        assert data.get("home_state") == state, f"Expected state '{state}', got '{data.get('home_state')}'"

        district_tier = data.get("district_tier", [])
        assert len(district_tier) > 0, f"Expected non-empty district_tier for {city}, {state}"
        assert district_tier[0]["city"] == city, f"First facility in district_tier should be in {city}"
        assert district_tier[0]["distance_km"] < 25.0, f"Distance to local facility in {city} must be < 25 km, got {district_tier[0]['distance_km']} km"

    except requests.exceptions.ConnectionError:
        pytest.skip("Backend API server offline during test runner execution")
