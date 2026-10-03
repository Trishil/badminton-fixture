import React from 'react';
import { TournamentProvider, useTournament } from './context/TournamentContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { LiveCourtDashboard } from './components/views/LiveCourtDashboard';
import { ScheduleView } from './components/views/ScheduleView';
import { StandingsView } from './components/views/StandingsView';
import { KnockoutView } from './components/views/KnockoutView';
import { AdminView } from './components/views/AdminView';
import { AuthKeyModal } from './components/modals/AuthKeyModal';
import { PodiumModal } from './components/modals/PodiumModal';

const TournamentApp: React.FC = () => {
  const { activeTab, showAuthModal, setShowAuthModal } = useTournament();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white antialiased">
      {/* Top Sticky Header */}
      <Header />

      {/* Navigation Tabs (Top on Desktop, Bottom on Mobile) */}
      <Navigation />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 py-3.5 sm:px-6 sm:py-6 pb-28 md:pb-12">
        {activeTab === 'courts' && <LiveCourtDashboard />}
        {activeTab === 'schedule' && <ScheduleView />}
        {activeTab === 'standings' && <StandingsView />}
        {activeTab === 'knockout' && <KnockoutView />}
        {activeTab === 'admin' && <AdminView />}
      </main>

      {/* Global Modals */}
      <AuthKeyModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      <PodiumModal />

      {/* Desktop Minimal Footer */}
      <footer className="hidden md:block py-4 border-t border-slate-200 text-center text-xs text-slate-400 bg-white">
        SmashFlow Tournament Operations Engine • 2 Courts • 20 Teams • 3-Hour Window • Multi-Device Cloud Sync
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <TournamentProvider>
      <TournamentApp />
    </TournamentProvider>
  );
};

export default App;
