import React from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { AppShell } from './components/layout/AppShell.tsx';
import { AuthModal } from './components/auth/AuthModal.tsx';
import { OnboardingFlow } from './components/auth/OnboardingFlow.tsx';
import { OverviewPage } from './pages/OverviewPage.tsx';
import { JournalEditorPage } from './pages/JournalEditorPage.tsx';
import { JournalHistoryPage } from './pages/JournalHistoryPage.tsx';
import { StrengthsPage } from './pages/StrengthsPage.tsx';
import { CareerDiscoveryPage } from './pages/CareerDiscoveryPage.tsx';
import { CareerRoadmapPage } from './pages/CareerRoadmapPage.tsx';
import { InsightsPage } from './pages/InsightsPage.tsx';
import { ArchitecturePage } from './pages/ArchitecturePage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';

function MainRouter() {
  const { activeTab, loadingUser } = useApp();

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center space-y-3">
        <span className="font-editorial text-2xl font-semibold text-[#222421]">
          Cognitive Diary
        </span>
        <div className="w-6 h-6 border-2 border-[#3E5A46] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const renderCurrentPage = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewPage />;
      case 'journal':
        return <JournalEditorPage />;
      case 'history':
        return <JournalHistoryPage />;
      case 'strengths':
        return <StrengthsPage />;
      case 'careers':
        return <CareerDiscoveryPage />;
      case 'roadmap':
        return <CareerRoadmapPage />;
      case 'insights':
        return <InsightsPage />;
      case 'architecture':
        return <ArchitecturePage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <AppShell>
      {renderCurrentPage()}
      <AuthModal />
      <OnboardingFlow />
    </AppShell>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainRouter />
    </AppProvider>
  );
}
