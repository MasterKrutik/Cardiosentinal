import numpy as np
from typing import List, Dict

class CUSUMAnomalyDetector:
    """
    Statistical CUSUM (Cumulative Sum) Control Chart Anomaly Detector (Addendum 2 §C.2 & Addendum 3 Fix 4).
    Pins parameters:
    - Reference Mean μ: trailing 30-day average flag rate (or baseline mean)
    - Slack Parameter k: 0.5 * σ
    - Alarm Threshold h: 4.0 * σ
    Formula: C_t = max(0, C_{t-1} + (X_t - μ - k))
    """

    def analyze_time_series(self, flag_rates: List[float], camp_name: str = "Camp") -> Dict:
        if not flag_rates or len(flag_rates) < 3:
            # Default fallback for short series
            return {
                "camp_name": camp_name,
                "cusum_series": [0.0] * len(flag_rates),
                "threshold_h": 4.0,
                "is_anomalous": False,
                "alarm_triggered_index": -1,
                "mean_mu": 0.15,
                "std_sigma": 0.05
            }

        rates = np.array(flag_rates)
        mu = float(np.mean(rates[:-3])) if len(rates) > 5 else float(np.mean(rates))
        sigma = float(np.std(rates[:-3])) if len(rates) > 5 and np.std(rates[:-3]) > 0 else 0.05
        
        k = 0.5 * sigma
        h = 4.0 * sigma

        cusum_series = []
        c_prev = 0.0
        is_anomalous = False
        alarm_idx = -1

        for i, val in enumerate(rates):
            c_curr = max(0.0, c_prev + (val - mu - k))
            cusum_series.append(round(float(c_curr), 4))
            if c_curr > h and not is_anomalous:
                is_anomalous = True
                alarm_idx = i
            c_prev = c_curr

        return {
            "camp_name": camp_name,
            "cusum_series": cusum_series,
            "threshold_h": round(float(h), 3),
            "slack_k": round(float(k), 4),
            "is_anomalous": is_anomalous,
            "alarm_triggered_index": alarm_idx,
            "mean_mu": round(float(mu), 4),
            "std_sigma": round(float(sigma), 4),
            "current_cusum": cusum_series[-1] if cusum_series else 0.0,
            "alert_message": f"Camp '{camp_name}' flag-rate spike crossed CUSUM alarm threshold (h={h:.3f})! Recommend manual data-quality audit or outbreak inspection." if is_anomalous else "Normal operational bounds."
        }
