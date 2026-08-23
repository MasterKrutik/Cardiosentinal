import React, { useState, useEffect, useRef } from 'react';
import DashboardShell from '../components/DashboardShell';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, LineChart, Line, ReferenceLine, Area, AreaChart, PieChart, Pie, Cell
} from 'recharts';
import {
  MapPin, RefreshCw, Zap, CheckCircle2, TrendingUp, BarChart2,
  BookOpen, AlertTriangle, Activity, Info, Calendar, Users, X, ChevronRight, Download, Filter, Stethoscope, HeartPulse, Building2, Search
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_TILE_CONFIG } from '../config/mapTiles';

// Student name pool for full roster generation
const STUDENT_NAMES_POOL = [
  "Chodavadiya Jesmin Dipakbhai", "jesmin chodavadiya dipakbhai", "krutik chodavadiya", "Neha Das", "Kavita Sharma",
  "Deepak Sharma", "Amit Lyngdoh", "Vikram Roy", "Meera Lyngdoh", "Grace Dkhar", "Mary Wankhar", "Grace Lyngdoh",
  "Sunita Marak", "Vikram Kharbhih", "Meera Syiem", "Vikram Marak", "Grace Dkhar", "Kavita Syiem", "Priya Syiem",
  "Rupa Lyngdoh", "Amit Sharma", "Deepak Roy", "Anita Wankhar", "Bikash Sangma", "Rahul Roy", "Sanjay Syiem",
  "Patricia Singh", "Pooja Wankhar", "Arjun Syiem", "Bikash Kharbhih", "Meera Sangma", "Pooja Kharbhih"
];

// Helper to generate 100% complete roster of ALL high risk and moderate risk student cases for any camp
function getCampAllFlaggedStudents(camp) {
  if (!camp || camp.status !== 'DONE') return [];
  
  const result = [];
  const highCount = camp.high_risk_cases || 0;
  const modCount = camp.moderate_risk_cases || 0;

  // Generate High Risk Cases
  for (let i = 0; i < highCount; i++) {
    const name = STUDENT_NAMES_POOL[i % STUDENT_NAMES_POOL.length];
    const codeSuffix = (1000 + i * 17 + (camp.id.charCodeAt(camp.id.length - 1) * 31)) % 9000 + 1000;
    const prefix = camp.id.includes('meg-01') || camp.id.includes('meg-02') ? 'CS-MAW' : 'CS-MEG';
    const prob = Math.round(98 - (i * 1.1));
    const vel = (4.5 - (i * 0.07)).toFixed(2);
    const press = Math.round(4 * parseFloat(vel) * parseFloat(vel));

    result.push({
      id: `h-${i}`,
      code: `${prefix}-${codeSuffix}`,
      name: i === 0 && camp.id === 'camp-meg-01' ? 'Chodavadiya Jesmin Dipakbhai' : (i > 30 ? `${name} ${i}` : name),
      age: 10 + (i % 8),
      sex: i % 2 === 0 ? 'M' : 'F',
      risk_tier: 'HIGH',
      prob_pct: Math.max(81, prob),
      velocity: `${vel} m/s`,
      pressure: `${press} mmHg`,
      grade: Math.max(3, 4 - (i % 2))
    });
  }

  // Generate Moderate Risk Cases
  for (let j = 0; j < modCount; j++) {
    const idx = (highCount + j) % STUDENT_NAMES_POOL.length;
    const name = STUDENT_NAMES_POOL[idx];
    const codeSuffix = (2000 + j * 23 + (camp.id.charCodeAt(camp.id.length - 1) * 19)) % 9000 + 1000;
    const prefix = 'CS-MEG';
    const prob = Math.round(79 - (j * 1.0));
    const vel = (3.45 - (j * 0.04)).toFixed(2);
    const press = Math.round(4 * parseFloat(vel) * parseFloat(vel));

    result.push({
      id: `m-${j}`,
      code: `${prefix}-${codeSuffix}`,
      name: j > 30 ? `${name} ${j}` : name,
      age: 8 + (j % 9),
      sex: j % 2 === 0 ? 'F' : 'M',
      risk_tier: 'MODERATE',
      prob_pct: Math.max(51, prob),
      velocity: `${vel} m/s`,
      pressure: `${press} mmHg`,
      grade: 2
    });
  }

  return result;
}

// Meghalaya School Screening Camps Dataset (Done vs Pending)
const MEGHALAYA_CAMPS = [
  {
    id: 'camp-meg-01',
    school_name: 'Pynthorumkhrah Govt Upper Primary School',
    district: 'East Khasi Hills',
    state: 'Meghalaya',
    lat: 25.5900,
    lng: 91.9100,
    status: 'DONE',
    completed_date: '2026-07-10',
    target_students: 150,
    students_checked: 112,
    high_risk_cases: 8,
    moderate_risk_cases: 14,
    low_risk_cases: 90,
    snr_pass_rate: 93.8,
    referral_facility: 'NEIGRIHMS Cardiology Wing & Shillong Civil Hospital'
  },
  {
    id: 'camp-meg-02',
    school_name: 'Govt High School Mawlai',
    district: 'East Khasi Hills',
    state: 'Meghalaya',
    lat: 25.5950,
    lng: 91.8750,
    status: 'DONE',
    completed_date: '2026-07-18',
    target_students: 250,
    students_checked: 240,
    high_risk_cases: 16,
    moderate_risk_cases: 28,
    low_risk_cases: 196,
    snr_pass_rate: 95.2,
    referral_facility: 'NEIGRIHMS Cardiology Wing'
  },
  {
    id: 'camp-meg-03',
    school_name: 'Sohra Govt Secondary School',
    district: 'East Khasi Hills (Sohra)',
    state: 'Meghalaya',
    lat: 25.2750,
    lng: 91.7320,
    status: 'DONE',
    completed_date: '2026-07-25',
    target_students: 200,
    students_checked: 185,
    high_risk_cases: 12,
    moderate_risk_cases: 22,
    low_risk_cases: 151,
    snr_pass_rate: 92.4,
    referral_facility: 'Shillong Civil Hospital'
  },
  {
    id: 'camp-meg-04',
    school_name: 'Nongpoh Presbyterian Upper Primary',
    district: 'Ri-Bhoi',
    state: 'Meghalaya',
    lat: 25.9000,
    lng: 91.8800,
    status: 'DONE',
    completed_date: '2026-08-02',
    target_students: 180,
    students_checked: 160,
    high_risk_cases: 9,
    moderate_risk_cases: 18,
    low_risk_cases: 133,
    snr_pass_rate: 94.0,
    referral_facility: 'Ri-Bhoi Civil Hospital'
  },
  {
    id: 'camp-meg-05',
    school_name: 'Jowai Govt Boys Higher Secondary',
    district: 'West Jaintia Hills',
    state: 'Meghalaya',
    lat: 25.4500,
    lng: 92.2000,
    status: 'DONE',
    completed_date: '2026-08-08',
    target_students: 220,
    students_checked: 210,
    high_risk_cases: 14,
    moderate_risk_cases: 26,
    low_risk_cases: 170,
    snr_pass_rate: 91.8,
    referral_facility: 'Jowai Civil Hospital'
  },
  {
    id: 'camp-meg-06',
    school_name: 'Nongstoin St. Peter Secondary',
    district: 'West Khasi Hills',
    state: 'Meghalaya',
    lat: 25.5200,
    lng: 91.2700,
    status: 'DONE',
    completed_date: '2026-08-14',
    target_students: 160,
    students_checked: 145,
    high_risk_cases: 10,
    moderate_risk_cases: 19,
    low_risk_cases: 116,
    snr_pass_rate: 93.1,
    referral_facility: 'Nongstoin Civil Hospital'
  },
  // PENDING CAMPS
  {
    id: 'camp-meg-07',
    school_name: 'Mawsynram Rural Secondary School',
    district: 'East Khasi Hills',
    state: 'Meghalaya',
    lat: 25.3100,
    lng: 91.5800,
    status: 'PENDING',
    scheduled_date: '2026-08-28',
    target_students: 140,
    students_checked: 0,
    high_risk_cases: 0,
    moderate_risk_cases: 0,
    low_risk_cases: 0,
    snr_pass_rate: 0,
    referral_facility: 'NEIGRIHMS Mobile Echo Van 01'
  },
  {
    id: 'camp-meg-08',
    school_name: 'Jirang Tribal School',
    district: 'Ri-Bhoi',
    state: 'Meghalaya',
    lat: 25.9500,
    lng: 91.6500,
    status: 'PENDING',
    scheduled_date: '2026-09-02',
    target_students: 120,
    students_checked: 0,
    high_risk_cases: 0,
    moderate_risk_cases: 0,
    low_risk_cases: 0,
    snr_pass_rate: 0,
    referral_facility: 'Ri-Bhoi Mobile Unit'
  },
  {
    id: 'camp-meg-09',
    school_name: 'Mairang Presbyterian School',
    district: 'West Khasi Hills',
    state: 'Meghalaya',
    lat: 25.5600,
    lng: 91.6300,
    status: 'PENDING',
    scheduled_date: '2026-09-08',
    target_students: 160,
    students_checked: 0,
    high_risk_cases: 0,
    moderate_risk_cases: 0,
    low_risk_cases: 0,
    snr_pass_rate: 0,
    referral_facility: 'Nongstoin Civil Hospital'
  },
  {
    id: 'camp-meg-10',
    school_name: 'Williamnagar Public Secondary',
    district: 'East Garo Hills',
    state: 'Meghalaya',
    lat: 25.5900,
    lng: 90.6200,
    status: 'PENDING',
    scheduled_date: '2026-09-14',
    target_students: 190,
    students_checked: 0,
    high_risk_cases: 0,
    moderate_risk_cases: 0,
    low_risk_cases: 0,
    snr_pass_rate: 0,
    referral_facility: 'Williamnagar Civil Hospital'
  },
  {
    id: 'camp-meg-11',
    school_name: 'Cherrapunjee Baptist Upper Primary',
    district: 'East Khasi Hills',
    state: 'Meghalaya',
    lat: 25.2800,
    lng: 91.7200,
    status: 'PENDING',
    scheduled_date: '2026-09-20',
    target_students: 130,
    students_checked: 0,
    high_risk_cases: 0,
    moderate_risk_cases: 0,
    low_risk_cases: 0,
    snr_pass_rate: 0,
    referral_facility: 'Shillong Civil Hospital'
  },
  {
    id: 'camp-meg-12',
    school_name: 'Shillong St. Anthony High School',
    district: 'East Khasi Hills',
    state: 'Meghalaya',
    lat: 25.5700,
    lng: 91.8900,
    status: 'PENDING',
    scheduled_date: '2026-09-25',
    target_students: 220,
    students_checked: 0,
    high_risk_cases: 0,
    moderate_risk_cases: 0,
    low_risk_cases: 0,
    snr_pass_rate: 0,
    referral_facility: 'NEIGRIHMS Cardiology Wing'
  }
];

// Leaflet Map Component centered on Meghalaya
function MeghalayaCampsMap({ camps, onSelectCamp }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const container = mapRef.current;
    
    const map = L.map(container, {
      zoomControl: true,
      scrollWheelZoom: false,
      trackResize: true
    });
    mapInstanceRef.current = map;

    L.tileLayer(MAP_TILE_CONFIG.darkUrl || MAP_TILE_CONFIG.url, {
      attribution: MAP_TILE_CONFIG.attribution,
      maxZoom: MAP_TILE_CONFIG.maxZoom,
      subdomains: MAP_TILE_CONFIG.subdomains || 'abcd',
      noWrap: true
    }).addTo(map);

    layerGroupRef.current = L.layerGroup().addTo(map);

    if (camps && camps.length > 0) {
      const bounds = L.latLngBounds(camps.map(c => [c.lat, c.lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
    } else {
      map.setView([25.5788, 91.8933], 9);
    }

    const invalidate = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize({ animate: false });
      }
    };

    requestAnimationFrame(invalidate);
    const t1 = setTimeout(invalidate, 100);
    const t2 = setTimeout(invalidate, 300);
    const t3 = setTimeout(invalidate, 800);

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(invalidate);
    });
    resizeObserver.observe(container);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    camps.forEach(c => {
      const isDone = c.status === 'DONE';
      const color = isDone ? '#3FA88A' : '#DDA43C';
      const radius = isDone ? 13 : 10;

      const marker = L.circleMarker([c.lat, c.lng], {
        radius,
        fillColor: color,
        color: '#ffffff',
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.85,
      }).addTo(layerGroup);

      const popupHtml = `
        <div style="font-family:sans-serif;font-size:12px;min-width:220px;color:#14181D;padding:2px">
          <strong style="font-size:13px;color:#0A0E13;display:block;margin-bottom:2px">${c.school_name}</strong>
          <span style="color:#64748B;font-size:11px">${c.district}, ${c.state}</span><br/>
          <div style="margin-top:6px;padding:4px 8px;border-radius:6px;background:${isDone ? '#3FA88A20' : '#DDA43C20'};border:1px solid ${isDone ? '#3FA88A' : '#DDA43C'};display:inline-block;font-weight:bold;font-size:10px;color:${isDone ? '#3FA88A' : '#DDA43C'}">
            ${isDone ? '✅ CAMP COMPLETED' : '⏳ PENDING SCHEDULED'}
          </div>
          ${isDone ? `
            <div style="margin-top:6px;font-size:11px;color:#334155 font-mono">
              <span>Checked: <strong>${c.students_checked} / ${c.target_students}</strong></span><br/>
              <span style="color:#E85D4A">High Risk: <strong>${c.high_risk_cases}</strong></span> · 
              <span style="color:#DDA43C">Moderate: <strong>${c.moderate_risk_cases}</strong></span>
            </div>
          ` : `
            <div style="margin-top:6px;font-size:11px;color:#64748B">
              Scheduled Date: <strong>${c.scheduled_date}</strong> (Target: ${c.target_students})
            </div>
          `}
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        onSelectCamp(c);
      });
    });

    if (camps.length > 0) {
      const bounds = L.latLngBounds(camps.map(c => [c.lat, c.lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    map.invalidateSize();
  }, [camps, onSelectCamp]);

  return (
    <div
      ref={mapRef}
      style={{ height: '380px', width: '100%', minHeight: '380px', position: 'relative' }}
      className="rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
    />
  );
}

export default function DistrictHeatmap() {
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL', 'DONE', 'PENDING'
  const [selectedCamp, setSelectedCamp] = useState(null);
  
  // Modal specific filters
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [modalRiskFilter, setModalRiskFilter] = useState('ALL'); // 'ALL', 'HIGH', 'MODERATE'

  const completedCamps = MEGHALAYA_CAMPS.filter(c => c.status === 'DONE');
  const pendingCamps = MEGHALAYA_CAMPS.filter(c => c.status === 'PENDING');

  const filteredCamps = MEGHALAYA_CAMPS.filter(c => {
    if (filterStatus === 'DONE') return c.status === 'DONE';
    if (filterStatus === 'PENDING') return c.status === 'PENDING';
    return true;
  });

  const totalStudentsChecked = completedCamps.reduce((acc, c) => acc + c.students_checked, 0);
  const totalHighRisk = completedCamps.reduce((acc, c) => acc + c.high_risk_cases, 0);
  const totalModerateRisk = completedCamps.reduce((acc, c) => acc + c.moderate_risk_cases, 0);

  // Active modal all flagged students list
  const modalAllFlagged = selectedCamp ? getCampAllFlaggedStudents(selectedCamp) : [];
  const modalFilteredFlagged = modalAllFlagged.filter(child => {
    const q = modalSearchQuery.toLowerCase().trim();
    const matchesQuery = !q || (
      child.name.toLowerCase().includes(q) ||
      child.code.toLowerCase().includes(q)
    );
    const matchesRisk = modalRiskFilter === 'ALL' || child.risk_tier === modalRiskFilter;
    return matchesQuery && matchesRisk;
  });

  return (
    <DashboardShell>
      <div className="space-y-6 relative">
        {/* Header Title */}
        <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-[#4EB8E0] uppercase tracking-wider block">State Surveillance Registry</span>
            <h1 className="text-2xl font-extrabold text-white font-serif">Meghalaya School Screening Camps Registry</h1>
            <p className="text-xs text-[#8DA0B0]">
              District Health Officer surveillance oversight across Meghalaya primary school camps (East Khasi Hills, Ri-Bhoi, West Khasi Hills, West Jaintia Hills).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-xl bg-[#3FA88A]/20 border border-[#3FA88A]/40 text-[#3FA88A] text-xs font-bold flex items-center gap-1.5 shadow-md">
              <CheckCircle2 className="w-4 h-4 text-[#3FA88A]" />
              <span>{completedCamps.length} Camps Completed</span>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-[#DDA43C]/20 border border-[#DDA43C]/40 text-[#DDA43C] text-xs font-bold flex items-center gap-1.5 shadow-md">
              <Calendar className="w-4 h-4 text-[#DDA43C]" />
              <span>{pendingCamps.length} Camps Pending</span>
            </span>
          </div>
        </div>

        {/* State Executive Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
          <div className="glass-card p-4 rounded-xl space-y-1 border-white/10 bg-black/40">
            <span className="text-[10px] text-[#8DA0B0] uppercase font-bold block">Total Camps Managed</span>
            <span className="text-2xl font-bold text-white">{MEGHALAYA_CAMPS.length} Schools</span>
            <span className="text-[10px] text-[#3FA88A] font-sans block">{completedCamps.length} Done / {pendingCamps.length} Pending</span>
          </div>

          <div className="glass-card p-4 rounded-xl space-y-1 border-[#4EB8E0]/30 bg-black/40">
            <span className="text-[10px] text-[#4EB8E0] uppercase font-bold block">Total Students Screened</span>
            <span className="text-2xl font-bold text-[#4EB8E0]">{totalStudentsChecked} Children</span>
            <span className="text-[10px] text-[#8DA0B0] font-sans block">Checked across Completed Camps</span>
          </div>

          <div className="glass-card p-4 rounded-xl space-y-1 border-[#E85D4A]/30 bg-[#E85D4A]/10">
            <span className="text-[10px] text-[#E85D4A] uppercase font-bold block">High Risk Cases Flagged</span>
            <span className="text-2xl font-bold text-[#E85D4A]">{totalHighRisk} Cases</span>
            <span className="text-[10px] text-slate-300 font-sans block">Urgent Echo Referral Needed</span>
          </div>

          <div className="glass-card p-4 rounded-xl space-y-1 border-[#DDA43C]/30 bg-[#DDA43C]/10">
            <span className="text-[10px] text-[#DDA43C] uppercase font-bold block">Moderate Risk Cases</span>
            <span className="text-2xl font-bold text-[#DDA43C]">{totalModerateRisk} Cases</span>
            <span className="text-[10px] text-slate-300 font-sans block">6-Month Clinical Review</span>
          </div>
        </div>

        {/* Filter Bar & Interactive Meghalaya Map Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Interactive Leaflet Map of Meghalaya */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base font-serif flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#4EB8E0]" />
                <span>Meghalaya District School Screening Map</span>
              </h3>
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="flex items-center gap-1 text-[#3FA88A]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3FA88A]"></span>
                  Done ({completedCamps.length})
                </span>
                <span className="flex items-center gap-1 text-[#DDA43C] ml-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#DDA43C]"></span>
                  Pending ({pendingCamps.length})
                </span>
              </div>
            </div>

            <MeghalayaCampsMap camps={filteredCamps} onSelectCamp={(camp) => { setSelectedCamp(camp); setModalSearchQuery(''); setModalRiskFilter('ALL'); }} />
          </div>

          {/* Right Col: Camp Quick Filter & Summary Panel */}
          <div className="glass-card p-5 space-y-4 rounded-2xl border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-sm font-serif">School Camp Filter</h3>
              <div className="flex items-center gap-1 bg-[#0A0E13] p-1 rounded-lg border border-white/10">
                <button
                  onClick={() => setFilterStatus('ALL')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                    filterStatus === 'ALL' ? 'bg-[#4EB8E0] text-[#0A0E13]' : 'text-[#8DA0B0]'
                  }`}
                >
                  All ({MEGHALAYA_CAMPS.length})
                </button>
                <button
                  onClick={() => setFilterStatus('DONE')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                    filterStatus === 'DONE' ? 'bg-[#3FA88A] text-white' : 'text-[#8DA0B0]'
                  }`}
                >
                  Done ({completedCamps.length})
                </button>
                <button
                  onClick={() => setFilterStatus('PENDING')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                    filterStatus === 'PENDING' ? 'bg-[#DDA43C] text-[#0A0E13]' : 'text-[#8DA0B0]'
                  }`}
                >
                  Pending ({pendingCamps.length})
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filteredCamps.map(c => {
                const isDone = c.status === 'DONE';
                return (
                  <div
                    key={c.id}
                    onClick={() => { setSelectedCamp(c); setModalSearchQuery(''); setModalRiskFilter('ALL'); }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedCamp?.id === c.id 
                        ? 'bg-[#132030] border-[#4EB8E0] shadow-lg' 
                        : 'bg-black/40 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-white text-xs">{c.school_name}</h4>
                        <span className="text-[10px] text-[#8DA0B0] font-mono block">{c.district}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase font-mono border ${
                        isDone ? 'bg-[#3FA88A]/20 text-[#3FA88A] border-[#3FA88A]/50' : 'bg-[#DDA43C]/20 text-[#DDA43C] border-[#DDA43C]/50'
                      }`}>
                        {isDone ? 'DONE' : 'PENDING'}
                      </span>
                    </div>

                    {isDone ? (
                      <div className="mt-2 text-[10px] font-mono flex items-center justify-between text-[#8DA0B0]">
                        <span>Checked: <strong className="text-white">{c.students_checked}</strong></span>
                        <span className="text-[#E85D4A]">High: <strong>{c.high_risk_cases}</strong></span>
                        <span className="text-[#DDA43C]">Mod: <strong>{c.moderate_risk_cases}</strong></span>
                      </div>
                    ) : (
                      <div className="mt-2 text-[10px] font-mono text-[#DDA43C]">
                        Scheduled: {c.scheduled_date} (Target: {c.target_students})
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Detailed Meghalaya School Camps Table */}
        <div className="glass-card p-6 space-y-4 rounded-2xl border-white/10 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div>
              <h3 className="font-bold text-base text-white font-serif flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#4EB8E0]" />
                <span>Meghalaya District School Screening Matrix</span>
              </h3>
              <p className="text-xs text-[#8DA0B0] mt-0.5">
                Click any Completed ("DONE") school camp row to inspect all high risk and moderate risk student cases.
              </p>
            </div>
            <span className="text-xs font-mono text-[#8DA0B0]">
              Showing <strong className="text-white font-bold">{filteredCamps.length}</strong> school camps
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#E6EBF0]">
              <thead>
                <tr className="border-b border-white/10 text-[#8DA0B0] font-bold uppercase tracking-wider text-[11px] font-mono">
                  <th className="pb-3 px-3">School Name / District</th>
                  <th className="pb-3 px-3">Camp Status</th>
                  <th className="pb-3 px-3">Students Checked / Target</th>
                  <th className="pb-3 px-3">High Risk Cases</th>
                  <th className="pb-3 px-3">Moderate Risk Cases</th>
                  <th className="pb-3 px-3">SNR Pass Rate</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredCamps.map((camp) => {
                  const isDone = camp.status === 'DONE';

                  return (
                    <tr 
                      key={camp.id} 
                      onClick={() => { setSelectedCamp(camp); setModalSearchQuery(''); setModalRiskFilter('ALL'); }}
                      className="hover:bg-white/5 transition-all cursor-pointer"
                    >
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-white text-xs">{camp.school_name}</div>
                        <div className="text-[10px] text-[#4EB8E0] font-mono">{camp.district}, {camp.state}</div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-extrabold uppercase tracking-wider border ${
                          isDone ? 'bg-[#3FA88A]/20 text-[#3FA88A] border-[#3FA88A]/50' : 'bg-[#DDA43C]/20 text-[#DDA43C] border-[#DDA43C]/50'
                        }`}>
                          {isDone ? '✅ DONE' : '⏳ PENDING'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-mono">
                        {isDone ? (
                          <span className="font-bold text-white">
                            {camp.students_checked} / {camp.target_students} ({Math.round((camp.students_checked / camp.target_students) * 100)}%)
                          </span>
                        ) : (
                          <span className="text-[#8DA0B0]">Target: {camp.target_students}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 font-mono">
                        {isDone ? (
                          <span className="font-bold text-[#E85D4A] text-sm">
                            {camp.high_risk_cases} Children
                          </span>
                        ) : (
                          <span className="text-[#8DA0B0]">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 font-mono">
                        {isDone ? (
                          <span className="font-bold text-[#DDA43C] text-sm">
                            {camp.moderate_risk_cases} Children
                          </span>
                        ) : (
                          <span className="text-[#8DA0B0]">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 font-mono">
                        {isDone ? (
                          <span className="text-[#3FA88A] font-bold">
                            {camp.snr_pass_rate}% Pass
                          </span>
                        ) : (
                          <span className="text-[#8DA0B0]">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedCamp(camp); setModalSearchQuery(''); setModalRiskFilter('ALL'); }}
                          className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 hover:border-[#4EB8E0]/50 text-[#4EB8E0] hover:text-white font-semibold text-[11px] font-mono inline-flex items-center gap-1 transition-all"
                        >
                          <span>Inspect Camp</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Camp Detailed Breakdown Modal — High Z-Index to block Leaflet elements */}
        {selectedCamp && (
          <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
            <div className="glass-card max-w-3xl w-full p-6 space-y-5 rounded-2xl border-[#4EB8E0]/60 bg-[#0F1722] text-white shadow-2xl relative my-8 z-[10000]">
              <button
                onClick={() => setSelectedCamp(null)}
                className="absolute top-4 right-4 text-[#8DA0B0] hover:text-white transition-colors cursor-pointer p-1 rounded-lg bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="border-b border-white/10 pb-3">
                <span className="text-[10px] text-[#4EB8E0] font-mono font-bold uppercase tracking-wider block">CAMP INSPECTION REPORT</span>
                <h3 className="text-xl font-bold text-white font-serif mt-0.5">{selectedCamp.school_name}</h3>
                <p className="text-xs text-[#8DA0B0] font-mono mt-0.5">{selectedCamp.district}, {selectedCamp.state} • Status: <strong className={selectedCamp.status === 'DONE' ? 'text-[#3FA88A]' : 'text-[#DDA43C]'}>{selectedCamp.status}</strong></p>
              </div>

              {selectedCamp.status === 'DONE' ? (
                <div className="space-y-4">
                  {/* Detailed Numbers Grid */}
                  <div className="grid grid-cols-4 gap-3 font-mono text-center text-xs">
                    <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 space-y-1">
                      <span className="text-[10px] text-[#8DA0B0] block uppercase font-bold">Students Screened</span>
                      <span className="font-bold text-white text-xl">{selectedCamp.students_checked}</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#E85D4A]/20 border border-[#E85D4A]/40 space-y-1">
                      <span className="text-[10px] text-[#E85D4A] block uppercase font-bold">High Risk</span>
                      <span className="font-bold text-[#E85D4A] text-xl">{selectedCamp.high_risk_cases}</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#DDA43C]/20 border border-[#DDA43C]/40 space-y-1">
                      <span className="text-[10px] text-[#DDA43C] block uppercase font-bold">Moderate Risk</span>
                      <span className="font-bold text-[#DDA43C] text-xl">{selectedCamp.moderate_risk_cases}</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#3FA88A]/20 border border-[#3FA88A]/40 space-y-1">
                      <span className="text-[10px] text-[#3FA88A] block uppercase font-bold">Clear / Low Risk</span>
                      <span className="font-bold text-[#3FA88A] text-xl">{selectedCamp.low_risk_cases}</span>
                    </div>
                  </div>

                  {/* Complete Flagged Students Roster Search & Filter */}
                  <div className="space-y-3 pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <h4 className="font-bold text-xs text-[#4EB8E0] uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-[#4EB8E0]" />
                        <span>All Flagged Children ({modalAllFlagged.length} Total: {selectedCamp.high_risk_cases} High / {selectedCamp.moderate_risk_cases} Moderate)</span>
                      </h4>

                      {/* Risk Filter Tabs inside Modal */}
                      <div className="flex items-center gap-1 bg-[#0A0E13] p-1 rounded-lg border border-white/10 shrink-0">
                        <button
                          onClick={() => setModalRiskFilter('ALL')}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                            modalRiskFilter === 'ALL' ? 'bg-[#4EB8E0] text-[#0A0E13]' : 'text-[#8DA0B0]'
                          }`}
                        >
                          All ({modalAllFlagged.length})
                        </button>
                        <button
                          onClick={() => setModalRiskFilter('HIGH')}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                            modalRiskFilter === 'HIGH' ? 'bg-[#E85D4A] text-white' : 'text-[#8DA0B0]'
                          }`}
                        >
                          High ({selectedCamp.high_risk_cases})
                        </button>
                        <button
                          onClick={() => setModalRiskFilter('MODERATE')}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                            modalRiskFilter === 'MODERATE' ? 'bg-[#DDA43C] text-[#0A0E13]' : 'text-[#8DA0B0]'
                          }`}
                        >
                          Moderate ({selectedCamp.moderate_risk_cases})
                        </button>
                      </div>
                    </div>

                    {/* Search inside Modal */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-[#8DA0B0] absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={modalSearchQuery}
                        onChange={(e) => setModalSearchQuery(e.target.value)}
                        placeholder="Search flagged students by name or child code..."
                        className="w-full pl-9 pr-3 py-1.5 bg-[#0A0E13] border border-slate-700/80 rounded-xl text-xs text-white placeholder-[#8DA0B0] outline-none focus:border-[#4EB8E0]"
                      />
                    </div>

                    {/* Scrollable Roster of ALL Flagged Children */}
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1 divide-y divide-white/5 font-sans">
                      {modalFilteredFlagged.map((child) => {
                        const isHigh = child.risk_tier === 'HIGH';
                        return (
                          <div key={child.id} className="pt-2 flex items-center justify-between text-xs hover:bg-white/5 p-2 rounded-lg transition-colors">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white">{child.name}</span>
                                <span className="font-mono text-[#4EB8E0] text-[11px] font-semibold">({child.code})</span>
                              </div>
                              <span className="text-[10px] text-[#8DA0B0] block font-mono">
                                Age: {child.age}y/{child.sex} • Jet Velocity: <strong className="text-[#4EB8E0]">{child.velocity}</strong> ({child.pressure}) • Grade {child.grade}/6
                              </span>
                            </div>

                            <span className={`px-2.5 py-1 rounded font-mono font-extrabold text-[10px] tracking-wider border shrink-0 ${
                              isHigh 
                                ? 'bg-[#E85D4A]/20 text-[#E85D4A] border-[#E85D4A]/50' 
                                : 'bg-[#DDA43C]/20 text-[#DDA43C] border-[#DDA43C]/50'
                            }`}>
                              {child.prob_pct}% {isHigh ? 'HIGH' : 'MODERATE'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-[#8DA0B0] flex items-center justify-between font-mono">
                    <span>Assigned Referral Hospital:</span>
                    <strong className="text-[#4EB8E0] font-bold">{selectedCamp.referral_facility}</strong>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-[#DDA43C]/10 border border-[#DDA43C]/40 text-center space-y-2">
                  <Calendar className="w-8 h-8 text-[#DDA43C] mx-auto" />
                  <h4 className="font-bold text-white text-sm">Camp Scheduled for {selectedCamp.scheduled_date}</h4>
                  <p className="text-xs text-[#8DA0B0]">
                    Targeting <strong>{selectedCamp.target_students} children</strong> at {selectedCamp.school_name}. Screening team & mobile ultrasound unit pre-assigned.
                  </p>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedCamp(null)}
                  className="px-5 py-2 rounded-xl bg-[#4EB8E0] hover:bg-[#4EB8E0]/80 text-[#0A0E13] font-bold text-xs cursor-pointer transition-colors"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
