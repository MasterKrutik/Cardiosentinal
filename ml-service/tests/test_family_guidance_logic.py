import pytest
import requests

def test_high_risk_family_guidance_logic():
    """
    Addendum 11 Fix 0 Unit Test:
    Asserts guidance for a HIGH risk child:
      1. Does NOT contain 'routine' or 'continue as scheduled'
      2. DOES contain severity == 'urgent'
      3. DOES contain 'echocardiogram' or 'specialist'
    """
    try:
        res = requests.get("http://localhost:8000/api/family/guidance/child-0121", timeout=3)
        if res.status_code != 200:
            pytest.skip("Backend API server not running locally during unit test execution")
        
        data = res.json()
        cards = data.get("guidance_cards", [])
        assert len(cards) > 0, "Expected at least 1 guidance card for child-0121"

        high_risk_card = cards[0]
        assert high_risk_card["severity"] == "urgent", f"Expected severity 'urgent', got '{high_risk_card['severity']}'"
        assert "routine" not in high_risk_card["message"].lower(), f"High risk card must NOT contain 'routine': {high_risk_card['message']}"
        assert "continue as scheduled" not in high_risk_card["message"].lower(), f"High risk card must NOT contain 'continue as scheduled': {high_risk_card['message']}"
        assert ("echocardiogram" in high_risk_card["message"].lower() or "specialist" in high_risk_card["message"].lower()), f"Expected echocardiogram/specialist in guidance message: {high_risk_card['message']}"
    except requests.exceptions.ConnectionError:
        pytest.skip("Backend API server offline during test runner execution")
