import React, { ReactNode, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { AppView } from '../types';
import { Twitter } from 'lucide-react';
import {
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  ChevronDownIcon,
  SparklesIcon,
  DocumentDuplicateIcon,
  PanelRightOpenIcon,
} from './Icons';

interface NavItemProps {
  icon: ReactNode;
  label: string;
  isActive?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive }) => (
  <div
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-sm font-medium transition-all duration-200 ${
      isActive ? 'bg-white text-primary-light shadow-inner' : 'text-secondary-light hover:text-primary-light hover:bg-white/60'
    }`}
  >
    <span className="flex items-center justify-center w-7 h-7 rounded-2xl bg-white/80 text-primary-light shadow-sm">
      {icon}
    </span>
    <span>{label}</span>
  </div>
);


const Sidebar: React.FC = () => {
  const {
    threads,
    currentThread,
    createThread,
    selectThread,
    deleteThreadById,
    setActiveView,
    activeView,
  } = useAppContext();
  const [showThreads, setShowThreads] = useState(false);

  const handleNewThread = async () => {
    await createThread();
    setActiveView(AppView.CHAT);
  };

  const handleThreadClick = async (threadId: string) => {
    await selectThread(threadId);
    setActiveView(AppView.CHAT);
  };


  const workspaceNav = [
    { label: 'Memory', view: AppView.SEARCH, icon: <SearchIcon className="w-4 h-4" /> },
    { label: 'Journal', view: AppView.JOURNAL, icon: <DocumentDuplicateIcon className="w-4 h-4" /> },
    { label: 'Agenda', view: AppView.AGENDA, icon: <PanelRightOpenIcon className="w-4 h-4" /> },
    { label: 'Calendar', view: AppView.CALENDAR, icon: <DocumentDuplicateIcon className="w-4 h-4" /> },
    { label: 'Pomodoro', view: AppView.POMODORO, icon: <PanelRightOpenIcon className="w-4 h-4" /> },
    { label: 'Twitter/X', view: AppView.TWITTER, icon: <Twitter className="w-4 h-4" /> },
    { label: 'Polaris', view: AppView.POLARIS, icon: <SparklesIcon className="w-4 h-4" /> },
    { label: 'Progress', view: AppView.GAMIFICATION, icon: <DocumentDuplicateIcon className="w-4 h-4" /> },
    { label: 'Brand', view: AppView.BRAND, icon: <SparklesIcon className="w-4 h-4" /> },
    { label: 'People', view: AppView.PEOPLE, icon: <DocumentDuplicateIcon className="w-4 h-4" /> },
    { label: 'Concepts', view: AppView.CONCEPTS, icon: <SparklesIcon className="w-4 h-4" /> },
  ];

  const threadList = (
    <div className="space-y-2 max-h-[50vh] overflow-y-auto soft-scrollbar">
      {threads.length === 0 ? (
        <div className="px-3 py-2 text-sm text-secondary-light">No conversations yet</div>
      ) : (
        threads.map((thread) => (
          <div
            key={thread.id}
            className={`group relative px-4 py-3 rounded-2xl border cursor-pointer transition-all ${
              currentThread?.id === thread.id
                ? 'bg-black text-white border-black shadow-lg'
                : 'border-white/70 hover:bg-white/70'
            }`}
            onClick={() => handleThreadClick(thread.id)}
          >
            <p className="text-sm font-semibold truncate">{thread.title}</p>
            {currentThread?.id === thread.id ? (
              <p className="text-xs text-white/70">Active</p>
            ) : (
              <p className="text-xs text-secondary-light">Thread</p>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteThreadById(thread.id);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-secondary-light hover:text-primary-light"
            >
              ✕
            </button>
          </div>
        ))
      )}
    </div>
  );


  return (
    <>
      <aside className="glass-panel w-[260px] flex-shrink-0 rounded-[32px] rounded-l-none p-5 flex flex-col h-full max-h-full border border-white/70 shadow-xl overflow-hidden">

        <div className="space-y-2 mt-6 flex-shrink-0">
          <button onClick={handleNewThread} className="w-full">
            <NavItem icon={<PlusIcon className="w-4 h-4" />} label="New thread" />
          </button>
        </div>

        <div className="flex-1 min-h-0 mt-6 pr-1 space-y-6 overflow-y-auto invisible-scrollbar">
          <button
            className="w-full flex items-center justify-between text-xs uppercase tracking-[0.4em] text-secondary-light mb-3 px-2"
            onClick={() => setShowThreads((prev) => !prev)}
          >
            <span>Threads</span>
            <ChevronDownIcon className={`w-4 h-4 transition-transform ${showThreads ? 'rotate-180' : ''}`} />
          </button>
          {showThreads && threadList}
          <div className="space-y-1">
            {workspaceNav.map((item) => (
              <button key={item.view} onClick={() => setActiveView(item.view)} className="w-full">
                <NavItem icon={item.icon} label={item.label} isActive={activeView === item.view} />
              </button>
            ))}
          </div>
        </div>


        <div className="flex-shrink-0 pt-4 border-t border-white/60">
          <button
            onClick={() => setActiveView(AppView.SETTINGS)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition ${
              activeView === AppView.SETTINGS
                ? 'bg-black text-white shadow-lg'
                : 'bg-white/70 text-primary-light hover:bg-white/90'
            }`}
          >
            <SettingsIcon className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
