import numpy as np
from scipy.fft import rfft, rfftfreq

class AuscultationSNRQualityGate:
    """
    Feature A: Real-Time Auscultation Recording Quality Gate
    Computes Signal-to-Noise Ratio (SNR) on raw stethoscope audio waveforms:
      - Signal Band: 20 Hz to 150 Hz (expected S1/S2 heart sound spectral power)
      - Noise Band: Broadband ambient frequencies outside 20-150 Hz
    Threshold: SNR < 8.0 dB fails quality gate, prompting ASHA worker to re-record in a quieter environment.
    """
    def __init__(self, target_snr_threshold: float = 8.0):
        self.target_snr_threshold = target_snr_threshold

    def evaluate_quality(self, audio_data: np.ndarray, sample_rate: int = 4000) -> dict:
        if len(audio_data) == 0:
            return {
                "snr_db": 0.0,
                "quality_passed": False,
                "guidance_message": "Empty audio file received. Please re-record stethoscope auscultation."
            }

        # Normalize audio data
        audio_data = audio_data.astype(np.float32)
        if np.max(np.abs(audio_data)) > 0:
            audio_data = audio_data / np.max(np.abs(audio_data))

        # FFT Power Spectrum
        n = len(audio_data)
        yf = np.abs(rfft(audio_data)) ** 2
        xf = rfftfreq(n, 1.0 / sample_rate)

        # Heart sound band energy (20 Hz - 150 Hz)
        heart_band_mask = (xf >= 20.0) & (xf <= 150.0)
        heart_power = np.sum(yf[heart_band_mask]) if np.any(heart_band_mask) else 1e-6

        # Noise band energy (> 200 Hz ambient noise & friction)
        noise_band_mask = (xf > 200.0)
        noise_power = np.sum(yf[noise_band_mask]) if np.any(noise_band_mask) else 1e-6

        # Calculate SNR in dB
        if noise_power <= 0:
            snr_db = 25.0
        else:
            snr_db = float(10.0 * np.log10(max(1e-6, heart_power / noise_power)))

        snr_db = round(snr_db, 2)
        quality_passed = bool(snr_db >= self.target_snr_threshold)

        if quality_passed:
            guidance = f"Recording Quality Excellent (SNR: {snr_db} dB ≥ {self.target_snr_threshold} dB threshold). Ready for AI analysis."
        else:
            guidance = f"Recording quality too low (SNR: {snr_db} dB < {self.target_snr_threshold} dB threshold). Background noise or microphone friction detected. Please move to a quieter space and re-record."

        return {
            "snr_db": snr_db,
            "quality_passed": quality_passed,
            "guidance_message": guidance
        }
