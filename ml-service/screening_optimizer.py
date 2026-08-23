from datetime import datetime, timedelta

class POMDPScreeningOptimizer:
    """
    Feature 3: Adaptive Screening Interval Optimizer (Sequential Decision-Making Under Uncertainty)
    Frames re-screening interval assignment as a value-of-information sequential decision problem:
    Combines epistemic uncertainty + survival trajectory slope to assign optimal next screening interval.
    """
    def optimize_interval(self, calibrated_prob: float, epistemic_uncertainty: float, survival_slope: str) -> dict:
        """
        Computes recommended_next_screening_date and screening_interval_rationale.
        Interval Buckets:
          - 30 days: High uncertainty (>0.15) OR high risk (>=0.6) with deteriorating trajectory
          - 60 days: Moderate risk (0.3 - 0.6) with deteriorating trajectory OR high uncertainty
          - 180 days (6 months): Moderate risk with stable trajectory
          - 365 days (12 months): Low risk (<0.3) with stable/improving trajectory
        """
        today = datetime.now()

        if epistemic_uncertainty > 0.15 and survival_slope == "deteriorating":
            days = 30
            rationale = "High epistemic uncertainty + steep deteriorating risk trajectory (requires urgent 30-day re-check)"
        elif calibrated_prob >= 0.6 and survival_slope == "deteriorating":
            days = 30
            rationale = "High calibrated RHD risk tier + deteriorating trajectory (recommended 30-day follow-up)"
        elif calibrated_prob >= 0.6 or survival_slope == "deteriorating":
            days = 60
            rationale = "Elevated risk profile with active progression trend (recommended 60-day re-evaluation)"
        elif 0.3 <= calibrated_prob < 0.6 or epistemic_uncertainty > 0.10:
            days = 180
            rationale = "Moderate risk tier with stable trajectory (recommended 6-month routine follow-up)"
        else:
            days = 365
            rationale = "Low risk tier with stable baseline trajectory (recommended 12-month standard screening)"

        next_date = (today + timedelta(days=days)).strftime("%Y-%m-%d")

        return {
            "recommended_interval_days": days,
            "recommended_next_screening_date": next_date,
            "screening_interval_rationale": rationale
        }
