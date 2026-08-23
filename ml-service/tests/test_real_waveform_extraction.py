import json
import pytest
from fastapi.testclient import TestClient
from backend.server import app

client = TestClient(app)

def test_real_waveform_samples_stored_and_unique_per_demo_child():
    """Verify waveform_samples is populated with real downsampled PCM arrays that differ per child."""
    res = client.get("/api/triage/children?demo_only=true")
    assert res.status_code == 200
    children = res.json()
    if isinstance(children, dict):
        children = children.get("children", [])
        
    audio_children = [c for c in children if isinstance(c, dict) and c.get("audio_file_url") and c.get("anonymized_code", "").startswith("CS-MEG-01")]
    assert len(audio_children) >= 6, f"Expected at least 6 audio-having demo children, found {len(audio_children)}"
    
    sample_arrays = []
    for c in audio_children:
        samples_raw = c.get("waveform_samples")
        assert samples_raw is not None, f"Child {c.get('anonymized_code')} missing waveform_samples column"
        
        parsed = json.loads(samples_raw) if isinstance(samples_raw, str) else samples_raw
        assert isinstance(parsed, list), f"Expected list for waveform_samples, got {type(parsed)}"
        assert len(parsed) >= 100, f"Expected at least 100 sample points, got {len(parsed)}"
        
        # Store serialized tuple to verify uniqueness across children
        sample_arrays.append(tuple(parsed))
        
    # Assert zero duplicate sample arrays across demo children
    assert len(sample_arrays) == len(set(sample_arrays)), "Found duplicate waveform_samples arrays across audio children"
