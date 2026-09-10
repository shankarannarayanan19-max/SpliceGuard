import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';

// Pages
import { OverviewPage } from './pages/OverviewPage';
import { LiveInspectionPage } from './pages/LiveInspectionPage';
import { DigitalTwinPage } from './pages/DigitalTwinPage';
import { SplicePassportsPage } from './pages/SplicePassportsPage';
import { AlertsPage } from './pages/AlertsPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { PersonnelPage } from './pages/PersonnelPage';
import { SystemHealthPage } from './pages/SystemHealthPage';
import { FinancialReadinessPage } from './pages/FinancialReadinessPage';

const AppContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col selection:bg-cyan-200 selection:text-cyan-950">
      {/* Top Cyber-Industrial Header & Navigation */}
      <Header />

      {/* Main Responsive Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        {activeTab === 'overview' && <OverviewPage />}
        {activeTab === 'live' && <LiveInspectionPage />}
        {activeTab === 'digital-twin' && <DigitalTwinPage />}
        {activeTab === 'passports' && <SplicePassportsPage />}
        {activeTab === 'alerts' && <AlertsPage />}
        {activeTab === 'maintenance' && <MaintenancePage />}
        {activeTab === 'personnel' && <PersonnelPage />}
        {activeTab === 'system-health' && <SystemHealthPage />}
        {activeTab === 'readiness' && <FinancialReadinessPage />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
