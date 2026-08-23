import unittest
import sys
import os

# Ensure ml-service root is in Python path for testing
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from explanation_agent import AIExplanationAgent

from safety_constants import BANNED_SUBSTRINGS, MANDATORY_DISCLAIMER

class TestAIExplanationAgentSafety(unittest.TestCase):
    """
    Safety unit tests for AI Explanation Agent (Fix 1 from Addendum).
    Ensures zero diagnostic claims are generated and exact disclaimer is appended.
    """
    def setUp(self):
        self.agent = AIExplanationAgent()
        self.banned_substrings = BANNED_SUBSTRINGS
        self.exact_disclaimer = MANDATORY_DISCLAIMER


    def test_high_risk_tier_explanation(self):
        input_data = {
            "risk_tier": "high",
            "calibrated_probability": 0.78,
            "epistemic_uncertainty": 0.04,
            "estimated_jet_velocity_ms": 3.4,
            "estimated_pressure_gradient_mmhg": 46.2,
            "murmur_grade_estimate": 4,
            "prior_sore_throat_episodes_12mo": 4,
            "family_history_rheumatic_fever": True,
            "overcrowding_index": 4,
            "prior_joint_pain_migratory": True
        }
        explanation = self.agent.generate_explanation(input_data)
        
        # 1. Assert exact mandatory disclaimer ending
        self.assertTrue(
            explanation.endswith(self.exact_disclaimer),
            f"Explanation does not end with exact mandatory disclaimer. Got: '{explanation[-100:]}'"
        )
        
        # 2. Assert NO banned diagnostic substrings (case-insensitive)
        explanation_lower = explanation.lower()
        for banned in self.banned_substrings:
            self.assertNotIn(
                banned, explanation_lower,
                f"Banned diagnostic claim '{banned}' found in high risk explanation: '{explanation}'"
            )

    def test_priority_uncertain_tier_explanation(self):
        input_data = {
            "risk_tier": "priority_uncertain",
            "calibrated_probability": 0.42,
            "epistemic_uncertainty": 0.19,  # > 0.15 threshold
            "estimated_jet_velocity_ms": 3.1,
            "estimated_pressure_gradient_mmhg": 38.4,
            "murmur_grade_estimate": 3,
            "prior_sore_throat_episodes_12mo": 0,
            "family_history_rheumatic_fever": False,
            "overcrowding_index": 2
        }
        explanation = self.agent.generate_explanation(input_data)

        # 1. Assert exact mandatory disclaimer ending
        self.assertTrue(explanation.endswith(self.exact_disclaimer))

        # 2. Assert NO banned diagnostic substrings
        explanation_lower = explanation.lower()
        for banned in self.banned_substrings:
            self.assertNotIn(banned, explanation_lower)

        # 3. Assert uncertainty framing phrase present
        self.assertIn("epistemic model uncertainty", explanation)

    def test_low_risk_tier_explanation(self):
        input_data = {
            "risk_tier": "low",
            "calibrated_probability": 0.12,
            "epistemic_uncertainty": 0.02,
            "estimated_jet_velocity_ms": 1.4,
            "estimated_pressure_gradient_mmhg": 7.8,
            "murmur_grade_estimate": 1,
            "prior_sore_throat_episodes_12mo": 1,
            "family_history_rheumatic_fever": False,
            "overcrowding_index": 2
        }
        explanation = self.agent.generate_explanation(input_data)

        # 1. Assert exact mandatory disclaimer ending
        self.assertTrue(explanation.endswith(self.exact_disclaimer))

        # 2. Assert NO banned diagnostic substrings
        explanation_lower = explanation.lower()
        for banned in self.banned_substrings:
            self.assertNotIn(banned, explanation_lower)

if __name__ == "__main__":
    unittest.main()
