import React, { useState, useEffect } from 'react';
import DashboardShell from '../components/DashboardShell';
import { 
  Users, ArrowRightLeft, CheckCircle2, Clock, Activity, AlertTriangle, 
  ShieldCheck, UserCheck, Stethoscope, ChevronDown, ChevronUp, Sparkles, RefreshCw, Layers
} from 'lucide-react';

export default function MultiWorkerCoordinationPage() {
  const [isRebalanced, setIsRebalanced] = useState(false);
  const [rebalanceToast, setRebalanceToast] = useState(null);
  const [expandedStationA, setExpandedStationA] = useState(true);
  const [expandedStationB, setExpandedStationB] = useState(true);

  // Initial Station A Queued Students (18 kids)
  const initialStationAQueue = [
    { id: 'ch-0005', code: 'CS-MEG-0005', name: 'Grace Lyngdoh', age: 11, sex: 'F', guardian: 'Meera Syiem', wait_min: 4 },
    { id: 'ch-0006', code: 'CS-MEG-0006', name: 'Vikram Roy', age: 9, sex: 'M', guardian: 'Pooja Kharbhih', wait_min: 8 },
    { id: 'ch-0007', code: 'CS-MEG-0007', name: 'Kavita Sharma', age: 15, sex: 'M', guardian: 'Meera Sangma', wait_min: 12 },
    { id: 'ch-0009', code: 'CS-MEG-0009', name: 'Sunita Marak', age: 17, sex: 'M', guardian: 'Arjun Das', wait_min: 16 },
    { id: 'ch-0012', code: 'CS-MEG-0012', name: 'Vikram Marak', age: 13, sex: 'F', guardian: 'Kavita Nongrum', wait_min: 20 },
    { id: 'ch-0014', code: 'CS-MEG-0014', name: 'Meera Syiem', age: 16, sex: 'M', guardian: 'Rahul Roy', wait_min: 24 },
    { id: 'ch-0015', code: 'CS-MEG-0015', name: 'Meera Lyngdoh', age: 8, sex: 'M', guardian: 'Kavita Dkhar', wait_min: 28 },
    { id: 'ch-0018', code: 'CS-MEG-0018', name: 'Neha Das', age: 9, sex: 'F', guardian: 'Vikram Das', wait_min: 32 },
    { id: 'ch-0019', code: 'CS-MEG-0019', name: 'Grace Dkhar', age: 6, sex: 'F', guardian: 'Patricia Singh', wait_min: 36, rebalanceCandidate: true },
    { id: 'ch-0020', code: 'CS-MEG-0020', name: 'Amit Lyngdoh', age: 10, sex: 'F', guardian: 'Priya Sharma', wait_min: 40, rebalanceCandidate: true },
    { id: 'ch-0021', code: 'CS-MEG-0021', name: 'Kavita Syiem', age: 7, sex: 'M', guardian: 'Bikash Roy', wait_min: 44, rebalanceCandidate: true },
    { id: 'ch-0022', code: 'CS-MEG-0022', name: 'Vikram Kharbhih', age: 13, sex: 'F', guardian: 'Pooja Singh', wait_min: 48, rebalanceCandidate: true },
    { id: 'ch-0023', code: 'CS-MEG-0023', name: 'Deepak Sharma', age: 17, sex: 'M', guardian: 'Anita Wankhar', wait_min: 52, rebalanceCandidate: true },
    { id: 'ch-0025', code: 'CS-MEG-0025', name: 'Neha Roy', age: 14, sex: 'F', guardian: 'Joy Dkhar', wait_min: 56 },
    { id: 'ch-0026', code: 'CS-MEG-0026', name: 'Joy Wankhar', age: 10, sex: 'M', guardian: 'Mary Lyngdoh', wait_min: 60 },
    { id: 'ch-0027', code: 'CS-MEG-0027', name: 'Mary Dkhar', age: 16, sex: 'F', guardian: 'Arjun Syiem', wait_min: 64 },
    { id: 'ch-0028', code: 'CS-MEG-0028', name: 'Pooja Marak', age: 12, sex: 'F', guardian: 'Anita Das', wait_min: 66 },
    { id: 'ch-0029', code: 'CS-MEG-0029', name: 'Rahul Nongrum', age: 8, sex: 'M', guardian: 'Sanjay Syiem', wait_min: 68 }
  ];

  // Initial Station B Queued Students (8 kids)
  const initialStationBQueue = [
    { id: 'ch-0001', code: 'CS-MEG-0001', name: 'Kavita Lyngdoh', age: 15, sex: 'F', guardian: 'Amit Marak', wait_min: 4 },
    { id: 'ch-0003', code: 'CS-MEG-0003', name: 'Pooja Sangma', age: 6, sex: 'M', guardian: 'Grace Wankhar', wait_min: 8 },
    { id: 'ch-0004', code: 'CS-MEG-0004', name: 'Pooja Wankhar', age: 8, sex: 'M', guardian: 'Neha Sharma', wait_min: 12 },
    { id: 'ch-0008', code: 'CS-MEG-0008', name: 'Arjun Syiem', age: 5, sex: 'M', guardian: 'Bikash Kharbhih', wait_min: 16 },
    { id: 'ch-0010', code: 'CS-MEG-0010', name: 'Amit Syiem', age: 13, sex: 'F', guardian: 'Anita Singh', wait_min: 20 },
    { id: 'ch-0011', code: 'CS-MEG-0011', name: 'Vikram Lyngdoh', age: 17, sex: 'F', guardian: 'Bikash Sangma', wait_min: 24 },
    { id: 'ch-0013', code: 'CS-MEG-0013', name: 'Neha Wankhar', age: 9, sex: 'M', guardian: 'Vikram Singh', wait_min: 28 },
    { id: 'ch-0016', code: 'CS-MEG-0016', name: 'Grace Singh', age: 9, sex: 'F', guardian: 'Sanjay Roy', wait_min: 32 }
  ];

  const [queueA, setQueueA] = useState(initialStationAQueue);
  const [queueB, setQueueB] = useState(initialStationBQueue);

  const handleExecuteRebalance = () => {
    if (isRebalanced) return;

    // Shift 5 children from A to B
    const shiftedChildren = queueA.filter(item => item.rebalanceCandidate).map(item => ({
      ...item,
      shifted: true
    }));

    const remainingA = queueA.filter(item => !item.rebalanceCandidate);
    const updatedB = [...queueB, ...shiftedChildren];

    setQueueA(remainingA);
    setQueueB(updatedB);
    setIsRebalanced(true);

    const toastMsg = `Workload rebalanced successfully! 5 children shifted from Station A to Station B. Both queues now synchronized at 13 remaining.`;
    setRebalanceToast(toastMsg);
  };

  const handleResetRebalance = () => {
    setQueueA(initialStationAQueue);
    setQueueB(initialStationBQueue);
    setIsRebalanced(false);
    setRebalanceToast(null);
  };

  const stationAEstTime = Math.round(queueA.length * 3.8);
  const stationBEstTime = Math.round(queueB.length * 4.1);

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header Title Banner */}
        <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-[#4EB8E0] uppercase tracking-wider block">Camp Logistics Management</span>
            <h1 className="text-2xl font-extrabold text-white font-serif">Multi-Worker Coordination & Queue Rebalancing</h1>
            <p className="text-xs text-[#8DA0B0]">
              Live mid-day station oversight for multi-ASHA screening camps (Pynthorumkhrah Primary Camp)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 rounded-xl bg-[#DDA43C]/20 border border-[#DDA43C]/40 text-[#DDA43C] text-xs font-bold flex items-center gap-1.5 shadow-md">
              <Users className="w-4 h-4 text-[#DDA43C]" />
              <span>2 Screening Stations Active</span>
            </span>
          </div>
        </div>

        {/* Action Feedback Toast */}
        {rebalanceToast && (
          <div className="p-4 rounded-xl bg-[#3FA88A]/20 border border-[#3FA88A]/50 text-[#3FA88A] text-xs flex items-center justify-between gap-3 animate-fadeIn shadow-xl">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#3FA88A] shrink-0" />
              <span className="font-bold text-white leading-relaxed">{rebalanceToast}</span>
            </div>
            <button 
              onClick={() => setRebalanceToast(null)}
              className="text-xs text-[#3FA88A] hover:text-white font-bold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Dynamic Mid-Day Queue Rebalance Alert Banner */}
        <div className={`p-5 rounded-2xl border-2 transition-all duration-500 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isRebalanced
            ? 'bg-[#3FA88A]/10 border-[#3FA88A]/50'
            : 'bg-[#DDA43C]/10 border-[#DDA43C]'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${
              isRebalanced
                ? 'bg-[#3FA88A]/20 border-[#3FA88A]/40 text-[#3FA88A]'
                : 'bg-[#DDA43C]/20 border-[#DDA43C]/40 text-[#DDA43C]'
            }`}>
              {isRebalanced ? <CheckCircle2 className="w-6 h-6 text-[#3FA88A]" /> : <AlertTriangle className="w-6 h-6 text-[#DDA43C]" />}
            </div>
            <div>
              <h3 className="font-bold text-white text-base font-serif">
                {isRebalanced ? 'Queues Synchronized & Workload Balanced' : 'Mid-Day Queue Imbalance Detected'}
              </h3>
              <p className="text-xs text-[#E6EBF0] mt-0.5 leading-relaxed">
                {isRebalanced
                  ? `Workload rebalanced: 5 children shifted from Station A to Station B. Station A (${queueA.length} remaining, ~${stationAEstTime}m) and Station B (${queueB.length} remaining, ~${stationBEstTime}m) are fully synchronized.`
                  : `Station A has ${queueA.length} children remaining (~${stationAEstTime} mins), while Station B has ${queueB.length} children (~${stationBEstTime} mins). Shift 5 children to balance finish times.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {!isRebalanced ? (
              <button
                onClick={handleExecuteRebalance}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#DDA43C] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
              >
                <ArrowRightLeft className="w-4 h-4 text-slate-950" />
                <span>Execute Workload Rebalance</span>
              </button>
            ) : (
              <button
                onClick={handleResetRebalance}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#132030] border border-white/20 text-xs font-semibold text-[#8DA0B0] hover:text-white transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#4EB8E0]" />
                <span>Reset Simulation</span>
              </button>
            )}
          </div>
        </div>

        {/* Parallel Station Oversight Cards */}
        <div className="grid md:grid-cols-2 gap-6 items-start">
          
          {/* STATION A CARD */}
          <div className="glass-card p-6 space-y-5 rounded-2xl border-white/10 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2C7FB8]/20 border border-[#4EB8E0]/40 flex items-center justify-center text-[#4EB8E0] font-bold font-mono">
                  A
                </div>
                <div>
                  <span className="text-[10px] text-[#4EB8E0] font-bold uppercase tracking-wider block">STATION A — MAIN HALL</span>
                  <h3 className="font-bold text-white text-base font-serif">ASHA Worker Kavita Devi</h3>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#3FA88A]/20 text-[#3FA88A] border border-[#3FA88A]/40 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                ACTIVE
              </span>
            </div>

            {/* Station Key Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                <span className="text-[10px] text-[#8DA0B0] font-semibold block">Screened Today</span>
                <span className="font-mono font-bold text-white text-xl">62</span>
              </div>
              <div className={`p-3 rounded-xl border space-y-1 transition-all ${
                isRebalanced ? 'bg-[#3FA88A]/10 border-[#3FA88A]/40' : 'bg-[#DDA43C]/10 border-[#DDA43C]/40'
              }`}>
                <span className="text-[10px] font-semibold block text-slate-300">Queue Remaining</span>
                <span className={`font-mono font-bold text-xl ${isRebalanced ? 'text-[#3FA88A]' : 'text-[#DDA43C]'}`}>
                  {queueA.length} kids
                </span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                <span className="text-[10px] text-[#4EB8E0] font-semibold block">Avg Speed / Child</span>
                <span className="font-mono font-bold text-[#4EB8E0] text-xl">3.8 min</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-[#8DA0B0] flex justify-between items-center font-mono">
              <span>Estimated Completion Time:</span>
              <strong className="text-white text-sm">~{stationAEstTime} minutes</strong>
            </div>

            {/* Active Screening Unit Inspection Box */}
            <div className="p-4 rounded-xl bg-[#0F1722] border border-[#4EB8E0]/40 space-y-2 relative">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] text-[#4EB8E0] font-mono font-bold uppercase flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-[#4EB8E0]" />
                  CURRENTLY SCREENING AT STATION A
                </span>
                <span className="px-2 py-0.5 rounded bg-[#3FA88A]/20 text-[#3FA88A] text-[9px] font-bold font-mono animate-pulse">
                  ⚡ AUDITION IN PROGRESS
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">Mary Wankhar</h4>
                  <p className="text-[11px] text-[#8DA0B0] font-mono">Child Code: <strong className="text-[#4EB8E0]">CS-MEG-0135</strong> • Age: 13y / Female</p>
                  <p className="text-[11px] text-[#3FA88A] mt-0.5">Parental Consent Received • Checked In 09:20 AM</p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded bg-[#DDA43C]/20 border border-[#DDA43C]/50 text-[#DDA43C] text-[10px] font-extrabold uppercase block">
                    Priority Uncertain
                  </span>
                  <span className="text-[10px] text-[#8DA0B0] font-mono mt-1 block">Est Jet Vel: 3.1 m/s</span>
                </div>
              </div>
            </div>

            {/* Expandable Queued Students Inspection List */}
            <div className="space-y-2 pt-1">
              <button 
                onClick={() => setExpandedStationA(!expandedStationA)}
                className="w-full flex items-center justify-between text-xs font-bold text-[#4EB8E0] hover:text-white transition-colors py-1"
              >
                <span className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#4EB8E0]" />
                  Queued Students at Station A ({queueA.length} Remaining)
                </span>
                {expandedStationA ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {expandedStationA && (
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1 divide-y divide-white/5 font-sans">
                  {queueA.map((child, idx) => (
                    <div key={child.id} className="pt-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white block">
                          #{idx + 1}. {child.name} <span className="font-mono text-[#4EB8E0] font-semibold text-[11px]">({child.code})</span>
                        </span>
                        <span className="text-[10px] text-[#8DA0B0] block">Guardian: {child.guardian} • Age: {child.age}y/{child.sex}</span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-[11px] text-[#DDA43C] font-semibold">~{child.wait_min}m wait</span>
                        <span className="text-[9px] text-[#3FA88A] block font-bold">Consent Verified</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* STATION B CARD */}
          <div className="glass-card p-6 space-y-5 rounded-2xl border-white/10 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#3FA88A]/20 border border-[#3FA88A]/40 flex items-center justify-center text-[#3FA88A] font-bold font-mono">
                  B
                </div>
                <div>
                  <span className="text-[10px] text-[#3FA88A] font-bold uppercase tracking-wider block">STATION B — ANNEX PAVILION</span>
                  <h3 className="font-bold text-white text-base font-serif">ASHA Worker Phida Shullai</h3>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#3FA88A]/20 text-[#3FA88A] border border-[#3FA88A]/40 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                ACTIVE
              </span>
            </div>

            {/* Station Key Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                <span className="text-[10px] text-[#8DA0B0] font-semibold block">Screened Today</span>
                <span className="font-mono font-bold text-white text-xl">50</span>
              </div>
              <div className={`p-3 rounded-xl border space-y-1 transition-all ${
                isRebalanced ? 'bg-[#3FA88A]/10 border-[#3FA88A]/40' : 'bg-[#DDA43C]/10 border-[#DDA43C]/40'
              }`}>
                <span className="text-[10px] font-semibold block text-slate-300">Queue Remaining</span>
                <span className={`font-mono font-bold text-xl ${isRebalanced ? 'text-[#3FA88A]' : 'text-[#DDA43C]'}`}>
                  {queueB.length} kids
                </span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                <span className="text-[10px] text-[#4EB8E0] font-semibold block">Avg Speed / Child</span>
                <span className="font-mono font-bold text-[#4EB8E0] text-xl">4.1 min</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-[#8DA0B0] flex justify-between items-center font-mono">
              <span>Estimated Completion Time:</span>
              <strong className="text-white text-sm">~{stationBEstTime} minutes</strong>
            </div>

            {/* Active Screening Unit Inspection Box */}
            <div className="p-4 rounded-xl bg-[#0F1722] border border-[#3FA88A]/40 space-y-2 relative">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] text-[#3FA88A] font-mono font-bold uppercase flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-[#3FA88A]" />
                  CURRENTLY SCREENING AT STATION B
                </span>
                <span className="px-2 py-0.5 rounded bg-[#3FA88A]/20 text-[#3FA88A] text-[9px] font-bold font-mono animate-pulse">
                  ⚡ AUDITION IN PROGRESS
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">Arjun Das</h4>
                  <p className="text-[11px] text-[#8DA0B0] font-mono">Child Code: <strong className="text-[#4EB8E0]">CS-MEG-0123</strong> • Age: 12y / Male</p>
                  <p className="text-[11px] text-[#3FA88A] mt-0.5">Parental Consent Received • Checked In 09:25 AM</p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded bg-[#DDA43C]/20 border border-[#DDA43C]/50 text-[#DDA43C] text-[10px] font-extrabold uppercase block">
                    Priority Uncertain
                  </span>
                  <span className="text-[10px] text-[#8DA0B0] font-mono mt-1 block">Est Jet Vel: 2.8 m/s</span>
                </div>
              </div>
            </div>

            {/* Expandable Queued Students Inspection List */}
            <div className="space-y-2 pt-1">
              <button 
                onClick={() => setExpandedStationB(!expandedStationB)}
                className="w-full flex items-center justify-between text-xs font-bold text-[#4EB8E0] hover:text-white transition-colors py-1"
              >
                <span className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#4EB8E0]" />
                  Queued Students at Station B ({queueB.length} Remaining)
                </span>
                {expandedStationB ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {expandedStationB && (
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1 divide-y divide-white/5 font-sans">
                  {queueB.map((child, idx) => (
                    <div key={child.id} className="pt-2 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white">
                            #{idx + 1}. {child.name}
                          </span>
                          <span className="font-mono text-[#4EB8E0] font-semibold text-[11px]">({child.code})</span>
                          {child.shifted && (
                            <span className="px-1.5 py-0.2 rounded bg-[#00B4D8]/20 border border-[#00B4D8]/60 text-[#90E0EF] text-[9px] font-mono font-extrabold">
                              ⚡ Shifted from A
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#8DA0B0] block">Guardian: {child.guardian} • Age: {child.age}y/{child.sex}</span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-[11px] text-[#DDA43C] font-semibold">~{child.wait_min}m wait</span>
                        <span className="text-[9px] text-[#3FA88A] block font-bold">Consent Verified</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
