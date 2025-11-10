import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface LevelUpData {
  level: number;
  levelName: string;
  levelDescription: string;
  iconName?: string;
}

const LevelUpNotification: React.FC = () => {
  const [notification, setNotification] = useState<LevelUpData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleLevelUp = (event: CustomEvent<LevelUpData>) => {
      setNotification(event.detail);
      setIsVisible(true);
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => setNotification(null), 300);
      }, 5000);
    };

    window.addEventListener('levelUp', handleLevelUp as EventListener);
    return () => {
      window.removeEventListener('levelUp', handleLevelUp as EventListener);
    };
  }, []);

  if (!notification) return null;

  return (
    <div
      className={`fixed top-8 right-8 z-50 transition-all duration-500 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[-20px] pointer-events-none'
      }`}
    >
      <div className="glass-panel rounded-3xl border-2 border-yellow-400/70 bg-gradient-to-br from-yellow-50 to-orange-50 p-6 shadow-2xl max-w-md animate-bounce-subtle">
        <div className="flex items-start gap-4">
          <div className="animate-pulse">
            <Sparkles className="w-12 h-12 text-yellow-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs uppercase tracking-[0.3em] text-orange-600 font-bold">LEVEL UP!</span>
            </div>
            <h3 className="text-2xl font-bold text-black mb-1">
              Level {notification.level}: {notification.levelName}
            </h3>
            <p className="text-sm text-gray-700">{notification.levelDescription}</p>
            <div className="mt-4 flex items-center gap-2">
              <div className="flex-1 h-2 bg-white/60 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse" style={{ width: '100%' }} />
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => setNotification(null), 300);
            }}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default LevelUpNotification;

