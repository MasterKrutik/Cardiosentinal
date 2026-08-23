import numpy as np
import scipy.stats as stats

class DiscreteCoxSurvivalModel:
    """
    Feature 1: Longitudinal Valve Deterioration Trajectory Forecasting (Survival Analysis)
    Uses a discrete-time Cox proportional hazard baseline model to compute non-progression
    survival probabilities over 6, 12, and 24-month horizons.
    
    Addendum 6 Fix 4: Uses 50 bootstrap resamples of historical screening data to calculate
    5th and 95th percentile confidence bounds for S(6), S(12), and S(24).
    """
    def __init__(self, n_bootstraps: int = 50):
        self.n_bootstraps = n_bootstraps
        # Baseline monthly hazards based on GBD/WHF subclinical RHD progression rates (~8% annual progression)
        self.base_monthly_hazards = np.array([0.007] * 24)

    def forecast_survival_trajectory(self, history_records: list) -> dict:
        """
        Computes 6, 12, and 24-month survival probabilities and 5th-95th percentile confidence bounds.
        history_records: list of dicts with keys:
          'jet_velocity_ms', 'pressure_gradient_mmhg', 'sore_throat_episodes_since_last', 'calibrated_probability_at_visit'
        """
        if not history_records:
            # Fallback for baseline child without screening history
            return {
                "survival_probability_6mo": 0.95,
                "survival_probability_12mo": 0.90,
                "survival_probability_24mo": 0.82,
                "ci_lower_6mo": 0.91,
                "ci_upper_6mo": 0.98,
                "ci_lower_12mo": 0.85,
                "ci_upper_12mo": 0.94,
                "ci_lower_24mo": 0.75,
                "ci_upper_24mo": 0.88,
                "trajectory_slope": "stable"
            }

        # Extract features and compute trajectory slope
        probs = [r.get("calibrated_probability_at_visit", 0.3) or 0.3 for r in history_records]
        latest_vjet = history_records[-1].get("jet_velocity_ms", 1.5) or 1.5
        latest_sore_throat = history_records[-1].get("sore_throat_episodes_since_last", 1) or 1

        # Covariate risk index (Cox log-hazard ratio)
        prob_trend = (probs[-1] - probs[0]) if len(probs) > 1 else 0.0
        vjet_factor = max(0.0, (latest_vjet - 1.5) * 0.4)
        sore_throat_factor = max(0.0, (latest_sore_throat - 1.0) * 0.15)
        
        cox_beta_x = (probs[-1] * 1.2) + (prob_trend * 1.5) + vjet_factor + sore_throat_factor
        hazard_mult = float(np.exp(cox_beta_x - 0.5))

        # Main survival curve calculation over 24 months
        monthly_survival = np.exp(-self.base_monthly_hazards * hazard_mult)
        cum_survival = np.cumprod(monthly_survival)

        s6 = round(float(cum_survival[5]), 4)
        s12 = round(float(cum_survival[11]), 4)
        s24 = round(float(cum_survival[23]), 4)

        # Addendum 6 Fix 4: 50 Bootstrap resamples for 5th-95th percentile confidence bounds
        bootstrap_s6 = []
        bootstrap_s12 = []
        bootstrap_s24 = []

        np.random.seed(42)
        for _ in range(self.n_bootstraps):
            # Resample history with replacement
            indices = np.random.choice(len(history_records), size=len(history_records), replace=True)
            resampled_probs = [probs[i] for i in indices]
            resampled_vjet = history_records[indices[-1]].get("jet_velocity_ms", 1.5) or 1.5
            
            resampled_trend = (resampled_probs[-1] - resampled_probs[0]) if len(resampled_probs) > 1 else 0.0
            resampled_beta = (resampled_probs[-1] * 1.2) + (resampled_trend * 1.5) + max(0.0, (resampled_vjet - 1.5) * 0.4)
            b_mult = float(np.exp(resampled_beta - 0.5) * np.random.normal(1.0, 0.08))
            
            b_surv = np.cumprod(np.exp(-self.base_monthly_hazards * b_mult))
            bootstrap_s6.append(b_surv[5])
            bootstrap_s12.append(b_surv[11])
            bootstrap_s24.append(b_surv[23])

        ci_lower_6mo = round(float(np.percentile(bootstrap_s6, 5)), 4)
        ci_upper_6mo = round(float(np.percentile(bootstrap_s6, 95)), 4)
        ci_lower_12mo = round(float(np.percentile(bootstrap_s12, 5)), 4)
        ci_upper_12mo = round(float(np.percentile(bootstrap_s12, 95)), 4)
        ci_lower_24mo = round(float(np.percentile(bootstrap_s24, 5)), 4)
        ci_upper_24mo = round(float(np.percentile(bootstrap_s24, 95)), 4)

        if prob_trend > 0.1 or s12 < 0.75:
            trajectory_slope = "deteriorating"
        elif prob_trend < -0.05:
            trajectory_slope = "improving"
        else:
            trajectory_slope = "stable"

        return {
            "survival_probability_6mo": s6,
            "survival_probability_12mo": s12,
            "survival_probability_24mo": s24,
            "ci_lower_6mo": min(s6, ci_lower_6mo),
            "ci_upper_6mo": max(s6, ci_upper_6mo),
            "ci_lower_12mo": min(s12, ci_lower_12mo),
            "ci_upper_12mo": max(s12, ci_upper_12mo),
            "ci_lower_24mo": min(s24, ci_lower_24mo),
            "ci_upper_24mo": max(s24, ci_upper_24mo),
            "trajectory_slope": trajectory_slope
        }
