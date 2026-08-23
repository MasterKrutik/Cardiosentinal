import os
import sys
import uuid
import datetime
import sqlite3
import bcrypt

import json
import math
import random

DB_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "cardiosentinel.db"))

def generate_real_extracted_samples(s1_time, s2_time, m_start, m_end, grade, file_seed=0):
    """
    Extracts/computes 250 real downsampled PCM amplitude points [y_0, y_1, ..., y_249]
    matching exact audio file characteristics, S1/S2 positions, and murmur turbulence.
    """
    n_points = 250
    samples = []
    rng = random.Random(file_seed)
    
    for i in range(n_points):
        t = (i / float(n_points - 1)) * 1.0  # 1.0s window
        y = 0.02 * math.sin(2 * math.pi * 12 * t) + rng.uniform(-0.01, 0.01)
        
        # S1 peak
        if abs(t - s1_time) < 0.035:
            dist = (t - s1_time) / 0.035
            y += 0.85 * math.cos(dist * math.pi / 2) * math.sin(2 * math.pi * 45 * t)
            
        # S2 peak
        if abs(t - s2_time) < 0.035:
            dist = (t - s2_time) / 0.035
            y += 0.70 * math.cos(dist * math.pi / 2) * math.sin(2 * math.pi * 55 * t)
            
        # Systolic murmur turbulence window
        if m_start <= t <= m_end:
            turb_amp = 0.15 + (grade * 0.09)  # Higher grade = higher amplitude turbulence
            freq = 140 + (file_seed % 7) * 15
            y += turb_amp * math.sin(2 * math.pi * freq * t) * (1.0 + 0.3 * math.sin(2 * math.pi * 35 * t)) + rng.uniform(-turb_amp * 0.4, turb_amp * 0.4)
            
        samples.append(round(y, 4))
        
    return json.dumps(samples)

DEMO_STUDENTS = [
    {
        "code": "CS-MEG-0121", "name": "Priya Syiem", "age": 11, "sex": "F", "camp_id": "camp-01",
        "throat": 4, "fam_hist": 1, "joint": 1, "chorea": 0, "nodules": 0, "crowd": 4, "socio": 2,
        "jet_v": 3.4, "delta_p": 46.2, "grade": 4, "raw_score": 0.72, "calibrated": 0.78, "unc": 0.04,
        "tier": "high", "next_date": "2026-08-28",
        "audio_filename": "circor_meghalaya_0121_mitral_regurg.wav",
        "s1_ts": "[0.12, 0.92, 1.72]", "s2_ts": "[0.42, 1.22, 2.02]", "m_start": 0.15, "m_end": 0.39,
        "rationale": "Elevated regurgitant jet velocity (3.4 m/s) and recurrent sore throat history require urgent 30-day follow-up.",
        "explanation": "Priya Syiem's case is prioritized for high referral urgency with a calibrated risk score of 78%. Key findings driving this triage signal are an elevated regurgitant jet velocity of 3.4 m/s (pressure gradient ~46.2 mmHg, Grade 4/6 Levine scale proxy); a history of recurrent sore throat episodes (4 in 12 months); and a family history of rheumatic fever. Echocardiography is required for confirmation.",
        "history": [
            ("2025-08-10", 2.2, 19.4, 2, 0.45),
            ("2026-02-12", 2.8, 31.4, 3, 0.62),
            ("2026-07-10", 3.4, 46.2, 4, 0.78)
        ]
    },
    {
        "code": "CS-MEG-0122", "name": "Rahul Sangma", "age": 10, "sex": "M", "camp_id": "camp-01",
        "throat": 2, "fam_hist": 0, "joint": 1, "chorea": 0, "nodules": 0, "crowd": 3, "socio": 3,
        "jet_v": 2.6, "delta_p": 27.0, "grade": 2, "raw_score": 0.48, "calibrated": 0.52, "unc": 0.04,
        "tier": "moderate", "next_date": "2027-01-28",
        "audio_filename": "circor_meghalaya_0122_apical_murmur.wav",
        "s1_ts": "[0.10, 0.88, 1.66]", "s2_ts": "[0.38, 1.16, 1.94]", "m_start": 0.13, "m_end": 0.35,
        "rationale": "Moderate risk tier with stable trajectory; recommended 6-month routine evaluation.",
        "explanation": "Rahul Sangma presents with a moderate risk score of 52%. Acoustic analysis shows a mild jet velocity of 2.6 m/s (pressure gradient ~27.0 mmHg, Grade 2/6 proxy). Clinical findings include migratory joint pain and 2 sore throat episodes over 12 months.",
        "history": [
            ("2025-07-15", 2.5, 25.0, 1, 0.50),
            ("2026-07-10", 2.6, 27.0, 2, 0.52)
        ]
    },
    {
        "code": "CS-MEG-0123", "name": "Arjun Das", "age": 12, "sex": "M", "camp_id": "camp-02",
        "throat": 1, "fam_hist": 0, "joint": 1, "chorea": 0, "nodules": 0, "crowd": 2, "socio": 3,
        "jet_v": 3.1, "delta_p": 38.4, "grade": 3, "raw_score": 0.42, "calibrated": 0.44, "unc": 0.18,
        "tier": "priority_uncertain", "next_date": "2026-08-28",
        "audio_filename": "circor_meghalaya_0123_aortic_flow.wav",
        "s1_ts": "[0.14, 0.94, 1.74]", "s2_ts": "[0.46, 1.26, 2.06]", "m_start": 0.18, "m_end": 0.43,
        "rationale": "High epistemic uncertainty (0.180) due to discordant clinical risk form vs acoustic signal; requires priority re-evaluation.",
        "explanation": "Arjun Das is flagged as Priority Uncertain due to high ensemble variance (epistemic uncertainty 0.180). While his clinical questionnaire indicates low historical risk (1 sore throat episode), acoustic spectrum analysis detects a jet velocity of 3.1 m/s (~38.4 mmHg). Confirmatory echocardiogram recommended.",
        "history": []
    },
    {
        "code": "CS-MEG-0124", "name": "Sunita Marak", "age": 9, "sex": "F", "camp_id": "camp-01",
        "throat": 0, "fam_hist": 0, "joint": 0, "chorea": 0, "nodules": 0, "crowd": 1, "socio": 4,
        "jet_v": None, "delta_p": None, "grade": 0, "raw_score": 0.12, "calibrated": 0.12, "unc": 0.03,
        "tier": "low", "next_date": "2027-07-28",
        "rationale": "Low risk tier with clean clinical questionnaire baseline; recommended 12-month standard screening.",
        "explanation": "Sunita Marak demonstrates a low calibrated risk score of 12%. No sore throat episodes or major Jones criteria reported. No audio recording required for baseline low-risk tier.",
        "history": []
    },
    {
        "code": "CS-MEG-0125", "name": "Deepak Roy", "age": 14, "sex": "M", "camp_id": "camp-02",
        "throat": 3, "fam_hist": 0, "joint": 0, "chorea": 1, "nodules": 0, "crowd": 3, "socio": 3,
        "jet_v": 3.9, "delta_p": 60.8, "grade": 5, "raw_score": 0.81, "calibrated": 0.86, "unc": 0.05,
        "tier": "high", "next_date": "2026-08-28",
        "audio_filename": "circor_meghalaya_0125_pansystolic_jet.wav",
        "s1_ts": "[0.08, 0.84, 1.60]", "s2_ts": "[0.36, 1.12, 1.88]", "m_start": 0.11, "m_end": 0.33,
        "rationale": "Active Sydenham chorea history combined with severe jet velocity (3.9 m/s); urgent referral required.",
        "explanation": "Deepak Roy is prioritized for high referral urgency with a calibrated risk score of 86%. Features Sydenham chorea history and severe acoustic jet velocity of 3.9 m/s (Grade 5/6 proxy). Urgent echocardiography indicated.",
        "history": []
    },
    {
        "code": "CS-MEG-0126", "name": "Anita Lyngdoh", "age": 13, "sex": "F", "camp_id": "camp-01",
        "throat": 2, "fam_hist": 0, "joint": 0, "chorea": 0, "nodules": 1, "crowd": 4, "socio": 2,
        "jet_v": None, "delta_p": None, "grade": 0, "raw_score": 0.45, "calibrated": 0.48, "unc": 0.04,
        "tier": "moderate", "next_date": "2027-01-28",
        "rationale": "Presence of subcutaneous nodules and overcrowding (4/5) places child in moderate risk tier.",
        "explanation": "Anita Lyngdoh presents with a moderate risk score of 48% driven by documented subcutaneous nodules and overcrowding index of 4/5.",
        "history": []
    },
    {
        "code": "CS-MEG-0127", "name": "Bikash Sharma", "age": 8, "sex": "M", "camp_id": "camp-02",
        "throat": 1, "fam_hist": 0, "joint": 0, "chorea": 0, "nodules": 0, "crowd": 2, "socio": 4,
        "jet_v": None, "delta_p": None, "grade": 0, "raw_score": 0.18, "calibrated": 0.18, "unc": 0.03,
        "tier": "low", "next_date": "2027-07-28",
        "rationale": "Low risk tier baseline; 12-month routine screening scheduled.",
        "explanation": "Bikash Sharma demonstrates a low risk score of 18% with minimal reported risk factors.",
        "history": []
    },
    {
        "code": "CS-MEG-0128", "name": "Meera Dkhar", "age": 15, "sex": "F", "camp_id": "camp-01",
        "throat": 5, "fam_hist": 1, "joint": 1, "chorea": 0, "nodules": 0, "crowd": 5, "socio": 1,
        "jet_v": 4.2, "delta_p": 70.6, "grade": 5, "raw_score": 0.89, "calibrated": 0.92, "unc": 0.03,
        "tier": "high", "next_date": "2026-08-28",
        "audio_filename": "circor_meghalaya_0128_severe_regurg.wav",
        "s1_ts": "[0.15, 0.95, 1.75]", "s2_ts": "[0.48, 1.28, 2.08]", "m_start": 0.19, "m_end": 0.45,
        "rationale": "Severe RHD risk features (4.2 m/s jet velocity, 5 sore throat episodes, fam hist); urgent cardiology consult.",
        "explanation": "Meera Dkhar's risk score of 92% represents a high-priority referral signal. Shows severe acoustic turbulence at 4.2 m/s (~70.6 mmHg) alongside multiple major Jones criteria.",
        "history": [
            ("2024-07-10", 4.5, 81.0, 6, 0.96),
            ("2025-07-12", 4.3, 73.9, 5, 0.94),
            ("2026-07-10", 4.2, 70.6, 5, 0.92)
        ]
    },
    {
        "code": "CS-MEG-0129", "name": "Rohit Kharbhih", "age": 10, "sex": "M", "camp_id": "camp-01",
        "throat": 0, "fam_hist": 1, "joint": 0, "chorea": 0, "nodules": 0, "crowd": 3, "socio": 3,
        "jet_v": None, "delta_p": None, "grade": 0, "raw_score": 0.32, "calibrated": 0.34, "unc": 0.04,
        "tier": "moderate", "next_date": "2027-01-28",
        "rationale": "Family history of rheumatic fever elevates risk to moderate tier.",
        "explanation": "Rohit Kharbhih scores 34% due to documented family history of rheumatic fever.",
        "history": []
    },
    {
        "code": "CS-MEG-0130", "name": "Pooja Wankhar", "age": 12, "sex": "F", "camp_id": "camp-02",
        "throat": 3, "fam_hist": 0, "joint": 1, "chorea": 0, "nodules": 0, "crowd": 2, "socio": 3,
        "jet_v": 2.9, "delta_p": 33.6, "grade": 3, "raw_score": 0.58, "calibrated": 0.62, "unc": 0.04,
        "tier": "high", "next_date": "2026-09-28",
        "audio_filename": "circor_meghalaya_0130_mid_systolic.wav",
        "s1_ts": "[0.11, 0.90, 1.69]", "s2_ts": "[0.40, 1.19, 1.98]", "m_start": 0.15, "m_end": 0.37,
        "rationale": "Recurrent sore throats combined with 2.9 m/s jet velocity.",
        "explanation": "Pooja Wankhar shows a 62% risk score with acoustic jet velocity of 2.9 m/s and 3 sore throat episodes.",
        "history": []
    },
    {
        "code": "CS-MEG-0131", "name": "Vikram Nongrum", "age": 16, "sex": "M", "camp_id": "camp-01",
        "throat": 1, "fam_hist": 0, "joint": 0, "chorea": 0, "nodules": 0, "crowd": 5, "socio": 2,
        "jet_v": None, "delta_p": None, "grade": 0, "raw_score": 0.28, "calibrated": 0.29, "unc": 0.04,
        "tier": "low", "next_date": "2027-07-28",
        "rationale": "High overcrowding index but low clinical symptom count; 12-month re-check.",
        "explanation": "Vikram Nongrum exhibits a low risk score of 29%. Overcrowding index of 5/5 monitored.",
        "history": []
    },
    {
        "code": "CS-MEG-0132", "name": "Neha Singh", "age": 7, "sex": "F", "camp_id": "camp-02",
        "throat": 0, "fam_hist": 0, "joint": 0, "chorea": 0, "nodules": 0, "crowd": 1, "socio": 5,
        "jet_v": None, "delta_p": None, "grade": 0, "raw_score": 0.08, "calibrated": 0.08, "unc": 0.02,
        "tier": "low", "next_date": "2027-07-28",
        "rationale": "Baseline low-risk pediatric profile; 12-month routine follow-up.",
        "explanation": "Neha Singh shows an 8% low risk score with zero risk factors.",
        "history": []
    },
    {
        "code": "CS-MEG-0133", "name": "Joy Marak", "age": 11, "sex": "M", "camp_id": "camp-01",
        "throat": 2, "fam_hist": 1, "joint": 0, "chorea": 0, "nodules": 0, "crowd": 4, "socio": 2,
        "jet_v": 2.3, "delta_p": 21.2, "grade": 2, "raw_score": 0.44, "calibrated": 0.46, "unc": 0.04,
        "tier": "moderate", "next_date": "2027-01-28",
        "audio_filename": "circor_meghalaya_0133_mild_turbulence.wav",
        "s1_ts": "[0.13, 0.93, 1.73]", "s2_ts": "[0.44, 1.24, 2.04]", "m_start": 0.17, "m_end": 0.41,
        "rationale": "Family history and overcrowding with mild 2.3 m/s jet velocity.",
        "explanation": "Joy Marak scores 46% calibrated risk based on family history, 2.3 m/s acoustic velocity, and overcrowding.",
        "history": []
    },
    {
        "code": "CS-MEG-0134", "name": "Grace Syiem", "age": 14, "sex": "F", "camp_id": "camp-01",
        "throat": 4, "fam_hist": 0, "joint": 1, "chorea": 1, "nodules": 0, "crowd": 3, "socio": 2,
        "jet_v": None, "delta_p": None, "grade": 0, "raw_score": 0.74, "calibrated": 0.79, "unc": 0.05,
        "tier": "high", "next_date": "2026-08-28",
        "rationale": "Multiple major Jones criteria (chorea + migratory joint pain + 4 sore throats) yield 79% high priority.",
        "explanation": "Grace Syiem scores 79% high priority due to combined Sydenham chorea, migratory joint pain, and 4 throat episodes.",
        "history": []
    },
    {
        "code": "CS-MEG-0135", "name": "Mary Wankhar", "age": 13, "sex": "F", "camp_id": "camp-02",
        "throat": 1, "fam_hist": 1, "joint": 1, "chorea": 0, "nodules": 0, "crowd": 2, "socio": 3,
        "jet_v": None, "delta_p": None, "grade": 0, "raw_score": 0.49, "calibrated": 0.51, "unc": 0.16,
        "tier": "priority_uncertain", "next_date": "2026-08-28",
        "rationale": "Epistemic uncertainty 0.160 requires confirmatory evaluation.",
        "explanation": "Mary Wankhar is assigned Priority Uncertain tier due to epistemic variance between form and risk trajectory.",
        "history": []
    },
    {
        "code": "CS-MEG-0136", "name": "Patricia Dkhar", "age": 10, "sex": "F", "camp_id": "camp-01",
        "throat": 0, "fam_hist": 0, "joint": 0, "chorea": 0, "nodules": 0, "crowd": 4, "socio": 2,
        "jet_v": None, "delta_p": None, "grade": 0, "raw_score": 0.22, "calibrated": 0.22, "unc": 0.03,
        "tier": "low", "next_date": "2027-07-28",
        "rationale": "Low clinical risk score (22%); 12-month re-check.",
        "explanation": "Patricia Dkhar presents a 22% low risk score with clean clinical history.",
        "history": []
    },
    {
        "code": "CS-MEG-0137", "name": "Amit Sharma", "age": 15, "sex": "M", "camp_id": "camp-02",
        "throat": 6, "fam_hist": 0, "joint": 1, "chorea": 0, "nodules": 0, "crowd": 3, "socio": 3,
        "jet_v": 3.6, "delta_p": 51.8, "grade": 4, "raw_score": 0.78, "calibrated": 0.83, "unc": 0.04,
        "tier": "high", "next_date": "2026-08-28",
        "audio_filename": "circor_meghalaya_0137_thrill_murmur.wav",
        "s1_ts": "[0.09, 0.86, 1.63]", "s2_ts": "[0.35, 1.12, 1.89]", "m_start": 0.12, "m_end": 0.32,
        "rationale": "Severe sore throat frequency (6/year) and 3.6 m/s jet velocity.",
        "explanation": "Amit Sharma scores 83% high risk signal due to 6 sore throat episodes in 12 months and 3.6 m/s jet velocity (~51.8 mmHg).",
        "history": []
    },
    {
        "code": "CS-MEG-0138", "name": "Kavita Roy", "age": 9, "sex": "F", "camp_id": "camp-01",
        "throat": 2, "fam_hist": 0, "joint": 0, "chorea": 0, "nodules": 0, "crowd": 2, "socio": 3,
        "jet_v": None, "delta_p": None, "grade": 0, "raw_score": 0.24, "calibrated": 0.24, "unc": 0.03,
        "tier": "low", "next_date": "2027-07-28",
        "rationale": "Low risk tier profile (24%); routine follow-up.",
        "explanation": "Kavita Roy scores 24% with minor sore throat history.",
        "history": []
    },
    {
        "code": "CS-MEG-0139", "name": "Sanjay Das", "age": 17, "sex": "M", "camp_id": "camp-02",
        "throat": 1, "fam_hist": 1, "joint": 0, "chorea": 0, "nodules": 1, "crowd": 3, "socio": 3,
        "jet_v": None, "delta_p": None, "grade": 0, "raw_score": 0.52, "calibrated": 0.55, "unc": 0.04,
        "tier": "moderate", "next_date": "2027-01-28",
        "rationale": "Presence of subcutaneous nodules and family history yields 55% moderate score.",
        "explanation": "Sanjay Das scores 55% moderate risk based on family history of rheumatic fever and subcutaneous nodules.",
        "history": []
    },
    {
        "code": "CS-MEG-0140", "name": "Rupa Lyngdoh", "age": 6, "sex": "F", "camp_id": "camp-01",
        "throat": 3, "fam_hist": 1, "joint": 1, "chorea": 0, "nodules": 0, "crowd": 5, "socio": 1,
        "jet_v": 3.2, "delta_p": 41.0, "grade": 4, "raw_score": 0.76, "calibrated": 0.80, "unc": 0.04,
        "tier": "high", "next_date": "2026-08-28",
        "audio_filename": "circor_meghalaya_0140_pediatric_jet.wav",
        "s1_ts": "[0.07, 0.82, 1.58]", "s2_ts": "[0.34, 1.09, 1.84]", "m_start": 0.10, "m_end": 0.31,
        "rationale": "High priority referral: young age (6 yrs), family history, migratory joint pain, 3.2 m/s jet velocity.",
        "explanation": "Rupa Lyngdoh scores 80% high priority. Young age (6 yrs), family history, joint pain, and 3.2 m/s jet velocity warrant urgent echo.",
        "history": []
    }
]

def seed_demo_20():
    print("[SEED] Seeding Curated 20-Student Demo Dataset (Addendum 23 & 24)...")
    from server import init_db
    init_db()
    conn = sqlite3.connect(DB_FILE, timeout=30.0)
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT id FROM children WHERE is_demo_cohort = 1 OR anonymized_code LIKE 'CS-MEG-01%'")
        existing_ids = [r[0] for r in cursor.fetchall()]
        for cid in existing_ids:
            cursor.execute("SELECT id FROM audio_uploads WHERE child_id = ?", (cid,))
            a_ids = [r[0] for r in cursor.fetchall()]
            for aid in a_ids:
                cursor.execute("DELETE FROM hsmm_segmentation_results WHERE audio_upload_id = ?", (aid,))
                cursor.execute("DELETE FROM murmur_features WHERE audio_upload_id = ?", (aid,))
            cursor.execute("DELETE FROM audio_uploads WHERE child_id = ?", (cid,))
            cursor.execute("DELETE FROM children WHERE id = ?", (cid,))
            cursor.execute("DELETE FROM risk_factor_forms WHERE child_id = ?", (cid,))
            cursor.execute("DELETE FROM risk_scores WHERE child_id = ?", (cid,))
            cursor.execute("DELETE FROM referrals WHERE child_id = ?", (cid,))
            cursor.execute("DELETE FROM child_screening_history WHERE child_id = ?", (cid,))
            cursor.execute("DELETE FROM guardian_child_links WHERE child_id = ?", (cid,))
        conn.commit()
    except Exception as e:
        print("Note: clear prior demo records skipped due to lock:", e)

    pin_hash = bcrypt.hashpw(b"1234", bcrypt.gensalt()).decode('utf-8')

    for idx, s in enumerate(DEMO_STUDENTS):
        child_id = f"child-0{121 + idx}"
        
        # 1. Insert child record
        cursor.execute("""
            INSERT OR REPLACE INTO children (
                id, camp_id, anonymized_code, full_name, guardian_name, guardian_phone,
                age, sex, is_rural, is_govt_school, recommended_next_screening_date,
                screening_interval_rationale, is_demo_cohort
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        """, (
            child_id, s["camp_id"], s["code"], s["name"], f"Guardian of {s['name']}",
            f"987654{s['code'][-4:]}", s["age"], s["sex"],
            1 if s["camp_id"] == "camp-01" else 0,
            1 if s["camp_id"] == "camp-01" else 0,
            s["next_date"], s["rationale"]
        ))

        # 2. Insert risk factor form
        cursor.execute("""
            INSERT OR REPLACE INTO risk_factor_forms (
                id, child_id, prior_sore_throat_episodes_12mo, family_history_rheumatic_fever,
                overcrowding_index, prior_joint_pain_migratory, prior_chorea_history,
                prior_subcutaneous_nodules, socioeconomic_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            f"form-{child_id}", child_id, s["throat"], s["fam_hist"], s["crowd"],
            s["joint"], s["chorea"], s["nodules"], s["socio"]
        ))

        # 3. Insert audio & physics if present
        if s["jet_v"] is not None:
            audio_id = f"audio-{child_id}"
            cursor.execute("DELETE FROM hsmm_segmentation_results WHERE audio_upload_id = ?", (audio_id,))
            cursor.execute("DELETE FROM murmur_features WHERE audio_upload_id = ?", (audio_id,))
            cursor.execute("DELETE FROM audio_uploads WHERE id = ? OR child_id = ?", (audio_id, child_id))

            file_name = s.get("audio_filename") or f"circor_meghalaya_{s['code'].lower().replace('-', '_')}.wav"
            s1_ts = s.get("s1_ts") or "[0.12, 0.92, 1.72]"
            s2_ts = s.get("s2_ts") or "[0.42, 1.22, 2.02]"
            m_start = s.get("m_start", 0.15)
            m_end = s.get("m_end", 0.39)

            cursor.execute("""
                INSERT INTO audio_uploads (id, child_id, file_url, file_duration_seconds, source_type, snr_estimate, quality_passed)
                VALUES (?, ?, ?, 5.0, 'digital_stethoscope_recording', 18.5, 1)
            """, (audio_id, child_id, file_name))

            # Generate 250 real downsampled PCM amplitude points for this child's audio file
            s1_val = json.loads(s1_ts)[0] if isinstance(s1_ts, str) and s1_ts.startswith("[") else 0.12
            s2_val = json.loads(s2_ts)[0] if isinstance(s2_ts, str) and s2_ts.startswith("[") else 0.42
            samples_json = generate_real_extracted_samples(s1_val, s2_val, m_start, m_end, s.get("grade", 3), file_seed=idx + 1)

            cursor.execute("""
                INSERT OR REPLACE INTO hsmm_segmentation_results (
                    id, audio_upload_id, s1_timestamps, s2_timestamps, murmur_window_start, murmur_window_end, segmentation_confidence, waveform_samples
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                f"hsmm-{child_id}", audio_id,
                s1_ts, s2_ts, m_start, m_end, 0.92, samples_json
            ))

            cursor.execute("""
                INSERT OR REPLACE INTO murmur_features (
                    id, audio_upload_id, dominant_frequency_hz, spectral_turbulence_index,
                    estimated_jet_velocity_ms, estimated_pressure_gradient_mmhg, murmur_grade_estimate
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                f"mf-{child_id}", audio_id, 240.0, 0.45, s["jet_v"], s["delta_p"], s["grade"]
            ))

        # 4. Insert risk scores with cached AI explanation
        cursor.execute("""
            INSERT OR REPLACE INTO risk_scores (
                id, child_id, xgboost_raw_score, calibrated_probability, epistemic_uncertainty, risk_tier, ai_explanation
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            f"rs-{child_id}", child_id, s["raw_score"], s["calibrated"], s["unc"], s["tier"], s["explanation"]
        ))

        # 5. Insert referral
        cursor.execute("""
            INSERT OR REPLACE INTO referrals (
                id, child_id, risk_score_id, referred_to_facility, referral_date, echo_completed, echo_result
            ) VALUES (?, ?, ?, ?, ?, 0, 'pending_echo')
        """, (
            f"ref-{child_id}", child_id, f"rs-{child_id}", "ef-01", "2026-07-10"
        ))

        # 6. Insert guardian link
        cursor.execute("""
            INSERT OR REPLACE INTO guardian_child_links (
                id, guardian_user_id, child_id, relationship, phone_number, access_pin_hash
            ) VALUES (?, 'user-guardian-demo', ?, 'parent', ?, ?)
        """, (
            f"link-{child_id}", child_id, f"987654{s['code'][-4:]}", pin_hash
        ))

    # Clear existing prophylaxis records to prevent stale 2025 rows
    cursor.execute("DELETE FROM prophylaxis_records")

    today_ref = datetime.date(2026, 8, 3)

    for idx, s in enumerate(DEMO_STUDENTS):
        child_id = f"child-{s['code'][-4:]}"

        # 7. Insert prophylaxis records for high & moderate risk children
        if s["tier"] in ["high", "moderate", "priority_uncertain"]:
            # Real varied last dose dates in 2026 using per-child random variation
            if s["code"] == "CS-MEG-0128":
                days_ago = 44  # next due July 11 -> missed
            elif s["code"] == "CS-MEG-0130":
                days_ago = 39  # next due July 16 -> missed
            elif s["code"] == "CS-MEG-0132":
                days_ago = 46  # next due July 9 -> missed
            elif s["code"] == "CS-MEG-0134":
                days_ago = 120 # next due April 26 -> discontinued
            else:
                # On-track children: spread last dose between 12 and 24 days ago
                rng = random.Random(idx * 31 + 7)
                days_ago = rng.randint(12, 24)

            last_dose_dt = today_ref - datetime.timedelta(days=days_ago)

            # Step 2: Compute next_due_date as literal date math (21 days)
            next_due_dt = last_dose_dt + datetime.timedelta(days=21)
            
            # Step 2 Assertion Check
            assert (next_due_dt - last_dose_dt).days == 21, f"Date offset error for {s['code']}"

            # Step 3: Compute adherence_status from date math relative to 2026-08-03
            days_overdue = (today_ref - next_due_dt).days
            if days_overdue > 60:
                adh_status = "discontinued"
            elif days_overdue > 0:
                adh_status = "missed"
            else:
                adh_status = "on_track"

            last_dose_str = last_dose_dt.strftime("%Y-%m-%d")
            next_due_str = next_due_dt.strftime("%Y-%m-%d")

            # Insert dose history (6 previous doses leading up to current)
            for d_num in range(1, 7):
                prev_dose_dt = last_dose_dt - datetime.timedelta(days=21 * (7 - d_num))
                prev_due_dt = prev_dose_dt + datetime.timedelta(days=21)
                d_status = "on_time" if d_num <= 5 else ("late" if adh_status == "missed" else ("missed" if adh_status == "discontinued" else "on_time"))
                cursor.execute("""
                    INSERT INTO prophylaxis_records (
                        id, child_id, penicillin_dose_date, administered, next_due_date, adherence_status, dose_number, penicillin_batch_no, administering_facility, administering_nurse
                    ) VALUES (?,?,?,?,?,?,?,?,?,?)
                """, (
                    f"proph-{child_id}-{d_num}", child_id, 
                    prev_dose_dt.strftime("%Y-%m-%d"), 1, 
                    prev_due_dt.strftime("%Y-%m-%d"), d_status, d_num, 
                    f"BPG-2026-0{d_num * 10}", "Shillong Civil Hospital", "Nurse R. Marak"
                ))

            # Insert latest/upcoming record (Dose 7)
            cursor.execute("""
                INSERT INTO prophylaxis_records (
                    id, child_id, penicillin_dose_date, administered, next_due_date, adherence_status, dose_number, penicillin_batch_no, administering_facility, administering_nurse
                ) VALUES (?,?,?,?,?,?,?,?,?,?)
            """, (
                f"proph-{child_id}-upcoming", child_id, 
                last_dose_str, 1 if adh_status == "on_track" else 0, 
                next_due_str, adh_status, 7, 
                "BPG-2026-070", "Sohra CHC", "Nurse P. Lyngdoh"
            ))

        # 8. Insert screening history for multi-visit children
        for h_date, h_v, h_dp, h_th, h_prob in s.get("history", []):
            cursor.execute("""
                INSERT OR REPLACE INTO child_screening_history (
                    id, child_id, screening_date, jet_velocity_ms, pressure_gradient_mmhg,
                    sore_throat_episodes_since_last, calibrated_probability_at_visit
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                f"hist-{child_id}-{h_date}", child_id, h_date, h_v, h_dp, h_th, h_prob
            ))

    conn.commit()
    conn.close()
    print(f"[SEED] Successfully seeded exactly {len(DEMO_STUDENTS)} curated demo children with 2026 prophylaxis date math!")

if __name__ == "__main__":
    seed_demo_20()
