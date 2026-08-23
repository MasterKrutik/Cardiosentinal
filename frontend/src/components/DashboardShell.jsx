import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import OnboardingModal from './OnboardingModal';
import {
  HeartPulse,
  ClipboardList,
  MapPin,
  Activity,
  Sliders,
  Network,
  Pill,
  Bell,
  LogOut,
  ShieldCheck,
  Building2,
  ChevronDown,
  Calendar,
  UserCheck,
  Radio,
  Users,
  FileText
} from 'lucide-react';

export default function DashboardShell({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, selectedDistrict, setSelectedDistrict } = useStore();

  const role = user?.role || 'asha_worker';

  const navItems = [
    {
      label: 'Camp Setup & Scheduling',
      path: '/app/camp-setup',
      icon: Calendar,
      roles: ['school_camp_admin', 'super_admin']
    },
    {
      label: 'Consent & Attendance Roster',
      path: '/app/consent-roster',
      icon: UserCheck,
      roles: ['school_camp_admin', 'super_admin']
    },
    {
      label: 'Camp Triage',
      path: '/app/triage',
      icon: ClipboardList,
      roles: ['asha_worker', 'school_camp_admin', 'district_health_officer', 'super_admin']
    },
    {
      label: 'Live Data Quality Monitor',
      path: '/app/camp-quality-monitor',
      icon: Radio,
      roles: ['school_camp_admin', 'super_admin']
    },
    {
      label: 'Multi-Worker Coordination',
      path: '/app/camp-coordination',
      icon: Users,
      roles: ['school_camp_admin', 'super_admin']
    },
    {
      label: 'Camp Completion Report',
      path: '/app/camp-completion-report',
      icon: FileText,
      roles: ['school_camp_admin', 'super_admin']
    },
    {
      label: 'Daily Camp Route',
      path: '/app/route-today',
      icon: MapPin,
      roles: ['asha_worker', 'super_admin']
    },
    {
      label: 'Personal Impact',
      path: '/app/impact',
      icon: Activity,
      roles: ['asha_worker', 'super_admin']
    },
    {
      label: 'Guardian Reach Status',
      path: '/app/guardian-reach',
      icon: Network,
      roles: ['asha_worker', 'super_admin']
    },

    {
      label: 'District Heatmap',
      path: '/app/heatmap',
      icon: MapPin,
      roles: ['district_health_officer', 'super_admin']
    },
    {
      label: 'Echo Van Forecaster',
      path: '/app/forecast',
      icon: Sliders,
      roles: ['district_health_officer', 'super_admin']
    },
    {
      label: 'CUSUM Anomaly Alert',
      path: '/app/anomalies',
      icon: Activity,
      roles: ['district_health_officer', 'super_admin']
    },
    {
      label: 'Digital Twin Journey',
      path: '/app/care-journey/child-0121',
      icon: Network,
      roles: ['district_health_officer', 'super_admin']
    },
    {
      label: 'Model Trust & Calibration',
      path: '/app/calibration',
      icon: Activity,
      roles: ['school_camp_admin', 'district_health_officer', 'super_admin']
    },
    {
      label: 'Policy Simulator',
      path: '/app/simulator',
      icon: Sliders,
      roles: ['district_health_officer', 'super_admin']
    },
    {
      label: 'Federated Monitor',
      path: '/app/federated',
      icon: Network,
      roles: ['district_health_officer', 'super_admin']
    },
    {
      label: 'Prophylaxis Tracker',
      path: '/app/prophylaxis',
      icon: Pill,
      roles: ['asha_worker', 'school_camp_admin', 'district_health_officer', 'super_admin']
    }
  ];


  const allowedNav = navItems.filter((item) => item.roles.includes(role));

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0E13] text-[#E6EBF0] selection:bg-[#2C7FB8] selection:text-white">
      <OnboardingModal />

      {/* Top Navbar */}
      <header className="h-16 sticky top-0 z-30 backdrop-blur-xl bg-black/50 border-b border-white/10 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900/80 border border-[#E85D4A]/40 flex items-center justify-center text-[#E85D4A]">
              <HeartPulse className="w-5 h-5 animate-pulse" />
            </div>
            <span className="font-bold text-lg text-white">CardioSentinel</span>
          </Link>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#1A4A66]/60 border border-[#4EB8E0]/30 text-[#4EB8E0] capitalize font-medium">
            Role: {role.replace('_', ' ')}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* District Selector */}
          <div className="flex items-center gap-2 text-xs bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl">
            <Building2 className="w-4 h-4 text-[#4EB8E0]" />
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-transparent text-[#4EB8E0] outline-none cursor-pointer"
            >
              <option value="dist-meghalaya-01" className="bg-[#0A0E13]">East Khasi Hills (Meghalaya)</option>
              <option value="dist-ap-01" className="bg-[#0A0E13]">Chittoor (Andhra Pradesh)</option>
              <option value="dist-bihar-01" className="bg-[#0A0E13]">Patna (Bihar)</option>
            </select>
          </div>

          {/* Notification Bell */}
          <button className="p-2 rounded-xl bg-black/40 border border-white/10 text-[#4EB8E0] hover:text-white relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#E85D4A] animate-ping" />
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-3 border-l border-white/10 pl-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-white">{user?.full_name || 'Kavita Devi'}</div>
              <div className="text-[10px] text-[#8DA0B0]">{user?.email || 'asha@cardiosentinel.org'}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-slate-800/60 border border-white/10 text-[#8DA0B0] hover:text-white hover:border-[#4EB8E0]/40 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Left Sidebar */}
        <aside className="w-64 border-r border-white/10 bg-black/30 backdrop-blur-xl p-4 hidden md:flex flex-col gap-2 shrink-0 relative z-20">
          <div className="text-[11px] font-bold text-[#8DA0B0] uppercase tracking-wider px-3 pt-2 pb-1">
            Surveillance Queue
          </div>

          {allowedNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'glass-button text-white shadow-lg border-[#4EB8E0]/40 bg-[#2C7FB8]/20'
                    : 'text-[#8DA0B0] hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#4EB8E0]' : 'text-[#8DA0B0]/60'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-y-auto space-y-6 pb-20">
          {children}
        </main>
      </div>

      {/* Mandatory Ethics Banner (§6) */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-[#1C2530]/95 backdrop-blur-md border-t border-[#2C7FB8]/30 py-2.5 px-6 text-center text-xs text-[#E6EBF0] flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#4EB8E0] shrink-0" />
        <span>
          CardioSentinel is a triage prioritization tool, not a diagnostic device. All flagged cases require echocardiographic confirmation by a qualified clinician.
        </span>
      </footer>
    </div>
  );
}
