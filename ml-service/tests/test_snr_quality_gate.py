import pytest
import numpy as np
from snr_quality_gate import AuscultationSNRQualityGate

def test_snr_quality_gate_clean_vs_noisy():
    gate = AuscultationSNRQualityGate(target_snr_threshold=8.0)
    sr = 4000

    # 1. Clean S1/S2 heart sound frequency (50 Hz sine wave)
    t = np.linspace(0, 3.0, sr * 3)
    clean_signal = np.sin(2 * np.pi * 50 * t)
    res_clean = gate.evaluate_quality(clean_signal, sr)

    # 2. Noisy broadband friction audio (heavy Gaussian noise)
    noisy_signal = np.random.normal(0, 1.0, sr * 3)
    res_noisy = gate.evaluate_quality(noisy_signal, sr)

    assert res_clean["quality_passed"] is True, f"Expected clean audio to pass quality gate, got {res_clean}"
    assert res_clean["snr_db"] >= 8.0, f"Expected clean SNR >= 8.0 dB, got {res_clean['snr_db']}"

    assert res_noisy["quality_passed"] is False, f"Expected noisy audio to fail quality gate, got {res_noisy}"
    assert res_noisy["snr_db"] < 8.0, f"Expected noisy SNR < 8.0 dB, got {res_noisy['snr_db']}"
    assert "Recording quality too low" in res_noisy["guidance_message"]
