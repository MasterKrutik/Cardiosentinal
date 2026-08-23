import pytest
from federated import FederatedLearningSimulator

def test_federated_simulator_structure():
    sim = FederatedLearningSimulator(num_nodes=6)
    res = sim.run_federated_rounds(num_rounds=10, epsilon=1.0)

    assert res["num_nodes"] == 6
    assert len(res["nodes"]) == 6
    assert res["epsilon"] == 1.0
    assert len(res["rounds"]) == 10

    # Verify round structure and values
    for r in res["rounds"]:
        assert "round" in r
        assert "accuracy_without_dp" in r
        assert "accuracy_with_dp" in r
        assert r["accuracy_without_dp"] >= r["accuracy_with_dp"]
        assert 0.60 <= r["accuracy_with_dp"] <= 1.0

def test_federated_simulator_epsilon_scaling():
    sim = FederatedLearningSimulator()
    res_high_privacy = sim.run_federated_rounds(num_rounds=10, epsilon=0.1)
    res_low_privacy = sim.run_federated_rounds(num_rounds=10, epsilon=5.0)

    avg_dp_high = sum(r["accuracy_with_dp"] for r in res_high_privacy["rounds"]) / 10.0
    avg_dp_low = sum(r["accuracy_with_dp"] for r in res_low_privacy["rounds"]) / 10.0

    # Lower epsilon (higher privacy noise) should yield lower or equal average DP accuracy
    assert avg_dp_high <= avg_dp_low + 0.05
