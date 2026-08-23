import React from 'react';
import { MapPin, Navigation, Home, RefreshCw, AlertCircle, Sparkles, Building2, HeartPulse } from 'lucide-react';
import { useLiveLocation } from '../context/LiveLocationContext';

export default function LiveLocationBanner() {
  const { mode, locationInfo, localNarrative, narrativeLoading, toggleMode, requestLiveLocation } = useLiveLocation();

  const isLive = mode === 'live';
  const school = localNarrative?.school;
  const estimate = localNarrative?.projected_estimate;
  const facility = localNarrative?.nearest_facility;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0A0E13] via-[#132030] to-[#0A0E13] border border-[#2C7FB8]/30 p-4 shadow-xl backdrop-blur-md transition-all">
      {/* Background glow accent */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#2C7FB8]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Location & Mode Details */}
        <div className="flex items-center gap-3.5">
          <div className={`p-2.5 rounded-xl border ${isLive ? 'bg-[#1A4A66]/60 border-[#4EB8E0]/50 text-[#4EB8E0]' : 'bg-slate-800/80 border-slate-600 text-[#8DA0B0]'}`}>
            {isLive ? <Navigation className="w-5 h-5 animate-pulse text-[#4EB8E0]" /> : <Home className="w-5 h-5 text-[#DDA43C]" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8DA0B0]">
                {isLive ? '📍 Live Geolocation Active' : '📍 Home Surveillance District'}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                isLive
                  ? 'bg-[#1A4A66] text-[#4EB8E0] border-[#4EB8E0]/40'
                  : 'bg-[#DDA43C]/20 text-[#DDA43C] border-[#DDA43C]/40'
              }`}>
                {isLive ? 'Localized Narrative' : 'Curated Demo Dataset'}
              </span>
            </div>
            <h2 className="text-sm md:text-base font-bold text-white flex items-center gap-2 mt-0.5">
              {isLive ? (
                <>
                  <span>{locationInfo.city}, {locationInfo.state}</span>
                  <span className="text-xs text-[#4EB8E0] font-normal">({locationInfo.district})</span>
                </>
              ) : (
                <span>East Khasi Hills, Meghalaya <span className="text-xs text-[#8DA0B0] font-normal">(Shillong Region)</span></span>
              )}
            </h2>
          </div>
        </div>

        {/* Center/Right: Quick Localized Narrative Teaser */}
        {school && estimate && (
          <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs">
            <Building2 className="w-4 h-4 text-[#DDA43C] shrink-0" />
            <div>
              <span className="text-[10px] text-[#8DA0B0] block">Nearest Partner School</span>
              <span className="font-semibold text-white">{school.name}</span>
            </div>
            <div className="h-6 w-[1px] bg-white/10 mx-1" />
            <HeartPulse className="w-4 h-4 text-[#E85D4A] shrink-0" />
            <div>
              <span className="text-[10px] text-[#8DA0B0] block">Projected Signal (~{estimate.student_count} kids)</span>
              <span className="font-bold text-[#E85D4A]">~{estimate.projected_flagged_count} Flagged</span>
            </div>
          </div>
        )}

        {/* Right: Actions & Toggle */}
        <div className="flex items-center gap-2 relative z-30 pointer-events-auto">
          {isLive ? (
            <button
              type="button"
              onClick={() => toggleMode('home')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-[#E6EBF0] border border-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer hover:border-slate-500"
              title="Switch to curated East Khasi Hills Meghalaya dataset"
            >
              <Home className="w-3.5 h-3.5 text-[#DDA43C]" />
              <span>Switch to Home District</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => toggleMode('live')}
              className="px-3.5 py-1.5 rounded-xl bg-[#2C7FB8] hover:bg-[#2C7FB8]/80 text-white border border-[#4EB8E0]/60 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-black/80 cursor-pointer hover:border-[#4EB8E0]"
              title="Detect your real current city via browser GPS"
            >
              <MapPin className="w-3.5 h-3.5 text-white" />
              <span>Use My Live Location (GPS)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => requestLiveLocation(true)}
            className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-[#8DA0B0] hover:text-white transition-all cursor-pointer"
            title="Refresh Geolocation & Narrative"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${narrativeLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Localized Narrative Banner Notice */}
      {isLive && school && estimate && (
        <div className="mt-3 pt-2.5 border-t border-white/10 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2 text-[#E6EBF0]/90">
            <Sparkles className="w-4 h-4 text-[#DDA43C] mt-0.5 shrink-0 animate-pulse" />
            <p className="leading-relaxed text-[11px]">
              <span className="font-bold text-[#DDA43C]">Live Localized Narrative for {locationInfo.city}: </span>
              {estimate.narrative_text}
              {facility && (
                <span className="text-[#8DA0B0] ml-1">
                  Referrals routed to <strong className="text-[#3FA88A]">{facility.name}</strong> ({facility.distance_km} km, 🛏 {facility.general_ward_beds_available} Ward / {facility.icu_beds_available} ICU beds available).
                </span>
              )}
            </p>
          </div>
          <span className="shrink-0 text-[9px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[#8DA0B0] font-mono">
            {school.locality_badge}
          </span>
        </div>
      )}
    </div>
  );
}
