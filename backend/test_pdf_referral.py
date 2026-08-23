import unittest
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from server import generate_referral_pdf_bytes, app
from fastapi.testclient import TestClient

class TestReferralPDFIntegration(unittest.TestCase):
    """
    Integration test for PDF Referral Slip & QR Code Generation (Fix 3 from Addendum).
    Asserts HTTP 200 and %PDF magic bytes header.
    """
    def setUp(self):
        self.client = TestClient(app)

    def test_referral_pdf_magic_bytes(self):
        pdf_bytes = generate_referral_pdf_bytes(
            referral_id="ref-test-101",
            anonymized_code="CS-MAW-0042",
            child_age=11,
            sex="F",
            risk_tier="high",
            prob=0.78,
            facility="NEIGRIHMS Shillong Pediatric Cardiology"
        )
        self.assertTrue(len(pdf_bytes) > 0, "PDF bytes should not be empty")
        self.assertTrue(pdf_bytes.startswith(b"%PDF"), f"PDF must start with %PDF magic bytes. Got: {pdf_bytes[:10]}")

    def test_api_referral_slip_endpoint(self):
        response = self.client.get("/api/referrals/ref-child-0001/slip.pdf")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["content-type"], "application/pdf")
        self.assertTrue(response.content.startswith(b"%PDF"), "API Response must start with %PDF magic bytes")

if __name__ == "__main__":
    unittest.main()
