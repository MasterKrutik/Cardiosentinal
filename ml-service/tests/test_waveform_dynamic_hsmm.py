import pytest
from fastapi.testclient import TestClient
from backend.server import app

client = TestClient(app)

def test_audio_filenames_are_distinct_per_demo_child():
    """Verify each audio-having demo student has a distinct filename in audio_uploads."""
    res = client.get("/api/triage/children?demo_only=true")
    assert res.status_code == 200
    children = res.json()
    if isinstance(children, dict):
        children = children.get("children", [])
    
    audio_children = [c for c in children if isinstance(c, dict) and c.get("audio_file_url") and c.get("anonymized_code", "").startswith("CS-MEG-01")]
    assert len(audio_children) >= 6, f"Expected at least 6 audio-having demo children, found {len(audio_children)}"
    
    filenames = [c["audio_file_url"] for c in audio_children]
    assert len(filenames) == len(set(filenames)), f"Found duplicate audio filenames: {filenames}"

def test_hsmm_segmentation_timestamps_are_distinct_per_demo_child():
    """Verify each audio-having demo student has distinct S1/S2 timestamps and murmur window start/end."""
    res = client.get("/api/triage/children?demo_only=true")
    assert res.status_code == 200
    children = res.json()
    if isinstance(children, dict):
        children = children.get("children", [])
    
    audio_children = [c for c in children if isinstance(c, dict) and c.get("audio_file_url") and c.get("anonymized_code", "").startswith("CS-MEG-01")]
    
    segmentations = []
    for c in audio_children:
        s1 = c.get("s1_timestamps")
        s2 = c.get("s2_timestamps")
        m_start = c.get("murmur_window_start")
        m_end = c.get("murmur_window_end")
        
        seg_tuple = (str(s1), str(s2), str(m_start), str(m_end))
        segmentations.append(seg_tuple)
    
    assert len(segmentations) == len(set(segmentations)), f"Found duplicate HSMM segmentations: {segmentations}"
