import pytest
import io
from fastapi.testclient import TestClient
from backend.server import app, generate_referral_pdf_bytes

client = TestClient(app)

def test_generate_referral_pdf_bytes_clinical_structure():
    """Verify ReportLab PDF generator output magic bytes, size, and layout payload."""
    pdf_bytes = generate_referral_pdf_bytes(
        referral_id="ref-0121",
        anonymized_code="CS-MEG-0121",
        child_age=10,
        sex="Female",
        risk_tier="high",
        prob=0.784,
        facility="NEIGRIHMS Cardiology Wing",
        patient_name="Mebakerlin Pyngrope",
        guardian_name="Wanpli Pyngrope",
        guardian_phone="+91 98765 43210",
        school_name="Sohra Government Secondary School",
        district_name="East Khasi Hills, Meghalaya",
        asha_worker="Phida Shullai (ASHA Worker) — Ph: +91 94361 00000",
        murmur_details="Grade II/VI Systolic Murmur detected at Mitral Auscultation Position (Peak Jet Velocity: 2.8 m/s)",
        risk_factors="3 sore throat episodes in past 12 months; Recurrent Pharyngitis History: Yes",
        epistemic_uncertainty="Low epistemic uncertainty (0.04 variance)"
    )

    assert isinstance(pdf_bytes, bytes)
    assert pdf_bytes.startswith(b'%PDF-')
    assert len(pdf_bytes) > 2000  # ReportLab PDF with QR image should be substantial (>2KB)

def test_referral_pdf_endpoint_attachment():
    """Verify GET /api/referrals/ref-0121/slip.pdf endpoint returns 200 OK, application/pdf, and attachment disposition."""
    res = client.get("/api/referrals/ref-0121/slip.pdf")
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert "attachment" in res.headers.get("content-disposition", "")
    assert res.content.startswith(b'%PDF-')
    assert len(res.content) > 2000
