import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { AlertTriangle, ShieldCheck, HeartPulse } from 'lucide-react';

export default function OnboardingModal() {
  const { hasAcknowledgedDisclaimer, acknowledgeDisclaimer } = useStore();
  const [isChecked, setIsChecked] = useState(false);

  if (hasAcknowledgedDisclaimer) return null;

  const handleConfirm = () => {
    if (isChecked) {
      acknowledgeDisclaimer();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
      <div className="w-full max-w-2xl glass-card-red p-8 space-y-6 border-red-500/40 shadow-2xl relative animate-in fade-in zoom-in-95">
        <div className="flex items-center gap-4 border-b border-red-500/20 pb-4">
          <div className="p-3 rounded-full bg-red-950/60 border border-red-500/40 text-red-400">
            <HeartPulse className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-red-100">Mandatory Clinical & Data Provenance Disclosure</h2>
            <p className="text-sm text-red-300/80">CardioSentinel AI Triage System — Onboarding Governance</p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-red-100/90 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-300">Triage Priority Tool Only:</span> CardioSentinel is a software-only referral prioritization system. It does NOT produce medical diagnoses. All flagged cases require formal echocardiographic evaluation by a qualified pediatric cardiologist.
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-red-200">Dataset Provenance Disclosure:</h4>
            <p className="text-xs text-red-200/70 bg-black/40 p-3 rounded-lg border border-red-500/10 font-mono">
              Audio model trained on the PhysioNet CirCor DigiScope dataset (Brazil, 1,568 pediatric subjects, 5,272 recordings). Risk-factor prevalence calibrated against published Indian school-screening studies (Meghalaya Indian Heart Journal 2025, Andhra Pradesh, Patna). This is a research/demo build; full deployment would require validation on an India-specific cohort.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-red-200">Privacy & Data Governance:</h4>
            <p className="text-xs text-red-200/70">
              In compliance with the Digital Personal Data Protection (DPDP) Act 2023, no real child names are stored. Records use strict anonymized identifiers (e.g. <code>CS-MAW-0042</code>).
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-red-500/20 space-y-4">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-red-500/40 bg-black/60 text-red-600 focus:ring-red-500"
            />
            <span className="text-xs text-red-200 group-hover:text-white transition-colors">
              I acknowledge that CardioSentinel is a triage prioritization system, that audio models are trained on PhysioNet CirCor DigiScope data with Indian literature prevalence calibration, and that all referrals require clinical echocardiogram confirmation.
            </span>
          </label>

          <button
            disabled={!isChecked}
            onClick={handleConfirm}
            className={`w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
              isChecked
                ? 'glass-button text-white shadow-lg cursor-pointer hover:scale-[1.01]'
                : 'bg-red-950/40 border border-red-900/40 text-red-500/40 cursor-not-allowed'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            I Understand & Accept Terms
          </button>
        </div>
      </div>
    </div>
  );
}
