
import React, { useState, useEffect, useMemo } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { ToastProvider, useToast } from './hooks/useToast';
import ToastContainer from './components/Toast';
import CommandPalette from './components/CommandPalette';
import { useCommandPalette } from './hooks/useCommandPalette';
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
import { Menu, X, MessageSquare } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeView, entityDetailView, setActiveView, createThread } = useAppContext();
  const { toasts, dismissToast } = useToast();
  const { isOpen: commandPaletteOpen, close: closeCommandPalette } = useCommandPalette();
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatPanelOpen, setChatPanelOpen] = useState(false);

  // Command palette commands
  const commands = useMemo(() => [
    {
      id: 'new-thread',
      label: 'New Thread',
      description: 'Start a new conversation with Sylvia',
      action: () => {
        createThread();
        setActiveView(AppView.CHAT);
      },
      category: 'Actions',
      keywords: ['chat', 'conversation', 'message'],
    },
    {
      id: 'nav-search',
      label: 'Go to Memory Search',
      description: 'Search across all your data',
      action: () => setActiveView(AppView.SEARCH),
      category: 'Navigation',
      keywords: ['find', 'lookup'],
    },
    {
      id: 'nav-brand',
      label: 'Go to Brand',
      description: 'Manage brand identity and voice',
      action: () => setActiveView(AppView.BRAND),
      category: 'Navigation',
    },
    {
      id: 'nav-people',
      label: 'Go to People',
      description: 'Manage contacts and relationships',
      action: () => setActiveView(AppView.PEOPLE),
      category: 'Navigation',
    },
    {
      id: 'nav-concepts',
      label: 'Go to Concepts',
      description: 'Explore ideas and technologies',
      action: () => setActiveView(AppView.CONCEPTS),
      category: 'Navigation',
    },
    {
      id: 'nav-journal',
      label: 'Go to Journal',
      description: 'Write and review journal entries',
      action: () => setActiveView(AppView.JOURNAL),
      category: 'Navigation',
    },
    {
      id: 'nav-agenda',
      label: 'Go to Agenda',
      description: 'Manage tasks and deliverables',
      action: () => setActiveView(AppView.AGENDA),
      category: 'Navigation',
    },
    {
      id: 'nav-calendar',
      label: 'Go to Calendar',
      description: 'View and manage events',
      action: () => setActiveView(AppView.CALENDAR),
      category: 'Navigation',
    },
    {
      id: 'nav-pomodoro',
      label: 'Go to Pomodoro',
      description: 'Track focus sessions',
      action: () => setActiveView(AppView.POMODORO),
      category: 'Navigation',
    },
    {
      id: 'nav-gamification',
      label: 'Go to Progress',
      description: 'View achievements and XP',
      action: () => setActiveView(AppView.GAMIFICATION),
      category: 'Navigation',
    },
    {
      id: 'nav-polaris',
      label: 'Go to Polaris Goals',
      description: 'Manage strategic goals',
      action: () => setActiveView(AppView.POLARIS),
      category: 'Navigation',
    },
    {
      id: 'nav-settings',
      label: 'Go to Settings',
      description: 'Configure Polaris',
      action: () => setActiveView(AppView.SETTINGS),
      category: 'Navigation',
      keywords: ['preferences', 'config'],
    },
  ], [createThread, setActiveView]);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Show detail page if an entity is selected
  if (entityDetailView.type && entityDetailView.id) {
    return (
      <div className="h-screen w-full overflow-hidden bg-transparent text-primary-light font-sans">
        <LevelUpNotification />

        {/* Mobile Header with Menu Buttons */}
        {isMobile && (
          <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-card-light dark:bg-card-dark border-b border-border-light dark:border-border-dark">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-border-light dark:hover:bg-border-dark transition-colors"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <span className="text-sm font-medium">Polaris</span>
            <button
              onClick={() => setChatPanelOpen(!chatPanelOpen)}
              className="p-2 rounded-lg hover:bg-border-light dark:hover:bg-border-dark transition-colors"
              aria-label="Toggle chat"
            >
              <MessageSquare size={24} />
            </button>
          </div>
        )}

        <div className={`flex h-full w-full ${isMobile ? 'pt-14' : 'gap-4 pr-4 py-4 pl-0'} overflow-x-hidden min-w-0`}>
          {/* Sidebar - Overlay on mobile, fixed on desktop */}
          <div className={`
            ${isMobile ? 'fixed inset-0 z-50 transform transition-transform duration-300' : ''}
            ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
          `}>
            {isMobile && sidebarOpen && (
              <div
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            <div className={isMobile ? 'relative z-10 h-full' : ''}>
              <Sidebar onNavigate={isMobile ? () => setSidebarOpen(false) : undefined} />
            </div>
          </div>

          <main className={`flex-1 flex flex-col ${isMobile ? '' : 'gap-4'} overflow-hidden min-h-0 min-w-0`}>
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <EntityDetailPage />
            </div>
          </main>

          {/* Chat Panel - Fullscreen on mobile, sidebar on desktop */}
          {isMobile ? (
            <div className={`
              fixed inset-0 z-50 transform transition-transform duration-300 bg-background-light dark:bg-background-dark
              ${chatPanelOpen ? 'translate-x-0' : 'translate-x-full'}
            `}>
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark">
                  <span className="text-sm font-medium">Chat</span>
                  <button
                    onClick={() => setChatPanelOpen(false)}
                    className="p-2 rounded-lg hover:bg-border-light dark:hover:bg-border-dark transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <SylviaPanel isMobile={isMobile} />
                </div>
              </div>
            </div>
          ) : (
            <SylviaPanel isMobile={isMobile} />
          )}
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
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <CommandPalette isOpen={commandPaletteOpen} onClose={closeCommandPalette} commands={commands} />

      {/* Mobile Header with Menu Buttons */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-card-light dark:bg-card-dark border-b border-border-light dark:border-border-dark">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-border-light dark:hover:bg-border-dark transition-colors"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <span className="text-sm font-medium">Polaris</span>
          <button
            onClick={() => setChatPanelOpen(!chatPanelOpen)}
            className="p-2 rounded-lg hover:bg-border-light dark:hover:bg-border-dark transition-colors"
            aria-label="Toggle chat"
          >
            <MessageSquare size={24} />
          </button>
        </div>
      )}

      <div className={`flex h-full w-full ${isMobile ? 'pt-14' : 'gap-4 pr-4 py-4 pl-0'} overflow-x-hidden min-w-0`}>
        {/* Sidebar - Overlay on mobile, fixed on desktop */}
        <div className={`
          ${isMobile ? 'fixed inset-0 z-50 transform transition-transform duration-300' : ''}
          ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
        `}>
          {isMobile && sidebarOpen && (
            <div
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <div className={isMobile ? 'relative z-10 h-full' : ''}>
            <Sidebar onNavigate={isMobile ? () => setSidebarOpen(false) : undefined} />
          </div>
        </div>

        <main className={`flex-1 flex flex-col ${isMobile ? '' : 'gap-4'} overflow-hidden min-h-0 min-w-0`}>
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {renderView()}
          </div>
        </main>

        {/* Chat Panel - Fullscreen on mobile, sidebar on desktop */}
        {isMobile ? (
          <div className={`
            fixed inset-0 z-50 transform transition-transform duration-300 bg-background-light dark:bg-background-dark
            ${chatPanelOpen ? 'translate-x-0' : 'translate-x-full'}
          `}>
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark">
                <span className="text-sm font-medium">Chat</span>
                <button
                  onClick={() => setChatPanelOpen(false)}
                  className="p-2 rounded-lg hover:bg-border-light dark:hover:bg-border-dark transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <SylviaPanel isMobile={isMobile} />
              </div>
            </div>
          </div>
        ) : (
          <SylviaPanel isMobile={isMobile} />
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <ToastProvider>
    <AppProvider>
      <AppContent />
    </AppProvider>
  </ToastProvider>
);

export default App;
