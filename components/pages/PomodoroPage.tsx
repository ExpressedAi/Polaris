import React, { useEffect, useState, useCallback, useRef } from 'react';
import PageShell from './PageShell';
import { PomodoroSession } from '../../types';
import { entityStorage } from '../../services/storage';
import { subscribeToEntityUpdates } from '../../services/entityEvents';
import { awardExperience } from '../../services/experience';
import { Zap, Timer, Flame, Brain, Clock, Users, BarChart3, ScrollText } from 'lucide-react';

type TimerState = 'idle' | 'running' | 'paused' | 'completed';

const PRESET_DURATIONS = [
  { label: 'Short', minutes: 15, Icon: Zap },
  { label: 'Classic', minutes: 25, Icon: Timer },
  { label: 'Long', minutes: 45, Icon: Flame },
  { label: 'Deep', minutes: 90, Icon: Brain },
];

const PomodoroPage: React.FC = () => {
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [timeRemaining, setTimeRemaining] = useState(25 * 60); // in seconds
  const [currentLabel, setCurrentLabel] = useState('Focus');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pausedTime, setPausedTime] = useState<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const load = useCallback(async () => {
    const data = await entityStorage.getPomodoroSessions();
    setSessions(data.sort((a, b) => b.startedAt - a.startedAt));
  }, []);

  useEffect(() => {
    load();
    const unsubscribe = subscribeToEntityUpdates('pomodoro', load);
    return unsubscribe;
  }, [load]);

  // Timer logic
  useEffect(() => {
    if (timerState === 'running' && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState, timeRemaining]);

  const handleStart = () => {
    if (timerState === 'idle') {
      const sessionId = `pomodoro-${Date.now()}`;
      setCurrentSessionId(sessionId);
      setStartTime(Date.now());
      setPausedTime(0);
      setTimeRemaining(selectedDuration * 60);
    } else if (timerState === 'paused') {
      // Resume from paused
      setStartTime(Date.now() - pausedTime);
    }
    setTimerState('running');
  };

  const handlePause = () => {
    if (timerState === 'running' && startTime) {
      const elapsed = Date.now() - startTime;
      setPausedTime(elapsed);
      setTimerState('paused');
    }
  };

  const handleReset = () => {
    setTimerState('idle');
    setTimeRemaining(selectedDuration * 60);
    setCurrentSessionId(null);
    setStartTime(null);
    setPausedTime(0);
  };

  const handleComplete = async () => {
    if (!currentSessionId || !startTime) return;
    
    const actualDuration = Math.round((Date.now() - startTime) / 1000 / 60); // minutes
    const session: PomodoroSession = {
      id: currentSessionId,
      label: currentLabel || 'Focus',
      startedAt: startTime,
      durationMinutes: actualDuration,
    };

    await entityStorage.savePomodoroSession(session);
    await awardExperience('pomodoro.session');
    
    // Play completion sound (optional - browser notification)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Pomodoro Complete!', {
        body: `Great work! You completed ${actualDuration} minutes of focused time.`,
      });
    }

    setTimerState('completed');
    load();
    
    // Auto-reset after 3 seconds
    setTimeout(() => {
      handleReset();
    }, 3000);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = timerState !== 'idle' 
    ? ((selectedDuration * 60 - timeRemaining) / (selectedDuration * 60)) * 100 
    : 0;

  const circumference = 2 * Math.PI * 120; // radius = 120
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Stats
  const todaySessions = sessions.filter(
    s => new Date(s.startedAt).toDateString() === new Date().toDateString()
  );
  const totalTodayMinutes = todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalSessions = sessions.length;
  const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);

  const deleteSession = async (sessionId: string) => {
    await entityStorage.deletePomodoroSession(sessionId);
    load();
  };

  return (
    <PageShell title="Pomodoro" subtitle="Time-boxed focus sessions. Build momentum, one block at a time.">
      {/* Timer Section */}
      <div className="glass-panel rounded-3xl border border-white/70 p-8 mb-6">
        <div className="flex flex-col items-center gap-6">
          {/* Circular Progress Timer */}
          <div className="relative w-64 h-64">
            <svg className="transform -rotate-90 w-64 h-64">
              {/* Background circle */}
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="8"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke={timerState === 'completed' ? '#10b981' : timerState === 'running' ? '#ef4444' : '#6366f1'}
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-5xl font-bold font-mono mb-2">
                {formatTime(timeRemaining)}
              </div>
              <div className="text-sm uppercase tracking-[0.2em] text-secondary-light">
                {timerState === 'idle' && 'Ready'}
                {timerState === 'running' && 'Focusing'}
                {timerState === 'paused' && 'Paused'}
                {timerState === 'completed' && 'Complete!'}
              </div>
            </div>
          </div>

          {/* Label Input */}
          <div className="w-full max-w-md">
            <input
              type="text"
              value={currentLabel}
              onChange={(e) => setCurrentLabel(e.target.value)}
              placeholder="What are you focusing on?"
              className="w-full px-4 py-3 rounded-2xl border border-white/70 bg-white/80 text-center text-lg font-medium focus:outline-none focus:ring-2 focus:ring-black"
              disabled={timerState === 'running'}
            />
          </div>

          {/* Preset Durations */}
          {timerState === 'idle' && (
            <div className="flex gap-3 flex-wrap justify-center">
              {PRESET_DURATIONS.map((preset) => (
                <button
                  key={preset.minutes}
                  onClick={() => {
                    setSelectedDuration(preset.minutes);
                    setTimeRemaining(preset.minutes * 60);
                  }}
                  className={`px-4 py-2 rounded-full border transition-all ${
                    selectedDuration === preset.minutes
                      ? 'bg-black text-white border-black'
                      : 'bg-white/80 border-white/70 hover:bg-white'
                  }`}
                >
                  <preset.Icon className="w-4 h-4 mr-2 inline" />
                  <span className="text-sm font-medium">{preset.label}</span>
                  <span className="text-xs ml-1">({preset.minutes}m)</span>
                </button>
              ))}
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-3">
            {timerState === 'idle' && (
              <button
                onClick={handleStart}
                className="px-8 py-4 rounded-2xl bg-black text-white font-semibold text-lg hover:shadow-xl transition-all"
              >
                Start Focus Session
              </button>
            )}
            {timerState === 'running' && (
              <>
                <button
                  onClick={handlePause}
                  className="px-6 py-3 rounded-2xl bg-white border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                >
                  Pause
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 rounded-2xl bg-red-50 border-2 border-red-200 text-red-700 font-semibold hover:bg-red-100 transition-all"
                >
                  Reset
                </button>
              </>
            )}
            {timerState === 'paused' && (
              <>
                <button
                  onClick={handleStart}
                  className="px-6 py-3 rounded-2xl bg-black text-white font-semibold hover:shadow-lg transition-all"
                >
                  Resume
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 rounded-2xl bg-red-50 border-2 border-red-200 text-red-700 font-semibold hover:bg-red-100 transition-all"
                >
                  Reset
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-red-50 to-orange-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <Timer className="w-6 h-6 text-red-600" />
            <span className="text-2xl font-bold text-black">{todaySessions.length}</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">Today's Sessions</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-blue-50 to-purple-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-6 h-6 text-blue-600" />
            <span className="text-2xl font-bold text-black">{totalTodayMinutes}</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">Minutes Today</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-green-50 to-emerald-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-6 h-6 text-green-600" />
            <span className="text-2xl font-bold text-black">{totalSessions}</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">Total Sessions</p>
        </div>
      </div>

      {/* Session History */}
      <div className="glass-panel rounded-3xl border border-white/70 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ScrollText className="w-5 h-5" />
          <span>Session History</span>
        </h3>
        {sessions.length === 0 ? (
          <p className="text-secondary-light text-sm text-center py-8">
            No sessions yet. Start your first focus session above!
          </p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto invisible-scrollbar">
            {sessions.map((session) => {
              const sessionDate = new Date(session.startedAt);
              const isToday = sessionDate.toDateString() === new Date().toDateString();
              
              return (
                <div
                  key={session.id}
                  className="rounded-2xl border border-white/70 bg-white/80 p-4 flex items-center justify-between gap-3 hover:bg-white transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Timer className="w-4 h-4 text-red-600" />
                      <h4 className="font-semibold">{session.label}</h4>
                      {isToday && (
                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                          Today
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-secondary-light">
                      <span>{sessionDate.toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{sessionDate.toLocaleTimeString()}</span>
                      <span>•</span>
                      <span className="font-mono font-semibold text-black">{session.durationMinutes} min</span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteSession(session.id)}
                    className="px-3 py-1 rounded-full bg-white border border-white/70 text-xs hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all"
                  >
                    Delete
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default PomodoroPage;
