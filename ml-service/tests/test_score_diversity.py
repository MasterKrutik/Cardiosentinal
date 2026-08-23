import pytest
import numpy as np
from fusion_model import XGBoostFusionModel
from calibration import CalibrationModule

def test_live_scoring_pipeline_diversity():
    """
    Addendum 6 Fix 1: Assert that across a range of 30 synthetic feature vectors
    spanning low-to-high risk inputs, the live fusion + calibration pipeline returns
    more than 20 unique calibrated_probability values (no score collapse).
    """
    model = XGBoostFusionModel()
    calibrator = CalibrationModule()

    probabilities = set()

    for i in range(30):
        synthetic_input = {
            "age": 5 + (i % 13),
            "sex": "F" if i % 2 == 0 else "M",
            "is_rural": 1 if i % 3 != 0 else 0,
            "is_govt_school": 1 if i % 2 == 0 else 0,
            "prior_sore_throat_episodes_12mo": i % 6,
            "family_history_rheumatic_fever": (i % 4 == 0),
            "overcrowding_index": 1 + (i % 5),
            "prior_joint_pain_migratory": (i % 5 == 0),
            "prior_chorea_history": (i % 10 == 0),
            "prior_subcutaneous_nodules": (i % 12 == 0),
            "socioeconomic_score": 1 + (i % 5),
            "estimated_jet_velocity_ms": 1.0 + (i * 0.1),
            "estimated_pressure_gradient_mmhg": 4.0 * ((1.0 + (i * 0.1)) ** 2),
            "murmur_grade_estimate": 1 + (i % 6)
        }

        raw_score = model.predict_raw_score(synthetic_input)
        calibrated_res = calibrator.calibrate(raw_score, synthetic_input)
        prob = calibrated_res["calibrated_probability"]
        probabilities.add(prob)

    assert len(probabilities) > 20, f"Expected >20 unique probabilities, got {len(probabilities)}: {probabilities}"
