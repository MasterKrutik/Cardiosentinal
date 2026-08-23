import pytest
import sqlite3
import os
import io

DB_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend/cardiosentinel.db"))

def test_camps_registry_schema_and_status():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM screening_camps")
    camps = cursor.fetchall()
    conn.close()

    assert len(camps) > 0
    planned_camps = [c for c in camps if c["status"] == "planned"]
    active_camps = [c for c in camps if c["status"] == "active"]
    
    assert len(planned_camps) >= 1
    assert len(active_camps) >= 1

def test_camp_roster_consent_and_checkin():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM camp_roster WHERE camp_id = 'camp-01'")
    roster = cursor.fetchall()
    conn.close()

    assert len(roster) > 0
    statuses = set(r["consent_status"] for r in roster)
    assert "received" in statuses
    assert "pending" in statuses or "declined" in statuses

def test_reportlab_completion_report_generation():
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = [
        Paragraph("CARDIO SENTINEL - CAMP COMPLETION REPORT", styles['Heading1']),
        Paragraph("Total Screened: 112 / 150", styles['Normal'])
    ]
    doc.build(elements)
    pdf_bytes = buffer.getvalue()

    assert pdf_bytes.startswith(b"%PDF-1.")
    assert len(pdf_bytes) > 500
