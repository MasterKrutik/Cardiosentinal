import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import CampTriageView from './pages/CampTriageView';
import DistrictHeatmap from './pages/DistrictHeatmap';
import WaveformViewer from './pages/WaveformViewer';
import CalibrationDashboard from './pages/CalibrationDashboard';
import PolicySimulator from './pages/PolicySimulator';
import FederatedMonitor from './pages/FederatedMonitor';
import ProphylaxisTracker from './pages/ProphylaxisTracker';

// Addendum 2 & 3 New Pages
import FamilyLoginPage from './pages/FamilyLoginPage';
import FamilyJourneyPage from './pages/FamilyJourneyPage';
import FamilyFacilitiesPage from './pages/FamilyFacilitiesPage';
import FamilyAskPage from './pages/FamilyAskPage';
import FamilyProphylaxisPage from './pages/FamilyProphylaxisPage';
import AshaRoutePage from './pages/AshaRoutePage';
import AshaImpactPage from './pages/AshaImpactPage';
import DistrictForecastPage from './pages/DistrictForecastPage';
import DistrictAnomaliesPage from './pages/DistrictAnomaliesPage';
import DigitalTwinJourneyPage from './pages/DigitalTwinJourneyPage';
import GuardianReachPage from './pages/GuardianReachPage';

// Addendum 41 School Camp Admin Pages
import CampSetupPage from './pages/CampSetupPage';
import ConsentRosterPage from './pages/ConsentRosterPage';
import CampQualityMonitorPage from './pages/CampQualityMonitorPage';
import MultiWorkerCoordinationPage from './pages/MultiWorkerCoordinationPage';
import CampCompletionReportPage from './pages/CampCompletionReportPage';

import { LiveLocationProvider } from './context/LiveLocationContext';

export default function App() {
  return (
    <LiveLocationProvider>
      <Router>
        <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/how-it-works" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Parent / Guardian Portal Routes */}
        <Route path="/family/login" element={<FamilyLoginPage />} />
        <Route path="/family/journey/:childId" element={<FamilyJourneyPage />} />
        <Route path="/family/prophylaxis/:childId" element={<FamilyProphylaxisPage />} />
        <Route path="/family/facilities" element={<FamilyFacilitiesPage />} />
        <Route path="/family/ask" element={<FamilyAskPage />} />


        {/* Authenticated Dashboard Routes */}
        <Route path="/app/camp-setup" element={<CampSetupPage />} />
        <Route path="/app/consent-roster" element={<ConsentRosterPage />} />
        <Route path="/app/triage" element={<CampTriageView />} />
        <Route path="/app/camp-quality-monitor" element={<CampQualityMonitorPage />} />
        <Route path="/app/camp-coordination" element={<MultiWorkerCoordinationPage />} />
        <Route path="/app/camp-completion-report" element={<CampCompletionReportPage />} />

        <Route path="/app/route-today" element={<AshaRoutePage />} />
        <Route path="/app/impact" element={<AshaImpactPage />} />
        <Route path="/app/guardian-reach" element={<GuardianReachPage />} />

        <Route path="/app/heatmap" element={<DistrictHeatmap />} />
        <Route path="/app/forecast" element={<DistrictForecastPage />} />
        <Route path="/app/anomalies" element={<DistrictAnomaliesPage />} />
        <Route path="/app/care-journey" element={<DigitalTwinJourneyPage />} />
        <Route path="/app/care-journey/:childId" element={<DigitalTwinJourneyPage />} />
        <Route path="/app/digital-twin" element={<DigitalTwinJourneyPage />} />
        <Route path="/app/digital-twin/:childId" element={<DigitalTwinJourneyPage />} />
        <Route path="/app/waveform/:id" element={<WaveformViewer />} />
        <Route path="/app/calibration" element={<CalibrationDashboard />} />
        <Route path="/app/simulator" element={<PolicySimulator />} />
        <Route path="/app/federated" element={<FederatedMonitor />} />
        <Route path="/app/prophylaxis" element={<ProphylaxisTracker />} />

        {/* Catch-all redirect to public landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  </LiveLocationProvider>
  );
}

