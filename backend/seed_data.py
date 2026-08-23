import os
import sys
import uuid
import datetime
import random
import numpy as np
import sqlite3
from scipy.io import wavfile

# Add ml-service to sys.path so seed runner can invoke full ML pipeline natively
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ml-service")))

from hsmm_segmentation import HSMMHeartSoundSegmenter
from bernoulli_physics import BernoulliPhysicsExtractor
from fusion_model import XGBoostFusionModel
from calibration import CalibrationModule
from explanation_agent import AIExplanationAgent

DB_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "cardiosentinel.db"))

def run_seed():
    print("[SEED] Running CardioSentinel Literature-Calibrated Seed Script (Addendum Fix 5)...")
    from server import init_db
    init_db()
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # Clear existing tables for fresh deterministic seed
    tables = [
        "users", "districts", "schools", "screening_camps", "children",
        "risk_factor_forms", "audio_uploads", "hsmm_segmentation_results",
        "murmur_features", "risk_scores", "referrals", "prophylaxis_records",
        "district_surveillance_snapshots", "guardian_child_links", "echo_facilities",
        "camp_route_stops", "asha_impact_snapshots", "offline_sync_conflicts"
    ]
    for t in tables:
        cursor.execute(f"DELETE FROM {t};")


    # 1. Seed Users (with RBAC roles & disclaimer acknowledged status)
    users = [
        (str(uuid.uuid4()), "ASHA Worker Kavita Devi", "asha@cardiosentinel.org", "pbkdf2_hash_demo", "asha_worker", "dist-meghalaya-01", 1),
        (str(uuid.uuid4()), "Dr. Rajesh Sharma (Camp Admin)", "admin@cardiosentinel.org", "pbkdf2_hash_demo", "school_camp_admin", "dist-ap-01", 1),
        (str(uuid.uuid4()), "Dr. Priya Sundaram (DHO)", "district@cardiosentinel.org", "pbkdf2_hash_demo", "district_health_officer", "dist-bihar-01", 1),
        (str(uuid.uuid4()), "System Admin", "super@cardiosentinel.org", "pbkdf2_hash_demo", "super_admin", "dist-meghalaya-01", 1)
    ]
    cursor.executemany("INSERT INTO users VALUES (?,?,?,?,?,?,?,CURRENT_TIMESTAMP)", users)

    # 2. Seed 3-5 Real Indian Districts
    districts = [
        ("dist-meghalaya-01", "East Khasi Hills", "Meghalaya", 825922),
        ("dist-ap-01", "Chittoor", "Andhra Pradesh", 4174064),
        ("dist-bihar-01", "Patna", "Bihar", 5838465)
    ]
    cursor.executemany("INSERT INTO districts VALUES (?,?,?,?)", districts)

    # 3. Seed Schools (with real GPS coordinates & partner screening site metadata across 20 States)
    schools = [
        # MEGHALAYA
        ("sch-meg-01", "Mawsynram Govt Upper Primary School", "dist-meghalaya-01", 1, 1, 25.3120, 91.5820, "Mawsynram", "Meghalaya", 1, 400),
        ("sch-meg-02", "Shillong St. Anthony High School", "dist-meghalaya-01", 0, 0, 25.5788, 91.8933, "Shillong", "Meghalaya", 1, 450),
        ("sch-meg-03", "Pynthorumkhrah Rural Govt Academy", "dist-meghalaya-01", 1, 1, 25.5910, 91.9050, "Shillong", "Meghalaya", 1, 380),
        # GUJARAT
        ("sch-guj-01", "Surat Municipal Primary School No. 42", "dist-gujarat-01", 1, 0, 21.1920, 72.8420, "Surat", "Gujarat", 1, 420),
        ("sch-guj-02", "Navsari Rural Zilla Parishad School", "dist-gujarat-01", 1, 1, 20.9500, 72.9200, "Surat", "Gujarat", 1, 350),
        ("sch-guj-03", "Ahmedabad Maninagar Govt Secondary", "dist-gujarat-02", 1, 0, 23.0010, 72.6020, "Ahmedabad", "Gujarat", 1, 500),
        # MAHARASHTRA
        ("sch-mah-01", "Mumbai BKC Zilla Parishad Secondary", "dist-mah-01", 1, 0, 19.0620, 72.8650, "Mumbai", "Maharashtra", 1, 480),
        ("sch-mah-02", "Dharavi Municipal Secondary School", "dist-mah-01", 1, 0, 19.0400, 72.8500, "Mumbai", "Maharashtra", 1, 520),
        ("sch-mah-03", "Pune Shivajinagar Model School", "dist-mah-02", 1, 0, 18.5300, 73.8500, "Pune", "Maharashtra", 1, 410),
        ("sch-mah-04", "Nagpur Kamptee Rural High School", "dist-mah-03", 1, 1, 21.2200, 79.1800, "Nagpur", "Maharashtra", 1, 360),
        # DELHI / NCR
        ("sch-del-01", "Delhi Govt Senior Secondary (Ansari Nagar)", "dist-delhi-01", 1, 0, 28.5650, 77.2080, "New Delhi", "Delhi", 1, 460),
        ("sch-del-02", "Gurugram Sector 14 Model School", "dist-haryana-01", 1, 0, 28.4620, 77.0300, "Gurugram", "Haryana", 1, 430),
        # KARNATAKA
        ("sch-kar-01", "Bengaluru Jayanagar Govt Composite High School", "dist-kar-01", 1, 0, 12.9250, 77.5820, "Bengaluru", "Karnataka", 1, 440),
        ("sch-kar-02", "Whitefield Rural ZP Primary School", "dist-kar-01", 1, 1, 12.9680, 77.7500, "Bengaluru", "Karnataka", 1, 370),
        # TAMIL NADU
        ("sch-tn-01", "Chennai Egmore Municipal Higher Secondary", "dist-tn-01", 1, 0, 13.0780, 80.2600, "Chennai", "Tamil Nadu", 1, 490),
        ("sch-tn-02", "Tambaram Rural Govt School", "dist-tn-01", 1, 1, 12.9200, 80.1200, "Chennai", "Tamil Nadu", 1, 380),
        # TELANGANA & ANDHRA PRADESH
        ("sch-ap-01", "Tirupati Govt ZP High School", "dist-ap-01", 1, 1, 13.6280, 79.4190, "Tirupati", "Andhra Pradesh", 1, 400),
        ("sch-ap-02", "Chittoor Model Public School", "dist-ap-01", 0, 0, 13.2170, 79.1000, "Chittoor", "Andhra Pradesh", 1, 350),
        ("sch-tel-01", "Hyderabad Jubilee Hills Govt School", "dist-tel-01", 1, 0, 17.4300, 78.4100, "Hyderabad", "Telangana", 1, 460),
        # WEST BENGAL
        ("sch-wb-01", "Kolkata Park Circus High School", "dist-wb-01", 1, 0, 22.5400, 88.3600, "Kolkata", "West Bengal", 1, 470),
        ("sch-wb-02", "Howrah Station Govt Primary", "dist-wb-01", 1, 0, 22.5800, 88.3400, "Kolkata", "West Bengal", 1, 390),
        # RAJASTHAN
        ("sch-raj-01", "Jaipur Sawai Man Singh Secondary School", "dist-raj-01", 1, 0, 26.8900, 75.8100, "Jaipur", "Rajasthan", 1, 430),
        # UTTAR PRADESH
        ("sch-up-01", "Lucknow Hazratganj Govt Inter College", "dist-up-01", 1, 0, 26.8500, 80.9400, "Lucknow", "Uttar Pradesh", 1, 510),
        # BIHAR
        ("sch-bih-01", "Patna Central Govt Senior Secondary", "dist-bihar-01", 1, 0, 25.6200, 85.1500, "Patna", "Bihar", 1, 480),
        ("sch-bih-02", "Danapur Rural Govt School", "dist-bihar-01", 1, 1, 25.6300, 85.0400, "Patna", "Bihar", 1, 410),
        # KERALA
        ("sch-ker-01", "Kochi Ernakulam Model Govt High School", "dist-ker-01", 1, 0, 9.9800, 76.2800, "Kochi", "Kerala", 1, 420),
        # ASSAM
        ("sch-ass-01", "Guwahati Dispur Govt Secondary", "dist-ass-01", 1, 0, 26.1400, 91.7900, "Guwahati", "Assam", 1, 390),
        # JAMMU & KASHMIR
        ("sch-jk-01", "Srinagar Lal Chowk Govt High School", "dist-jk-01", 1, 0, 34.0800, 74.8000, "Srinagar", "Jammu and Kashmir", 1, 370)
    ]
    cursor.executemany("INSERT INTO schools VALUES (?,?,?,?,?,?,?,?,?,?,?)", schools)

    # 4. Seed Screening Camps (Status, Assigned Workers, Target Headcount)
    camps = [
        ("camp-01", "sch-meg-01", "2026-07-10", users[0][0], 112, "active", "CS-MEG-01,CS-MEG-02", 150),
        ("camp-02", "sch-meg-02", "2026-08-15", users[0][0], 0, "planned", "CS-MEG-01", 120),
        ("camp-03", "sch-ap-01", "2026-07-15", users[1][0], 140, "active", "CS-AP-01,CS-AP-02", 160),
        ("camp-04", "sch-ap-02", "2026-07-18", users[1][0], 110, "active", "CS-AP-01", 120),
        ("camp-05", "sch-bih-01", "2026-07-20", users[2][0], 130, "active", "CS-BIH-01", 140),
        ("camp-06", "sch-bih-02", "2026-07-22", users[2][0], 105, "completed", "CS-BIH-02", 110)
    ]
    cursor.executemany("INSERT INTO screening_camps VALUES (?,?,?,?,?,?,?,?)", camps)

    # 4b. Seed Echo Facilities across 20 States & UTs (50+ facilities with authentic decision fields)
    facilities_data = [
        # MEGHALAYA
        ("ef-01", "Mawlai Community Health Centre", "dist-meghalaya-01", 25.6012, 91.8920, 1, 0, 1, 8, 2, "community_health_centre", "Meghalaya", "Shillong", 6, 0, 0, 1, "Free (State Health Mission)", "+91 364 250 1102", 0),
        ("ef-02", "Sohra Primary Health Centre with Echo", "dist-meghalaya-01", 25.2750, 91.7320, 1, 0, 1, 6, 1, "primary_health_centre_with_echo", "Meghalaya", "Sohra", 4, 0, 0, 1, "Free (MHIS Scheme)", "+91 364 235 2201", 0),
        ("ef-03", "East Khasi District Heart Centre", "dist-meghalaya-01", 25.5794, 91.8955, 1, 1, 1, 10, 2, "district_hospital", "Meghalaya", "Shillong", 14, 3, 1, 1, "Free (MHIS / Ayushman Bharat)", "+91 364 222 4100", 1),
        ("ef-04", "Shillong Civil Hospital Pediatric Unit", "dist-meghalaya-01", 25.5681, 91.8842, 1, 1, 5, 15, 12, "district_hospital", "Meghalaya", "Shillong", 20, 4, 2, 1, "Free (State Govt)", "+91 364 222 6234", 1),
        ("ef-05", "NEIGRIHMS Cardiology Wing", "dist-meghalaya-01", 25.5921, 91.9211, 1, 1, 2, 20, 4, "medical_college_hospital", "Meghalaya", "Shillong", 35, 10, 4, 1, "Free (Central Scheme) / ₹500", "+91 364 253 8000", 1),

        # GUJARAT
        ("ef-06", "Surat Municipal Medical College (SMIMER)", "dist-gujarat-01", 21.1950, 72.8450, 1, 1, 2, 22, 6, "medical_college_hospital", "Gujarat", "Surat", 18, 4, 2, 1, "Free (Ayushman Bharat)", "+91 261 233 2541", 1),
        ("ef-07", "Surat Heart & Multispecialty Institute", "dist-gujarat-01", 21.2050, 72.8350, 1, 1, 1, 15, 3, "district_hospital", "Gujarat", "Surat", 10, 2, 1, 1, "Free (Ayushman) / ₹800 out-of-pocket", "+91 261 245 1200", 1),
        ("ef-08", "U.N. Mehta Institute of Cardiology", "dist-gujarat-02", 23.0520, 72.5930, 1, 1, 3, 40, 14, "medical_college_hospital", "Gujarat", "Ahmedabad", 45, 12, 6, 1, "Free (Ayushman Bharat)", "+91 79 2268 4200", 1),

        # MAHARASHTRA
        ("ef-09", "Asian Heart Institute Mumbai", "dist-mah-01", 19.0652, 72.8682, 1, 1, 2, 30, 8, "medical_college_hospital", "Maharashtra", "Mumbai", 25, 6, 3, 1, "Free (Mahatma Phule Jan Arogya)", "+91 22 6698 6666", 1),
        ("ef-10", "Ruby Hall Clinic Cardiac Center", "dist-mah-02", 18.5332, 73.8767, 1, 1, 1, 20, 5, "district_hospital", "Maharashtra", "Pune", 15, 4, 2, 1, "Free (State Scheme) / ₹1,000", "+91 20 6645 5100", 1),
        ("ef-11", "Spandan Heart Institute Nagpur", "dist-mah-03", 21.1458, 79.0882, 1, 0, 1, 10, 2, "community_health_centre", "Maharashtra", "Nagpur", 8, 1, 0, 0, "₹600 out-of-pocket", "+91 712 242 3344", 0),

        # DELHI / NCR
        ("ef-12", "AIIMS New Delhi Heart Center", "dist-delhi-01", 28.5672, 77.2100, 1, 1, 7, 50, 18, "tertiary_national_institute", "Delhi", "New Delhi", 80, 25, 10, 1, "Free (Ayushman Bharat) / ₹1,200", "+91 11 2658 8500", 1),
        ("ef-13", "Fortis Escorts Heart Institute Gurugram", "dist-haryana-01", 28.4595, 77.0266, 1, 1, 2, 25, 6, "medical_college_hospital", "Haryana", "Gurugram", 20, 5, 2, 1, "Free (Ayushman Bharat)", "+91 124 492 1000", 1),

        # KARNATAKA
        ("ef-14", "Narayana Health City Institute of Cardiac Sciences", "dist-kar-01", 12.8080, 77.6970, 1, 1, 2, 45, 10, "medical_college_hospital", "Karnataka", "Bengaluru", 40, 10, 5, 1, "Free (Ayushman Bharat / Arogya Karnataka)", "+91 80 7122 2222", 1),
        ("ef-15", "Jayadeva Institute of Cardiovascular Sciences", "dist-kar-02", 12.3106, 76.6502, 1, 1, 1, 18, 4, "district_hospital", "Karnataka", "Mysuru", 16, 3, 1, 1, "Free (Arogya Karnataka)", "+91 821 230 4000", 1),

        # TAMIL NADU
        ("ef-16", "Apollo Children's Heart Hospital Chennai", "dist-tn-01", 13.0604, 80.2496, 1, 1, 3, 35, 9, "medical_college_hospital", "Tamil Nadu", "Chennai", 30, 8, 4, 1, "Free (CM Comprehensive Health Insurance)", "+91 44 2829 6000", 1),
        ("ef-17", "Kovai Medical Center & Hospital", "dist-tn-02", 11.0427, 77.0396, 1, 1, 1, 20, 5, "district_hospital", "Tamil Nadu", "Coimbatore", 18, 4, 2, 1, "Free (State Scheme)", "+91 422 432 3800", 1),

        # WEST BENGAL
        ("ef-18", "Rabindranath Tagore International Institute Kolkata", "dist-wb-01", 22.4842, 88.3980, 1, 1, 2, 40, 12, "medical_college_hospital", "West Bengal", "Kolkata", 35, 9, 4, 1, "Free (Swasthya Sathi / PM-JAY)", "+91 33 7120 6000", 1),
        ("ef-19", "North Bengal Medical College Heart Wing", "dist-wb-02", 26.7160, 88.3750, 1, 0, 2, 12, 3, "district_hospital", "West Bengal", "Siliguri", 10, 2, 1, 1, "Free (Swasthya Sathi)", "+91 353 258 5211", 0),

        # UTTAR PRADESH
        ("ef-20", "SGPGI Lucknow Pediatric Cardiology", "dist-up-01", 26.7450, 80.9480, 1, 1, 3, 30, 11, "medical_college_hospital", "Uttar Pradesh", "Lucknow", 30, 8, 3, 1, "Free (Ayushman Bharat)", "+91 522 249 4000", 1),
        ("ef-21", "LPS Institute of Cardiology Kanpur", "dist-up-02", 26.4780, 80.3020, 1, 1, 2, 20, 6, "district_hospital", "Uttar Pradesh", "Kanpur", 18, 4, 2, 1, "Free (Ayushman Bharat)", "+91 512 253 5483", 1),
        ("ef-22", "BHU Sir Sunderlal Hospital Varanasi", "dist-up-03", 25.2750, 82.9990, 1, 1, 2, 22, 7, "district_hospital", "Uttar Pradesh", "Varanasi", 20, 5, 2, 1, "Free (Ayushman Bharat)", "+91 542 236 7568", 1),

        # RAJASTHAN
        ("ef-23", "SMS Medical College Heart Center Jaipur", "dist-raj-01", 26.8920, 75.8150, 1, 1, 2, 35, 10, "medical_college_hospital", "Rajasthan", "Jaipur", 32, 8, 3, 1, "Free (Chiranjeevi / PM-JAY)", "+91 141 256 0291", 1),
        ("ef-24", "AIIMS Jodhpur Pediatric Unit", "dist-raj-02", 26.2480, 73.0080, 1, 1, 3, 25, 8, "tertiary_national_institute", "Rajasthan", "Jodhpur", 24, 6, 2, 1, "Free (Ayushman Bharat)", "+91 291 274 0741", 1),

        # PUNJAB
        ("ef-25", "PGIMER Chandigarh Heart Center", "dist-pb-01", 30.7640, 76.7770, 1, 1, 4, 50, 15, "tertiary_national_institute", "Punjab", "Chandigarh", 50, 15, 6, 1, "Free (Ayushman Bharat)", "+91 172 275 6565", 1),
        ("ef-26", "Hero DMC Heart Institute Ludhiana", "dist-pb-02", 30.9010, 75.8320, 1, 1, 1, 20, 4, "district_hospital", "Punjab", "Ludhiana", 15, 3, 1, 1, "Free (Sarbat Sehat Bima)", "+91 161 230 4282", 1),

        # KERALA
        ("ef-27", "Amrita Institute Pediatric Cardiac Kochi", "dist-ker-01", 10.0320, 76.2990, 1, 1, 2, 30, 7, "medical_college_hospital", "Kerala", "Kochi", 28, 7, 3, 1, "Free (KASPER / PM-JAY)", "+91 484 285 1234", 1),
        ("ef-28", "Sree Chitra Tirunal Institute Thiruvananthapuram", "dist-ker-02", 8.5240, 76.9240, 1, 1, 4, 40, 12, "tertiary_national_institute", "Kerala", "Thiruvananthapuram", 35, 9, 4, 1, "Free (Ayushman Bharat)", "+91 471 252 4444", 1),

        # TELANGANA
        ("ef-29", "Nizam's Institute of Medical Sciences Hyderabad", "dist-tel-01", 17.4220, 78.4550, 1, 1, 2, 40, 11, "medical_college_hospital", "Telangana", "Hyderabad", 35, 9, 4, 1, "Free (Arogyasri / PM-JAY)", "+91 40 2348 9000", 1),

        # MADHYA PRADESH
        ("ef-30", "AIIMS Bhopal Heart Center", "dist-mp-01", 23.2080, 77.4610, 1, 1, 3, 30, 9, "tertiary_national_institute", "Madhya Pradesh", "Bhopal", 30, 8, 3, 1, "Free (Ayushman Bharat)", "+91 755 267 2355", 1),
        ("ef-31", "Choithram Hospital Indore", "dist-mp-02", 22.6950, 75.8450, 1, 1, 1, 18, 4, "district_hospital", "Madhya Pradesh", "Indore", 14, 3, 1, 1, "Free (Ayushman Bharat)", "+91 731 247 0771", 1),

        # ODISHA
        ("ef-32", "AIIMS Bhubaneswar Cardiology Department", "dist-od-01", 20.2280, 85.7760, 1, 1, 3, 35, 10, "tertiary_national_institute", "Odisha", "Bhubaneswar", 32, 8, 3, 1, "Free (BSKY / Ayushman Bharat)", "+91 674 247 6789", 1),

        # ASSAM
        ("ef-33", "GMCH Guwahati Pediatric Cardiology", "dist-assam-01", 26.1558, 91.7612, 1, 1, 3, 25, 8, "medical_college_hospital", "Assam", "Guwahati", 30, 8, 3, 1, "Free (Ayushman Bharat)", "+91 361 252 9457", 1),

        # ANDHRA PRADESH
        ("ef-34", "Chittoor District Headquarters Hospital", "dist-ap-01", 13.2172, 79.1003, 1, 1, 4, 15, 10, "district_hospital", "Andhra Pradesh", "Chittoor", 16, 3, 1, 1, "Free (Dr. YSR Aarogyasri)", "+91 8572 232 400", 1),
        ("ef-35", "SVIMS Tirupati Cardiology Department", "dist-ap-01", 13.6288, 79.4192, 1, 1, 1, 30, 8, "medical_college_hospital", "Andhra Pradesh", "Tirupati", 28, 6, 3, 1, "Free (Aarogyasri / PM-JAY)", "+91 877 228 7777", 1),
        ("ef-36", "King George Hospital Visakhapatnam", "dist-ap-02", 17.7080, 83.3030, 1, 1, 2, 22, 6, "medical_college_hospital", "Andhra Pradesh", "Visakhapatnam", 20, 5, 2, 1, "Free (YSR Aarogyasri)", "+91 891 256 4891", 1),

        # BIHAR
        ("ef-37", "Danapur Sub-Divisional Hospital", "dist-bihar-01", 25.6300, 85.0400, 1, 0, 2, 10, 4, "community_health_centre", "Bihar", "Danapur", 8, 1, 0, 1, "Free (State Govt)", "+91 612 226 2100", 0),
        ("ef-38", "Patna Medical College Hospital (PMCH)", "dist-bihar-01", 25.6200, 85.1500, 1, 1, 6, 20, 18, "medical_college_hospital", "Bihar", "Patna", 40, 10, 4, 1, "Free (Ayushman Bharat)", "+91 612 230 0010", 1),
        ("ef-39", "AIIMS Patna Pediatric Cardiology", "dist-bihar-01", 25.5560, 85.0520, 1, 1, 3, 25, 9, "tertiary_national_institute", "Bihar", "Patna", 50, 15, 5, 1, "Free (PM-JAY)", "+91 612 245 1000", 1),

        # JAMMU & KASHMIR
        ("ef-40", "SKIMS Srinagar Cardiology Department", "dist-jk-01", 34.1320, 74.8020, 1, 1, 3, 25, 7, "medical_college_hospital", "Jammu & Kashmir", "Srinagar", 25, 6, 2, 1, "Free (SEHAT Scheme)", "+91 194 240 1013", 1),

        # CHHATTISGARH
        ("ef-41", "AIIMS Raipur Heart Wing", "dist-cg-01", 21.2570, 81.5780, 1, 1, 3, 28, 8, "tertiary_national_institute", "Chhattisgarh", "Raipur", 28, 7, 3, 1, "Free (Ayushman Bharat)", "+91 771 259 3030", 1),

        # JHARKHAND
        ("ef-42", "RIMS Ranchi Pediatric Cardiology", "dist-jh-01", 23.3850, 85.3580, 1, 1, 2, 24, 6, "medical_college_hospital", "Jharkhand", "Ranchi", 22, 5, 2, 1, "Free (Ayushman Bharat)", "+91 651 254 1533", 1),

        # HARYANA
        ("ef-43", "Amrita Hospital Faridabad", "dist-hr-01", 28.4110, 77.3420, 1, 1, 2, 30, 7, "medical_college_hospital", "Haryana", "Faridabad", 25, 6, 3, 1, "Free (Ayushman Bharat)", "+91 129 285 1234", 1)
    ]

    cursor.executemany("INSERT INTO echo_facilities VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", facilities_data)





    # 4c. Seed Guardian Child Links with Bcrypt Hashed PINs (Addendum 3 Fix 1)
    from server import hash_pin
    guardian_links = [
        ("link-01", "guard-01", "child-0121", "parent", "9876543210", hash_pin("1234"), 0, None),
        ("link-02", "guard-02", "child-0122", "parent", "9999999999", hash_pin("1234"), 0, None),
        ("link-03", "guard-03", "child-0124", "guardian", "9876500001", hash_pin("5678"), 0, None)
    ]
    cursor.executemany("INSERT INTO guardian_child_links VALUES (?,?,?,?,?,?,?,?)", guardian_links)

    # 4d. Seed Camp Route Stops for ASHA Daily Route
    route_stops = [
        ("rs-01", "camp-01", "dist-meghalaya-01", 25.5920, 91.8950, 1, 0, 3),
        ("rs-02", "camp-02", "dist-meghalaya-01", 25.5710, 91.8910, 2, 0, 2),
        ("rs-03", "camp-03", "dist-meghalaya-01", 25.5850, 91.9120, 3, 0, 5)
    ]
    cursor.executemany("INSERT INTO camp_route_stops VALUES (?,?,?,?,?,?,?,?)", route_stops)

    # 4e. Seed ASHA Impact Snapshots
    impact_snapshots = [
        ("imp-01", users[0][0], "2026-07", 248, 26, 23)
    ]
    cursor.executemany("INSERT INTO asha_impact_snapshots VALUES (?,?,?,?,?,?)", impact_snapshots)


    # 5. Initialize ML Pipeline for scoring seeded children
    hsmm = HSMMHeartSoundSegmenter()
    bernoulli = BernoulliPhysicsExtractor()
    fusion = XGBoostFusionModel()
    calib = CalibrationModule()
    agent = AIExplanationAgent()

    # Generate synthetic WAV audio sample for demonstration
    sample_rate = 4000
    t = np.linspace(0, 5, 5 * sample_rate, dtype=np.float32)
    # Heartbeat waveform S1 & S2 + murmur turbulence in systole
    clean_audio = 0.5 * np.sin(2 * np.pi * 50 * t) * (np.sin(2 * np.pi * 1.25 * t) > 0.8)
    murmur_audio = clean_audio + 0.3 * np.random.normal(0, 0.1, len(t)) * (np.sin(2 * np.pi * 1.25 * t) > 0.3)

    audio_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "static_audio"))
    os.makedirs(audio_dir, exist_ok=True)
    wav_path = os.path.join(audio_dir, "circor_demo_sample.wav")
    wavfile.write(wav_path, sample_rate, (murmur_audio * 32767).astype(np.int16))

    child_count = 0
    random.seed(42)
    np.random.seed(42)

    # Facilities list for referrals
    facilities = [
        "NEIGRIHMS Shillong Pediatric Cardiology",
        "SVIMS Tirupati Echocardiography Unit",
        "AIIMS Patna Department of Cardiology",
        "District General Hospital Echo Clinic"
    ]

    for camp in camps:
        camp_id, sch_id, camp_date, cond_by, num_screened = camp[:5]
        # Lookup school flags
        school_info = [s for s in schools if s[0] == sch_id][0]
        is_govt = school_info[3]
        is_rural = school_info[4]

        # Calculate literature-derived prevalence base rate for this school cohort
        if is_govt and is_rural:
            target_prev = 0.0768  # ~7.68 / 1000 multiplied for rich demo presentation
        elif is_rural:
            target_prev = 0.0523
        else:
            target_prev = 0.0386

        for i in range(num_screened):
            child_count += 1
            child_id = f"child-{child_count:04d}"
            anon_code = f"CS-{sch_id.split('-')[1].upper()}-{child_count:04d}"
            age = random.randint(5, 17)
            sex = "F" if random.random() < 0.52 else "M"

            first_names = ["Priya", "Rahul", "Anita", "Bikash", "Sunita", "Deepak", "Rupa", "Amit", "Kavita", "Sanjay", "Meera", "Rohit", "Pooja", "Vikram", "Neha", "Arjun", "Joy", "Grace", "Mary", "Patricia"]
            last_names = ["Syiem", "Sangma", "Marak", "Lyngdoh", "Wankhar", "Kharbhih", "Dkhar", "Nongrum", "Das", "Roy", "Sharma", "Singh"]

            if child_id == "child-0121":
                student_name = "Priya Syiem"
                guardian_name = "Mary Syiem"
                guardian_phone = "9876543210"
            elif child_id == "child-0122":
                student_name = "Rahul Sangma"
                guardian_name = "Patricia Sangma"
                guardian_phone = "9876543211"
            else:
                student_name = f"{random.choice(first_names)} {random.choice(last_names)}"
                guardian_name = f"{random.choice(first_names)} {random.choice(last_names)}"
                guardian_phone = f"98765{child_count:05d}"

            cursor.execute(
                "INSERT INTO children (id, camp_id, anonymized_code, full_name, guardian_name, guardian_phone, age, sex, is_rural, is_govt_school) VALUES (?,?,?,?,?,?,?,?,?,?)",
                (child_id, camp_id, anon_code, student_name, guardian_name, guardian_phone, age, sex, is_rural, is_govt)
            )

            # Provision guardian link
            pin_hash_demo = "$2b$12$7k.Tj9/H/v64tA2gC4O33u7.yO.0e.mYyL6k4G0S/N/15.g9bO.m" # hashed "1234"
            try:
                from server import hash_pin
                pin_hash_demo = hash_pin("1234")
            except Exception:
                pass

            cursor.execute(
                "INSERT INTO guardian_child_links (id, guardian_user_id, child_id, relationship, phone_number, access_pin_hash) VALUES (?,?,?,?,?,?)",
                (f"link-{child_id}", f"user-{child_id}", child_id, "parent", guardian_phone, pin_hash_demo)
            )


            if child_id == "child-0121":
                is_high_risk_target = True
                is_uncertain_target = False
            else:
                is_high_risk_target = random.random() < (target_prev * 8.0)  # Elevate rate slightly for small sample demo richness
                is_uncertain_target = (not is_high_risk_target) and (random.random() < 0.08)


            if is_high_risk_target:
                sore_throat = random.randint(3, 6)
                fam_hist = 1 if random.random() < 0.65 else 0
                overcrowding = random.randint(3, 5)
                joint_pain = 1 if random.random() < 0.70 else 0
                chorea = 1 if random.random() < 0.20 else 0
                nodules = 1 if random.random() < 0.15 else 0
                socioeconomic = random.randint(1, 2)
            elif is_uncertain_target:
                sore_throat = random.randint(0, 1)
                fam_hist = 0
                overcrowding = random.randint(2, 4)
                joint_pain = 1
                chorea = 0
                nodules = 0
                socioeconomic = random.randint(2, 4)
            else:
                sore_throat = random.randint(0, 2)
                fam_hist = 1 if random.random() < 0.05 else 0
                overcrowding = random.randint(1, 3)
                joint_pain = 0
                chorea = 0
                nodules = 0
                socioeconomic = random.randint(3, 5)

            form_id = f"form-{child_id}"
            cursor.execute(
                "INSERT INTO risk_factor_forms VALUES (?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)",
                (form_id, child_id, sore_throat, fam_hist, overcrowding, joint_pain, chorea, nodules, socioeconomic)
            )

            # 10-15 children get real audio uploads
            has_audio = (child_count <= 15) or (is_high_risk_target and random.random() < 0.5)
            physics_res = {
                "dominant_frequency_hz": None,
                "spectral_turbulence_index": None,
                "estimated_jet_velocity_ms": None,
                "estimated_pressure_gradient_mmhg": None,
                "murmur_grade_estimate": None
            }

            if has_audio:
                audio_id = f"audio-{child_id}"
                snr_val = round(random.uniform(3.5, 18.5), 2)
                quality_pass = 1 if snr_val >= 8.0 else 0
                cursor.execute(
                    "INSERT INTO audio_uploads (id, child_id, file_url, file_duration_seconds, source_type, snr_estimate, quality_passed) VALUES (?,?,'/static/circor_demo_sample.wav', 5.0, 'public_dataset_demo', ?, ?)",
                    (audio_id, child_id, snr_val, quality_pass)
                )

                
                # HSMM & Bernoulli extraction
                seg_res = hsmm.process_audio(murmur_audio, sample_rate)
                physics_res = bernoulli.extract_features(
                    murmur_audio, sample_rate, seg_res["murmur_window_start"], seg_res["murmur_window_end"]
                )

                if is_high_risk_target:
                    physics_res["estimated_jet_velocity_ms"] = round(float(np.random.normal(3.4, 0.4)), 2)
                    physics_res["estimated_pressure_gradient_mmhg"] = round(4.0 * (physics_res["estimated_jet_velocity_ms"]**2), 1)
                    physics_res["murmur_grade_estimate"] = random.randint(3, 5)
                elif is_uncertain_target:
                    physics_res["estimated_jet_velocity_ms"] = 3.1
                    physics_res["estimated_pressure_gradient_mmhg"] = 38.4
                    physics_res["murmur_grade_estimate"] = 3

                cursor.execute(
                    "INSERT INTO hsmm_segmentation_results VALUES (?,?,?,?,?,?,?,?)",
                    (f"seg-{audio_id}", audio_id, str(seg_res["s1_timestamps"]), str(seg_res["s2_timestamps"]),
                     seg_res["murmur_window_start"], seg_res["murmur_window_end"], seg_res["segmentation_confidence"], None)
                )

                cursor.execute(
                    "INSERT INTO murmur_features VALUES (?,?,?,?,?,?,?)",
                    (f"feat-{audio_id}", audio_id, physics_res["dominant_frequency_hz"], physics_res["spectral_turbulence_index"],
                     physics_res["estimated_jet_velocity_ms"], physics_res["estimated_pressure_gradient_mmhg"], physics_res["murmur_grade_estimate"])
                )

            # Feature dictionary for XGBoost scoring
            feat_dict = {
                "dominant_frequency_hz": physics_res["dominant_frequency_hz"],
                "spectral_turbulence_index": physics_res["spectral_turbulence_index"],
                "estimated_jet_velocity_ms": physics_res["estimated_jet_velocity_ms"],
                "estimated_pressure_gradient_mmhg": physics_res["estimated_pressure_gradient_mmhg"],
                "murmur_grade_estimate": physics_res["murmur_grade_estimate"],
                "prior_sore_throat_episodes_12mo": sore_throat,
                "family_history_rheumatic_fever": fam_hist,
                "overcrowding_index": overcrowding,
                "prior_joint_pain_migratory": joint_pain,
                "prior_chorea_history": chorea,
                "prior_subcutaneous_nodules": nodules,
                "socioeconomic_score": socioeconomic,
                "age": age,
                "sex": 1 if sex == "F" else 0,
                "is_rural": 1 if is_rural else 0,
                "is_govt_school": 1 if is_govt else 0
            }

            raw_score = fusion.predict_raw_score(feat_dict)
            calib_res = calib.calibrate(raw_score, feat_dict)

            # Override force for explicit demo targets
            if is_uncertain_target:
                calib_res["epistemic_uncertainty"] = 0.18
                calib_res["risk_tier"] = "priority_uncertain"
            elif is_high_risk_target:
                calib_res["calibrated_probability"] = round(random.uniform(0.68, 0.92), 2)
                calib_res["risk_tier"] = "high"

            explanation_input = {
                **feat_dict,
                **calib_res,
                "family_history_rheumatic_fever": bool(fam_hist),
                "prior_joint_pain_migratory": bool(joint_pain),
                "prior_chorea_history": bool(chorea),
                "prior_subcutaneous_nodules": bool(nodules)
            }
            explanation = agent.generate_explanation(explanation_input)

            score_id = f"score-{child_id}"
            cursor.execute(
                "INSERT INTO risk_scores (id, child_id, xgboost_raw_score, calibrated_probability, epistemic_uncertainty, risk_tier, ai_explanation, model_version, scored_at) VALUES (?,?,?,?,?,?,?, 'v1.0.3-circor-calibrated', CURRENT_TIMESTAMP)",
                (score_id, child_id, raw_score, calib_res["calibrated_probability"],
                 calib_res["epistemic_uncertainty"], calib_res["risk_tier"], explanation)
            )

            # Generate referrals & prophylaxis records for high risk & priority uncertain cases
            if calib_res["risk_tier"] in ["high", "priority_uncertain"]:
                ref_id = f"ref-{child_id}"
                facility = random.choice(facilities)
                if child_id == "child-0121":
                    echo_done = 0
                else:
                    echo_done = 1 if random.random() < 0.40 else 0
                echo_res = random.choice(["definite_rhd", "borderline_rhd"]) if echo_done else "not_yet_done"
                
                cursor.execute(
                    "INSERT INTO referrals VALUES (?,?,?,?,DATE('now'),?,?)",
                    (ref_id, child_id, score_id, facility, echo_done, echo_res)
                )


                if child_id == "child-0121" or (echo_done and echo_res in ["definite_rhd", "borderline_rhd"]):
                    # Seed multi-dose BPG prophylaxis history using exact 2026 date math (21-day interval)
                    app_today = datetime.date(2026, 8, 3)
                    
                    # Generate real varied last dose date in 2026
                    c_num = int(child_id.split('-')[-1]) if child_id.startswith("child-") and child_id.split('-')[-1].isdigit() else 1
                    days_ago = (c_num * 7) % 65 + 12
                    last_dose_dt = app_today - datetime.timedelta(days=days_ago)
                    next_due_dt = last_dose_dt + datetime.timedelta(days=21)

                    # Exact 21-day assertion check
                    assert (next_due_dt - last_dose_dt).days == 21

                    days_overdue = (app_today - next_due_dt).days
                    if days_overdue > 60:
                        adh_st = "discontinued"
                    elif days_overdue > 0:
                        adh_st = "missed"
                    else:
                        adh_st = "on_track"

                    # Seed 6 history doses
                    for d_num in range(1, 7):
                        prev_dose_dt = last_dose_dt - datetime.timedelta(days=21 * (7 - d_num))
                        prev_due_dt = prev_dose_dt + datetime.timedelta(days=21)
                        proph_id = f"proph-{child_id}-{d_num}"
                        cursor.execute(
                            "INSERT INTO prophylaxis_records (id, child_id, penicillin_dose_date, administered, next_due_date, adherence_status, dose_number, penicillin_batch_no, administering_facility, administering_nurse) VALUES (?,?,?,?,?,?,?,?,?,?)",
                            (proph_id, child_id, prev_dose_dt.isoformat(), 1, prev_due_dt.isoformat(), "on_time" if d_num <= 5 else ("late" if adh_st == "missed" else "on_time"), d_num, f"BPG-2026-0{d_num*10}", "Sohra CHC", "Nurse Mary Lyngdoh")
                        )

                    # Seed latest/upcoming dose
                    cursor.execute(
                        "INSERT INTO prophylaxis_records (id, child_id, penicillin_dose_date, administered, next_due_date, adherence_status, dose_number, penicillin_batch_no, administering_facility, administering_nurse) VALUES (?,?,?,?,?,?,?,?,?,?)",
                        (f"proph-{child_id}-upcoming", child_id, last_dose_dt.isoformat(), 1 if adh_st == "on_track" else 0, next_due_dt.isoformat(), adh_st, 7, "BPG-2026-070", "Sohra CHC", "Nurse Mary Lyngdoh")
                    )


            # Feature 1 & Addendum 6 Fix 3: Seed 2-3 historical screenings for ~120 children
            if child_count <= 120:
                for visit_idx in range(1, random.randint(2, 4)):
                    visit_date = (datetime.date.today() - datetime.timedelta(days=visit_idx * 120)).isoformat()
                    v_jet_hist = round(random.uniform(1.2, 3.8), 2) if is_high_risk_target else round(random.uniform(1.0, 1.8), 2)
                    pg_hist = round(4.0 * (v_jet_hist ** 2), 1)
                    st_hist = max(0, sore_throat - random.randint(0, 2))
                    
                    hist_feat = {**feat_dict, "estimated_jet_velocity_ms": v_jet_hist, "estimated_pressure_gradient_mmhg": pg_hist, "prior_sore_throat_episodes_12mo": st_hist}
                    hist_raw = fusion.predict_raw_score(hist_feat)
                    hist_calib = calib.calibrate(hist_raw, hist_feat)
                    
                    cursor.execute(
                        "INSERT INTO child_screening_history (id, child_id, screening_date, jet_velocity_ms, pressure_gradient_mmhg, sore_throat_episodes_since_last, calibrated_probability_at_visit) VALUES (?,?,?,?,?,?,?)",
                        (str(uuid.uuid4()), child_id, visit_date, v_jet_hist, pg_hist, st_hist, hist_calib["calibrated_probability"])
                    )


    # Feature B: Seed worker quality snapshot for demo ASHA worker
    cursor.execute("""
        INSERT INTO worker_quality_snapshots (id, asha_worker_user_id, week_start, avg_snr, pct_quality_failed, personal_flag_rate, peer_z_score, refresher_card_required, refresher_message)
        VALUES (?, 'asha-01', '2026-07-22', 6.8, 0.24, 0.31, 2.15, 1, 'Your stethoscope recordings this week had lower audio quality than average (SNR: 6.8 dB vs District Avg 11.2 dB). Here is a 2-minute refresher on positioning the diaphragm firmly against the chest wall in a quiet space.')
    """, (str(uuid.uuid4()),))

    # Addendum 36 Fix 1: Clear before seeding to prevent duplicate accumulation on re-runs
    cursor.execute("DELETE FROM cluster_detections")

    # Feature 2: Seed 3 genuinely distinct Kulldorff Space-Time Outbreak Clusters
    # Each has a different district, school, case count, time window, and LLR
    clusters_to_seed = [
        # 1. Meghalaya — highest severity, most recent (Pynthorumkhrah Rural zone)
        (str(uuid.uuid4()), 'dist-meghalaya-01', '2026-07-15', '2026-07-29', 28, 6.8, 12.45, 0.001, 1),
        # 2. Andhra Pradesh — moderate cluster (Chittoor / Tirupati rural zone)
        (str(uuid.uuid4()), 'dist-ap-01', '2026-07-08', '2026-07-22', 18, 4.2, 9.81, 0.004, 1),
        # 3. Bihar — earlier window, lower LLR but still significant (Danapur rural zone)
        (str(uuid.uuid4()), 'dist-bihar-01', '2026-06-24', '2026-07-08', 12, 3.1, 7.23, 0.009, 1),
    ]
    cursor.executemany(
        "INSERT INTO cluster_detections (id, district_id, detection_window_start, detection_window_end, observed_cases, expected_cases, log_likelihood_ratio, p_value, is_significant) VALUES (?,?,?,?,?,?,?,?,?)",
        clusters_to_seed
    )

    # Seed camp_roster for all children
    cursor.execute("DELETE FROM camp_roster")
    cursor.execute("SELECT id, camp_id FROM children")
    all_ch = cursor.fetchall()
    roster_rows = []
    statuses = ["received", "received", "received", "received", "received", "received", "received", "received", "pending", "declined"]
    for idx, (cid, camp_id) in enumerate(all_ch):
        c_status = statuses[idx % len(statuses)]
        is_checked_in = 1 if (c_status == "received" and idx % 10 < 8) else 0
        check_time = f"2026-07-10 09:{10 + (idx % 45):02d} AM" if is_checked_in else None
        roster_rows.append((str(uuid.uuid4()), cid, camp_id, c_status, is_checked_in, check_time))
    
    cursor.executemany("INSERT OR IGNORE INTO camp_roster (id, child_id, camp_id, consent_status, checked_in, check_in_time) VALUES (?,?,?,?,?,?)", roster_rows)

    conn.commit()
    conn.close()

    # Seed demo cohort FIRST, then run optimizer so all children (incl. demo 20) get per-child dates
    from seed_demo_20 import seed_demo_20
    seed_demo_20()

    # Feature 3 & Addendum 6 Fix 6: Run interval optimizer AFTER all children are seeded
    # This ensures the 20 demo children also receive personalized recommended_next_screening_date values
    from server import recompute_screening_intervals, refresh_district_snapshots_job
    recompute_screening_intervals()
    updated = refresh_district_snapshots_job()

    print(f"[SEED] Successfully seeded {child_count} children across {len(camps)} camps and {len(districts)} districts!")
    print(f"[SEED] Refreshed district surveillance snapshots for {updated} districts.")

if __name__ == "__main__":
    run_seed()

