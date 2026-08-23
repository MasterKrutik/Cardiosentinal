from safety_constants import MANDATORY_DISCLAIMER

class AIExplanationAgent:
    """
    Lightweight orchestration agent for natural-language clinical explanation summaries.
    Safety Constraint: NEVER provides a diagnosis. Narrates structured model outputs only.
    Always appends the mandatory closing disclaimer sentence.
    """
    MANDATORY_DISCLAIMER = MANDATORY_DISCLAIMER


    def __init__(self):
        pass

    def generate_explanation(self, data: dict) -> str:
        risk_tier = data.get("risk_tier", "moderate")
        prob = data.get("calibrated_probability", 0.0)
        uncertainty = data.get("epistemic_uncertainty", 0.0)
        
        # Audio / physics features
        v_jet = data.get("estimated_jet_velocity_ms", None)
        delta_p = data.get("estimated_pressure_gradient_mmhg", None)
        grade = data.get("murmur_grade_estimate", None)
        
        # Jones criteria
        sore_throat = data.get("prior_sore_throat_episodes_12mo", 0)
        fam_hist = data.get("family_history_rheumatic_fever", False)
        overcrowding = data.get("overcrowding_index", 1)
        joint_pain = data.get("prior_joint_pain_migratory", False)
        chorea = data.get("prior_chorea_history", False)
        nodules = data.get("prior_subcutaneous_nodules", False)

        reasons = []

        if v_jet is not None and v_jet >= 2.5:
            reasons.append(f"an elevated estimated regurgitant jet velocity of {v_jet} m/s (pressure gradient ~{delta_p} mmHg, Grade {grade}/6 Levine scale proxy)")

        if sore_throat >= 3:
            reasons.append(f"a history of recurrent sore throat episodes ({sore_throat} in the past 12 months)")

        if fam_hist:
            reasons.append("a documented family history of rheumatic fever")

        if joint_pain:
            reasons.append("reported migratory joint pain (minor Jones criterion)")

        if chorea:
            reasons.append("a history of Sydenham chorea (major Jones criterion)")

        if nodules:
            reasons.append("subcutaneous nodules observed during clinical screening (major Jones criterion)")

        if overcrowding >= 4:
            reasons.append(f"high household overcrowding index ({overcrowding}/5)")

        if risk_tier == "priority_uncertain":
            summary = f"This case has been flagged for priority review due to high epistemic model uncertainty ({uncertainty:.2f}) despite a baseline probability of {prob:.0%}. "
            if reasons:
                summary += "Contributing clinical signals include: " + "; ".join(reasons) + ". "
            summary += "Because the model detects an ambiguous signal pattern, immediate clinical evaluation is prioritized to prevent missing subclinical disease. "
        elif risk_tier == "high":
            summary = f"This child's case is prioritized for high referral urgency with a calibrated risk score of {prob:.0%}. "
            if reasons:
                summary += "Key findings driving this triage signal are: " + "; ".join(reasons) + ". "
            else:
                summary += "Multiple cumulative risk factors indicate elevated likelihood of subclinical cardiac involvement. "
        elif risk_tier == "moderate":
            summary = f"This case is categorized as moderate triage priority ({prob:.0%} calibrated score). "
            if reasons:
                summary += "Noted screening factors include: " + "; ".join(reasons) + ". "
            else:
                summary += "Mild clinical indicators warrant follow-up surveillance. "
        else:
            summary = f"This case is categorized as low triage priority ({prob:.0%} calibrated score). "
            if reasons:
                summary += "Minor findings noted: " + "; ".join(reasons) + ". "
            summary += "No immediate high-risk signals detected during routine screening. "

        return summary.strip() + " " + self.MANDATORY_DISCLAIMER
