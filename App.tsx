
import React from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import Sidebar from './components/Sidebar';
import SylviaPanel from './components/SylviaPanel';
import SettingsView from './components/SettingsView';
import BrandPage from './components/pages/BrandPage';
import PeoplePage from './components/pages/PeoplePage';
import ConceptsPage from './components/pages/ConceptsPage';
import JournalPage from './components/pages/JournalPage';
import AgendaPage from './components/pages/AgendaPage';
import CalendarPage from './components/pages/CalendarPage';
import PomodoroPage from './components/pages/PomodoroPage';
import GamificationPage from './components/pages/GamificationPage';
import PolarisPage from './components/pages/PolarisPage';
import MemorySearchPage from './components/pages/MemorySearchPage';
import EntityDetailPage from './components/pages/EntityDetailPage';
import LevelUpNotification from './components/LevelUpNotification';
import { AppView } from './types';

const AppContent: React.FC = () => {
  const { activeView, entityDetailView } = useAppContext();

  // Show detail page if an entity is selected
  if (entityDetailView.type && entityDetailView.id) {
    return (
      <div className="h-screen w-full overflow-hidden bg-transparent text-primary-light font-sans">
        <LevelUpNotification />
        <div className="flex h-full w-full gap-4 pr-4 py-4 pl-0 overflow-x-hidden min-w-0">
          <Sidebar />
          <main className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0 min-w-0">
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <EntityDetailPage />
            </div>
          </main>
          <SylviaPanel />
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (activeView) {
      case AppView.BRAND:
        return <BrandPage />;
      case AppView.PEOPLE:
        return <PeoplePage />;
      case AppView.CONCEPTS:
        return <ConceptsPage />;
      case AppView.JOURNAL:
        return <JournalPage />;
      case AppView.AGENDA:
        return <AgendaPage />;
      case AppView.CALENDAR:
        return <CalendarPage />;
      case AppView.POMODORO:
        return <PomodoroPage />;
      case AppView.GAMIFICATION:
        return <GamificationPage />;
      case AppView.POLARIS:
        return <PolarisPage />;
      case AppView.SEARCH:
        return <MemorySearchPage />;
      case AppView.SETTINGS:
        return <SettingsView />;
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-transparent text-primary-light font-sans">
      <LevelUpNotification />
      <div className="flex h-full w-full gap-4 pr-4 py-4 pl-0 overflow-x-hidden min-w-0">
        <Sidebar />
        <main className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0 min-w-0">
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {renderView()}
          </div>
        </main>
        <SylviaPanel />
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <AppProvider>
    <AppContent />
  </AppProvider>
);

export default App;
