import React, { useState, useEffect, useRef } from 'react';
import DashboardShell from '../components/DashboardShell';
import {
  Sliders, Truck, TrendingUp, Calendar, AlertTriangle, ShieldCheck,
  MapPin, IndianRupee, Target, CheckCircle2, Zap, ArrowRight, Info,
  Clock, BarChart2, Layers, UserCheck, Award, Lock, Sparkles, Check, DollarSign, Calculator, ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, Cell, LabelList
} from 'recharts';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_TILE_CONFIG } from '../config/mapTiles';

// Available Camp Admins for DHO Selection
const CAMP_ADMINS = [
  { id: 'admin-01', name: 'Dr. Rajesh Sharma', role: 'Senior Camp Operations Lead', phone: '+91 98765 43210' },
  { id: 'admin-02', name: 'Dr. Anita Sangma', role: 'Field Operations Specialist', phone: '+91 98765 11223' },
  { id: 'admin-03', name: 'Dr. Bikash Dkhar', role: 'Epidemiological Camp Supervisor', phone: '+91 98765 99887' }
];

// Available Mobile Echo Units
const MOBILE_ECHO_UNITS = [
  { id: 'van-01', name: 'Mobile Echo Unit #01 (East Khasi Hills)', capacity: '150 scans/day', driver: 'Arjun Das' },
  { id: 'van-02', name: 'Mobile Echo Unit #02 (Ri-Bhoi & West Khasi)', capacity: '120 scans/day', driver: 'Rahul Roy' }
];

// Default Economical Deployment Itinerary
const INITIAL_DEPLOYMENTS = [
  {
    id: 'dep-01',
    rank: 1,
    school_name: 'Govt High School Mawlai',
    district: 'East Khasi Hills',
    latitude: 25.5950,
    longitude: 91.8750,
    forecasted_30d_volume: 20,
    recommended_days: 5,
    expected_catch_yield: 17,
    van_operating_cost_inr: 42500,
    cost_per_case_caught_inr: 2500,
    priority: 'HIGH',
    assigned_admin_id: 'admin-01',
    assigned_van_id: 'van-01',
    authorized_by_dho: true,
    authorization_timestamp: '2026-08-20 10:30 AM',
    rationale: 'Highest 30-day forecasted volume (20 cases) combined with dense rural-govt enrolment profile. Maximum expected catch rate (17 cases in 5 days).'
  },
  {
    id: 'dep-02',
    rank: 2,
    school_name: 'Pynthorumkhrah Academy',
    district: 'East Khasi Hills',
    latitude: 25.5900,
    longitude: 91.9100,
    forecasted_30d_volume: 14,
    recommended_days: 3,
    expected_catch_yield: 12,
    van_operating_cost_inr: 25500,
    cost_per_case_caught_inr: 2125,
    priority: 'MEDIUM',
    assigned_admin_id: 'admin-02',
    assigned_van_id: 'van-01',
    authorized_by_dho: true,
    authorization_timestamp: '2026-08-21 09:15 AM',
    rationale: 'Active GAS/RHD outbreak cluster zone (14 forecasted cases). 3-day targeted deployment captures subclinical cases before cluster escalation.'
  },
  {
    id: 'dep-03',
    rank: 3,
    school_name: 'Mawsynram Rural Secondary',
    district: 'East Khasi Hills',
    latitude: 25.3100,
    longitude: 91.5800,
    forecasted_30d_volume: 10,
    recommended_days: 2,
    expected_catch_yield: 8,
    van_operating_cost_inr: 17000,
    cost_per_case_caught_inr: 2125,
    priority: 'MEDIUM',
    assigned_admin_id: 'admin-01',
    assigned_van_id: 'van-02',
    authorized_by_dho: false,
    authorization_timestamp: null,
    rationale: 'Moderate 30-day forecasted volume (10 cases) in high-vulnerability remote terrain. 2-day visit ensures rural baseline coverage.'
  },
  {
    id: 'dep-04',
    rank: 4,
    school_name: 'Jirang Tribal Secondary',
    district: 'Ri-Bhoi',
    latitude: 25.9500,
    longitude: 91.6500,
    forecasted_30d_volume: 8,
    recommended_days: 2,
    expected_catch_yield: 6,
    van_operating_cost_inr: 17000,
    cost_per_case_caught_inr: 2833,
    priority: 'MEDIUM',
    assigned_admin_id: 'admin-03',
    assigned_van_id: 'van-02',
    authorized_by_dho: false,
    authorization_timestamp: null,
    rationale: 'Border tribal cluster with 8 subclinical cases projected. 2-day targeted visit synchronizes with Ri-Bhoi district outreach.'
  }
];

// Leaflet Map Component with Dark Matter tiles & edge-to-edge invalidateSize
function EchoVanRouteMap({ deployments }) {
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
    const map = L.map(container, { zoomControl: true, scrollWheelZoom: false });
    mapInstanceRef.current = map;

    L.tileLayer(MAP_TILE_CONFIG.darkUrl || MAP_TILE_CONFIG.url, {
      attribution: MAP_TILE_CONFIG.attribution,
      maxZoom: MAP_TILE_CONFIG.maxZoom,
      subdomains: MAP_TILE_CONFIG.subdomains || 'abcd',
      noWrap: true
    }).addTo(map);

    layerGroupRef.current = L.layerGroup().addTo(map);

    if (deployments && deployments.length > 0) {
      const bounds = L.latLngBounds(deployments.map(d => [d.latitude, d.longitude]));
      map.fitBounds(bounds, { padding: [40, 40] });
    } else {
      map.setView([25.5000, 91.8000], 10);
    }

    const invalidate = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize({ animate: false });
      }
    };

    requestAnimationFrame(invalidate);
    const t1 = setTimeout(invalidate, 100);
    const t2 = setTimeout(invalidate, 400);

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(invalidate);
    });
    resizeObserver.observe(container);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
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

    deployments.forEach((dep) => {
      if (!dep.latitude || !dep.longitude) return;

      const isHigh = dep.priority === 'HIGH';
      const color = isHigh ? '#E85D4A' : '#DDA43C';
      const radius = isHigh ? 18 : 14;

      const circle = L.circleMarker([dep.latitude, dep.longitude], {
        radius,
        fillColor: color,
        color: '#ffffff',
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.85,
      }).addTo(layerGroup);

      const adminObj = CAMP_ADMINS.find(a => a.id === dep.assigned_admin_id);

      circle.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; min-width: 220px; padding: 2px; color: #14181D;">
          <div style="font-weight: 800; font-size: 13px; color: #0A0E13; margin-bottom: 2px;">
            Rank #${dep.rank}: ${dep.school_name}
          </div>
          <div style="font-size: 10px; font-weight: 700; color: ${color}; margin-bottom: 6px;">
            ${dep.priority} PRIORITY (${dep.recommended_days} Days) · ${dep.authorized_by_dho ? '✅ Authorized' : '⏳ Pending Approval'}
          </div>
          <div style="background: #f8fafc; padding: 6px; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 6px;">
            <div><strong>Camp Admin:</strong> ${adminObj?.name || 'Unassigned'}</div>
            <div><strong>Expected Catch Yield:</strong> <span style="color: #059669; font-weight: 700;">${dep.expected_catch_yield} children</span></div>
            <div><strong>Cost per Case:</strong> <span style="color: #d97706; font-weight: 700;">₹${dep.cost_per_case_caught_inr.toLocaleString()}</span></div>
          </div>
        </div>
      `);
    });

    if (deployments.length > 0) {
      const bounds = L.latLngBounds(deployments.map(d => [d.latitude, d.longitude]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    map.invalidateSize();
  }, [deployments]);

  return (
    <div
      ref={mapRef}
      style={{ height: '360px', width: '100%', minHeight: '360px', position: 'relative' }}
      className="rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
    />
  );
}

export default function DistrictForecastPage() {
  const [deployments, setDeployments] = useState(INITIAL_DEPLOYMENTS);
  const [districtBudgetINR, setDistrictBudgetINR] = useState(150000);
  const [authorizationToast, setAuthorizationToast] = useState(null);

  // Economical Calculations
  const vanDailyCostINR = 8500;
  const totalDaysRequested = deployments.reduce((acc, d) => acc + d.recommended_days, 0);
  const totalOperatingCostINR = totalDaysRequested * vanDailyCostINR;
  const totalExpectedYield = deployments.reduce((acc, d) => acc + d.expected_catch_yield, 0);
  const avgCostPerCaseINR = totalExpectedYield > 0 ? Math.round(totalOperatingCostINR / totalExpectedYield) : 0;
  
  // Late-Stage Surgery Cost Savings Calculation (₹280,000 per surgical valve replacement in India)
  const surgicalRepairCostINR = 280000;
  const totalSurgicalCostPreventedINR = totalExpectedYield * surgicalRepairCostINR;
  const netHealthcareSavingsINR = totalSurgicalCostPreventedINR - totalOperatingCostINR;
  const roiRatio = totalOperatingCostINR > 0 ? (totalSurgicalCostPreventedINR / totalOperatingCostINR).toFixed(1) : 0;

  // Handle DHO Assignment of Camp Admin to a school
  const handleAssignAdmin = (depId, adminId) => {
    setDeployments(prev => prev.map(d => d.id === depId ? { ...d, assigned_admin_id: adminId } : d));
  };

  // Handle DHO Assignment of Mobile Echo Van
  const handleAssignVan = (depId, vanId) => {
    setDeployments(prev => prev.map(d => d.id === depId ? { ...d, assigned_van_id: vanId } : d));
  };

  // Handle DHO Authorization & Permission Toggle
  const handleAuthorizeDeployment = (depId) => {
    setDeployments(prev => prev.map(d => {
      if (d.id === depId) {
        const nextState = !d.authorized_by_dho;
        const nowStr = new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
        
        if (nextState) {
          const adminObj = CAMP_ADMINS.find(a => a.id === d.assigned_admin_id);
          setAuthorizationToast(`✅ Authorized deployment for ${d.school_name}! Assigned Lead: ${adminObj?.name}. Resources & Echo Van allocated.`);
        }

        return {
          ...d,
          authorized_by_dho: nextState,
          authorization_timestamp: nextState ? nowStr : null
        };
      }
      return d;
    }));
  };

  const topDep = deployments[0];

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header Title */}
        <div className="border-b border-white/10 pb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#4EB8E0] uppercase tracking-wider">
              <Sliders className="w-4 h-4 text-[#4EB8E0]" />
              <span>District Health Officer Governance Engine</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white font-serif mt-1">
              Predictive Mobile Echo Van Resource Allocator & DHO Authorization Center
            </h1>
            <p className="text-xs text-[#8DA0B0]">
              Assign Camp Admins, authorize Mobile Ultrasound Van routes, and calculate economic healthcare savings across Meghalaya.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#132030] border border-white/10 text-xs text-[#E6EBF0] font-mono shadow-md">
              <Truck className="w-4 h-4 text-[#4EB8E0]" />
              <span>Van Cost: ₹8,500/day</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#3FA88A]/20 border border-[#3FA88A]/40 text-xs font-bold text-[#3FA88A] shadow-md">
              <ShieldCheck className="w-4 h-4 text-[#3FA88A]" />
              <span>DHO Permission Gate Active</span>
            </div>
          </div>
        </div>

        {/* Authorization Toast */}
        {authorizationToast && (
          <div className="p-4 rounded-xl bg-[#3FA88A]/20 border border-[#3FA88A]/50 text-[#3FA88A] text-xs flex items-center justify-between gap-3 animate-fadeIn shadow-xl">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#3FA88A] shrink-0" />
              <span className="font-bold text-white leading-relaxed">{authorizationToast}</span>
            </div>
            <button 
              onClick={() => setAuthorizationToast(null)}
              className="text-xs text-[#3FA88A] hover:text-white font-bold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Financial & Economic Health ROI Matrix (4 Cards with Full Form Information) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
          <div className="glass-card p-4 rounded-xl space-y-1.5 border-white/10 bg-black/40">
            <span className="text-[10px] text-[#8DA0B0] uppercase font-bold block tracking-wider">TOTAL DEPLOYMENT DURATION</span>
            <span className="text-2xl font-bold text-white font-mono">{totalDaysRequested} Days</span>
            <span className="text-[11px] text-[#4EB8E0] font-sans block">Mobile Echo Van Route Duration across {deployments.length} Schools</span>
          </div>

          <div className="glass-card p-4 rounded-xl space-y-1.5 border-[#3FA88A]/30 bg-[#3FA88A]/10">
            <span className="text-[10px] text-[#3FA88A] uppercase font-bold block tracking-wider">FORECASTED SUBCLINICAL CATCH YIELD</span>
            <span className="text-2xl font-bold text-[#3FA88A] font-mono">{totalExpectedYield} Children</span>
            <span className="text-[11px] text-slate-300 font-sans block">Early Silent RHD Detection (+31 vs Un-targeted)</span>
          </div>

          <div className="glass-card p-4 rounded-xl space-y-1.5 border-[#DDA43C]/30 bg-[#DDA43C]/10">
            <span className="text-[10px] text-[#DDA43C] uppercase font-bold block tracking-wider">TOTAL VAN OPERATING COST (INR)</span>
            <span className="text-2xl font-bold text-[#DDA43C] font-mono">₹{totalOperatingCostINR.toLocaleString()}</span>
            <span className="text-[11px] text-slate-300 font-sans block">₹8,500/day × {totalDaysRequested} Operating Days</span>
          </div>

          <div className="glass-card p-4 rounded-xl space-y-1.5 border-[#00F5D4]/40 bg-[#0F2A38] shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#00F5D4] uppercase font-extrabold block tracking-wider">RETURN ON INVESTMENT (ROI)</span>
              <span className="px-1.5 py-0.5 rounded bg-[#00F5D4]/20 text-[#00F5D4] text-[9px] font-bold">FULL FORM</span>
            </div>
            <span className="text-2xl font-black text-[#00F5D4] font-mono">{roiRatio}x ROI</span>
            <div className="text-[11px] text-white font-sans font-bold">
              ₹{(netHealthcareSavingsINR / 100000).toFixed(2)} Lakhs INR Saved
            </div>
            <div className="text-[9.5px] text-[#90E0EF] font-sans block leading-tight mt-1 border-t border-white/10 pt-1">
              (₹{(totalSurgicalCostPreventedINR / 10000000).toFixed(2)} Cr Surgical Surgery Avoided vs ₹{(totalOperatingCostINR / 100000).toFixed(2)} L Van Cost)
            </div>
          </div>
        </div>

        {/* Economic Explanation Banner */}
        <div className="p-3.5 rounded-xl bg-[#132030] border border-[#00F5D4]/30 text-xs text-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans shadow-md">
          <div className="flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-[#00F5D4] shrink-0" />
            <div>
              <strong className="text-white font-bold block">Return On Investment (ROI) Full Form Explanation:</strong>
              <span className="text-[#8DA0B0] text-[11px]">
                ROI stands for <strong>Return On Investment</strong>. For every <strong>₹1,000 INR</strong> spent on mobile ultrasound screening (₹{totalOperatingCostINR.toLocaleString()} total), CardioSentinel prevents <strong>₹{Math.round(roiRatio * 1000).toLocaleString()} INR</strong> in downstream open-heart valve replacement surgeries (₹2,80,000 per surgical procedure).
              </span>
            </div>
          </div>
        </div>

        {/* Top Priority Deployment Rationale Banner */}
        {topDep && (
          <div className="glass-card p-6 border-[#4EB8E0]/40 bg-[#0F1722] rounded-2xl space-y-3 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-[#E85D4A]/20 text-[#E85D4A] border border-[#E85D4A]/50 text-[10px] font-extrabold uppercase font-mono tracking-wider">
                  🔥 #1 PRIORITY RECOMMENDED DESTINATION
                </span>
                <span className="text-xs text-[#8DA0B0] font-mono">{topDep.district}, Meghalaya</span>
              </div>
              <div className="text-right font-mono text-xs">
                <span className="text-[#8DA0B0]">Est. Cost Per Detection: </span>
                <strong className="text-[#DDA43C] font-bold text-sm">₹{topDep.cost_per_case_caught_inr.toLocaleString()} / case</strong>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white font-serif">{topDep.school_name}</h3>
                <p className="text-xs text-[#E6EBF0] mt-1 max-w-2xl leading-relaxed">
                  {topDep.rationale}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="p-3 rounded-xl bg-black/50 border border-white/10 text-center font-mono text-xs">
                  <span className="text-[10px] text-[#8DA0B0] block">Recommended Duration</span>
                  <strong className="text-white text-base block font-bold">{topDep.recommended_days} Days</strong>
                </div>
                <div className="p-3 rounded-xl bg-[#3FA88A]/20 border border-[#3FA88A]/40 text-center font-mono text-xs">
                  <span className="text-[10px] text-[#3FA88A] block">Expected Catch</span>
                  <strong className="text-[#3FA88A] text-base block font-bold">{topDep.expected_catch_yield} Children</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Map & District Budget Interactive Simulator */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Edge-to-Edge Dark Matter Leaflet Map */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base font-serif flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#4EB8E0]" />
                <span>Meghalaya Mobile Echo Van Route Map</span>
              </h3>
              <span className="text-xs font-mono text-[#8DA0B0]">
                {deployments.length} Priority Deployment Destinations
              </span>
            </div>

            <EchoVanRouteMap deployments={deployments} />
          </div>

          {/* Right Col: Interactive Economical Budget Simulator */}
          <div className="glass-card p-5 space-y-4 rounded-2xl border-white/10 bg-[#0A0E13]">
            <div className="border-b border-white/10 pb-3">
              <span className="text-[10px] text-[#4EB8E0] font-mono font-bold uppercase tracking-wider block">FINANCIAL ECONOMICS CALCULATOR</span>
              <h3 className="font-bold text-white text-sm font-serif mt-0.5">District Health Allocation Budget</h3>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>District Budget Allocation:</span>
                  <strong className="text-[#00F5D4]">₹{districtBudgetINR.toLocaleString()}</strong>
                </div>
                <input
                  type="range"
                  min="50000"
                  max="300000"
                  step="10000"
                  value={districtBudgetINR}
                  onChange={(e) => setDistrictBudgetINR(Number(e.target.value))}
                  className="w-full accent-[#4EB8E0] cursor-pointer"
                />
              </div>

              <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#8DA0B0]">Max Mobile Echo Van Days:</span>
                  <strong className="text-white">{Math.floor(districtBudgetINR / vanDailyCostINR)} Days</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8DA0B0]">Estimated Children Screened:</span>
                  <strong className="text-[#4EB8E0]">{Math.floor(districtBudgetINR / vanDailyCostINR) * 125} Kids</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8DA0B0]">Subclinical Cases Caught:</span>
                  <strong className="text-[#3FA88A]">{Math.round((districtBudgetINR / vanDailyCostINR) * 4.3)} Cases</strong>
                </div>
                <div className="flex justify-between pt-1 border-t border-white/10">
                  <span className="text-[#8DA0B0]">Late Surgery Cost Saved:</span>
                  <strong className="text-[#DDA43C]">₹{(Math.round((districtBudgetINR / vanDailyCostINR) * 4.3) * 2.8).toFixed(1)} Lakhs</strong>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#4EB8E0]/10 border border-[#4EB8E0]/30 text-[11px] text-[#90E0EF] leading-relaxed">
                💡 <strong>Economic Efficiency Insight</strong>: Early subclinical triage via Mobile Echo Van costs <strong>₹2,217 per case</strong> vs. late-stage pediatric heart valve replacement costing <strong>₹2,80,000 per surgery</strong>.
              </div>
            </div>
          </div>
        </div>

        {/* DHO Resource Allocation & Camp Admin Permission Matrix Table */}
        <div className="glass-card p-6 space-y-4 rounded-2xl border-white/10 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div>
              <h3 className="font-bold text-base text-white font-serif flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#3FA88A]" />
                <span>DHO Resource Allocation & Camp Admin Permission Matrix</span>
              </h3>
              <p className="text-xs text-[#8DA0B0] mt-0.5">
                Assign Camp Admins & Mobile Echo Vans to remaining school camps. Click to grant official DHO Authorization.
              </p>
            </div>
            <span className="text-xs font-mono text-[#8DA0B0]">
              Showing <strong className="text-white font-bold">{deployments.length}</strong> deployment routes
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#E6EBF0]">
              <thead>
                <tr className="border-b border-white/10 text-[#8DA0B0] font-bold uppercase tracking-wider text-[11px] font-mono">
                  <th className="pb-3 px-3">Rank & Destination</th>
                  <th className="pb-3 px-3">Assign Camp Admin</th>
                  <th className="pb-3 px-3">Assign Mobile Echo Van</th>
                  <th className="pb-3 px-3">Duration & Forecast</th>
                  <th className="pb-3 px-3">Economical Cost</th>
                  <th className="pb-3 px-3">DHO Authorization Status</th>
                  <th className="pb-3 px-3 text-right">Action Permission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {deployments.map((dep) => {
                  const isAuthorized = dep.authorized_by_dho;

                  return (
                    <tr key={dep.id} className="hover:bg-white/5 transition-all">
                      {/* Rank & Destination */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#4EB8E0]/20 border border-[#4EB8E0]/40 flex items-center justify-center text-[#4EB8E0] font-bold font-mono text-xs">
                            #{dep.rank}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs">{dep.school_name}</div>
                            <div className="text-[10px] text-[#8DA0B0] font-mono">{dep.district}</div>
                          </div>
                        </div>
                      </td>

                      {/* Camp Admin Dropdown */}
                      <td className="py-3.5 px-3">
                        <select
                          value={dep.assigned_admin_id}
                          onChange={(e) => handleAssignAdmin(dep.id, e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#0F1722] border border-slate-700/80 text-white text-xs outline-none focus:border-[#4EB8E0] cursor-pointer"
                        >
                          {CAMP_ADMINS.map(admin => (
                            <option key={admin.id} value={admin.id} className="bg-[#0A0E13]">
                              {admin.name} ({admin.role})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Mobile Echo Van Dropdown */}
                      <td className="py-3.5 px-3">
                        <select
                          value={dep.assigned_van_id}
                          onChange={(e) => handleAssignVan(dep.id, e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#0F1722] border border-slate-700/80 text-white text-xs outline-none focus:border-[#4EB8E0] cursor-pointer"
                        >
                          {MOBILE_ECHO_UNITS.map(van => (
                            <option key={van.id} value={van.id} className="bg-[#0A0E13]">
                              {van.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Duration & Forecast */}
                      <td className="py-3.5 px-3 font-mono">
                        <div className="text-white font-bold">{dep.recommended_days} Days Duration</div>
                        <div className="text-[10px] text-[#3FA88A]">Yield: {dep.expected_catch_yield} Children</div>
                      </td>

                      {/* Economical Cost */}
                      <td className="py-3.5 px-3 font-mono">
                        <div className="text-[#DDA43C] font-bold">₹{dep.van_operating_cost_inr.toLocaleString()}</div>
                        <div className="text-[10px] text-[#8DA0B0]">₹{dep.cost_per_case_caught_inr.toLocaleString()} / case</div>
                      </td>

                      {/* Authorization Status */}
                      <td className="py-3.5 px-3">
                        {isAuthorized ? (
                          <div>
                            <span className="px-2.5 py-1 rounded bg-[#3FA88A]/20 text-[#3FA88A] border border-[#3FA88A]/50 text-[10px] font-extrabold uppercase font-mono inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Authorized by DHO</span>
                            </span>
                            <div className="text-[9px] text-[#8DA0B0] font-mono mt-0.5">{dep.authorization_timestamp || '2026-08-21'}</div>
                          </div>
                        ) : (
                          <span className="px-2.5 py-1 rounded bg-[#DDA43C]/20 text-[#DDA43C] border border-[#DDA43C]/50 text-[10px] font-extrabold uppercase font-mono inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Pending DHO Approval</span>
                          </span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => handleAuthorizeDeployment(dep.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                            isAuthorized 
                              ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40' 
                              : 'bg-[#3FA88A] hover:bg-[#3FA88A]/80 text-[#0A0E13] shadow-md hover:scale-[1.02]'
                          }`}
                        >
                          {isAuthorized ? (
                            <span>Revoke Authorization</span>
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5 text-[#0A0E13]" />
                              <span>Authorize Deployment</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
