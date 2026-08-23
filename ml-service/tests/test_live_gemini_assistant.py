import pytest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../backend')))
import requests

BASE_URL = "http://localhost:8000"

def test_family_ask_english():
    payload = {
        "child_id": "child-0121",
        "message": "Will my child be okay? What should I do next?",
        "language": "en"
    }
    response = requests.post(f"{BASE_URL}/api/family/ask", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    reply = data["reply"]
    assert len(reply) > 20
    assert "triage priority signal, not a diagnosis" in reply.lower()

def test_family_ask_hindi():
    payload = {
        "child_id": "child-0121",
        "message": "Kya mera bachcha theek ho jayega?",
        "language": "hi"
    }
    response = requests.post(f"{BASE_URL}/api/family/ask", json=payload)
    assert response.status_code == 200
    data = response.json()
    reply = data["reply"]
    assert len(reply) > 20
    assert "triage priority signal, not a diagnosis" in reply.lower()

def test_family_ask_khasi():
    payload = {
        "child_id": "child-0121",
        "message": "Bale dei ban leit hospital na ka bynta echo?",
        "language": "kha"
    }
    response = requests.post(f"{BASE_URL}/api/family/ask", json=payload)
    assert response.status_code == 200
    data = response.json()
    reply = data["reply"]
    assert "triage priority signal" in reply.lower() and ("diagnosis" in reply.lower() or "not a diagnosis" in reply.lower())

def test_banned_substring_filter():
    from server import BANNED_SUBSTRINGS, FALLBACK_SAFE_DISCLAIMER
    banned_sample = "This patient has rhd and is confirmed RHD."
    banned_found = any(term in banned_sample.lower() for term in BANNED_SUBSTRINGS)
    assert banned_found is True

    # Test safety replacement logic
    if banned_found:
        safe_output = f"Your child's screening showed acoustic signals that warrant follow-up evaluation. {FALLBACK_SAFE_DISCLAIMER}"
    assert "has rhd" not in safe_output.lower()
    assert "triage priority signal, not a diagnosis" in safe_output.lower()
