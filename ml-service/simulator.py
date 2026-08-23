import numpy as np

class PolicySimulator:
    """
    Monte Carlo Synthetic Cohort Simulator (Advanced Feature #1):
    Generates N=10,000 synthetic pediatric cohort sampled from published Indian prevalence rates:
      - Rural rate: 5.23 / 1000
      - Govt-school rate: 7.68 / 1000
      - Urban rate: 3.86 / 1000
      - Private-school rate: 3.86 / 1000
    Evaluates policy scenarios (school-type filter, age filter, camp frequency, cost per camp).
    """
    def __init__(self, n_cohort=10000):
        self.n_cohort = n_cohort

    def run_simulation(self, school_type: str = "all", age_min: int = 5, age_max: int = 18, camps_count: int = 20, cost_per_camp: float = 15000.0):
        np.random.seed(42)

        # Generate synthetic cohort demographics
        is_govt = np.random.rand(self.n_cohort) < 0.65
        is_rural = np.random.rand(self.n_cohort) < 0.60
        ages = np.random.randint(5, 18, size=self.n_cohort)

        # Base rate per child based on literature
        base_rates = np.where(
            is_govt & is_rural, 0.00768,
            np.where(is_rural, 0.00523, 0.00386)
        )

        # Filter by scenario inputs
        mask = (ages >= age_min) & (ages <= age_max)
        if school_type == "govt_only":
            mask = mask & is_govt
        elif school_type == "rural_only":
            mask = mask & is_rural

        eligible_count = int(np.sum(mask))
        if eligible_count == 0:
            return {
                "total_eligible_children": 0,
                "expected_detections": 0,
                "camps_needed": camps_count,
                "total_cost_inr": camps_count * cost_per_camp,
                "cost_per_detection_inr": 0.0,
                "prevalence_rate_per_1000": 0.0
            }

        selected_rates = base_rates[mask]
        simulated_cases = np.random.binomial(1, selected_rates)
        expected_detections = int(np.sum(simulated_cases))

        # Adjust detections by camp count coverage
        coverage_factor = min(1.0, (camps_count * 250) / eligible_count)
        detected_cases = int(expected_detections * coverage_factor)

        total_cost = camps_count * cost_per_camp
        cost_per_detection = round(total_cost / max(1, detected_cases), 2)
        prevalence_per_1000 = round((expected_detections / eligible_count) * 1000, 2)

        return {
            "total_eligible_children": eligible_count,
            "expected_detections": detected_cases,
            "camps_needed": camps_count,
            "total_cost_inr": total_cost,
            "cost_per_detection_inr": cost_per_detection,
            "prevalence_rate_per_1000": prevalence_per_1000
        }
