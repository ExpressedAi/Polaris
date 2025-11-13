import React, { useEffect, useState, useMemo } from 'react';
import PageShell from './PageShell';
import { getExperience, fetchRecentXpEvents, getLevelInfo } from '../../services/experience';
import { XPEvent } from '../../types';
import { entityStorage } from '../../services/storage';
import {
  FileText,
  Flame,
  Dumbbell,
  CheckCircle2,
  Timer,
  Calendar,
  Users,
  Briefcase,
  Palette,
  Star,
  Sparkles,
  Gem,
  Crown,
  Coins,
  Trophy,
  BarChart3,
  Zap,
  TrendingUp,
  Sprout,
  User,
  Radio,
  Network,
  Building,
  Handshake,
  Compass,
  Target,
  Rocket,
  Brain,
  Wand2,
  Plane,
  Scroll,
} from 'lucide-react';

// Epic achievements system
const ACHIEVEMENTS = [
  { id: 'first-entry', title: 'First Reflection', description: 'Write your first journal entry', Icon: FileText, xp: 50 },
  { id: 'journal-streak-7', title: 'Week Warrior', description: '7 days of journaling', Icon: Flame, xp: 100 },
  { id: 'journal-streak-30', title: 'Monthly Master', description: '30 days of journaling', Icon: Dumbbell, xp: 500 },
  { id: 'agenda-10', title: 'Task Master', description: 'Complete 10 agenda items', Icon: CheckCircle2, xp: 150 },
  { id: 'pomodoro-25', title: 'Focus Champion', description: 'Complete 25 pomodoros', Icon: Timer, xp: 200 },
  { id: 'calendar-20', title: 'Time Architect', description: 'Schedule 20 calendar events', Icon: Calendar, xp: 180 },
  { id: 'people-10', title: 'Network Builder', description: 'Add 10 people', Icon: Users, xp: 120 },
  { id: 'brand-5', title: 'Brand Builder', description: 'Define 5 brand elements', Icon: Palette, xp: 100 },
  { id: 'level-5', title: 'Rising Star', description: 'Reach level 5', Icon: Star, xp: 0 },
  { id: 'level-10', title: 'Veteran', description: 'Reach level 10', Icon: Sparkles, xp: 0 },
  { id: 'level-20', title: 'Legend', description: 'Reach level 20', Icon: Gem, xp: 0 },
  { id: 'xp-1000', title: 'XP Collector', description: 'Earn 1000 XP', Icon: Coins, xp: 0 },
  { id: 'xp-5000', title: 'XP Master', description: 'Earn 5000 XP', Icon: Gem, xp: 0 },
  { id: 'xp-10000', title: 'XP Legend', description: 'Earn 10000 XP', Icon: Crown, xp: 0 },
];

// Icon mapping for level icons
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Sprout,
  User,
  Radio,
  Network,
  Building,
  Zap,
  Handshake,
  Compass,
  Crown,
  Target,
  Gem,
  Rocket,
  Brain,
  Wand2,
  Plane,
  Scroll,
  Star,
  Sparkles,
};

const GamificationPage: React.FC = () => {
  const [xp, setXp] = useState({ total: 0, level: 0, nextLevel: 200, levelName: '', levelDescription: '' });
  const [events, setEvents] = useState<XPEvent[]>([]);
  const [stats, setStats] = useState({
    journalEntries: 0,
    agendaItems: 0,
    pomodoros: 0,
    calendarEvents: 0,
    people: 0,
    brand: 0,
  });
  const [achievements, setAchievements] = useState<string[]>([]);

  const fetchXP = async () => {
    const data = await getExperience();
    const history = await fetchRecentXpEvents();
    setXp(data);
    setEvents(history);
  };

  const fetchStats = async () => {
    const [journal, agenda, calendar, people, brand] = await Promise.all([
      entityStorage.getJournalEntries(),
      entityStorage.getAgendaItems(),
      entityStorage.getCalendarEvents(),
      entityStorage.getPeopleRecords(),
      entityStorage.getBrandRecords(),
    ]);

    // Count pomodoros from journal entries tagged as pomodoro
    const pomodoros = journal.filter(e => e.tags?.includes('pomodoro')).length;

    const newStats = {
      journalEntries: journal.length,
      agendaItems: agenda.length,
      pomodoros,
      calendarEvents: calendar.length,
      people: people.length,
      brand: brand.length,
    };

    setStats(newStats);

    // Check achievements using current stats and XP
    const currentXp = await getExperience();
    const unlocked: string[] = [];
    if (newStats.journalEntries >= 1) unlocked.push('first-entry');
    if (newStats.journalEntries >= 7) unlocked.push('journal-streak-7');
    if (newStats.journalEntries >= 30) unlocked.push('journal-streak-30');
    if (newStats.agendaItems >= 10) unlocked.push('agenda-10');
    if (newStats.pomodoros >= 25) unlocked.push('pomodoro-25');
    if (newStats.calendarEvents >= 20) unlocked.push('calendar-20');
    if (newStats.people >= 10) unlocked.push('people-10');
    if (newStats.brand >= 5) unlocked.push('brand-5');
    if (currentXp.level >= 5) unlocked.push('level-5');
    if (currentXp.level >= 10) unlocked.push('level-10');
    if (currentXp.level >= 20) unlocked.push('level-20');
    if (currentXp.total >= 1000) unlocked.push('xp-1000');
    if (currentXp.total >= 5000) unlocked.push('xp-5000');
    if (currentXp.total >= 10000) unlocked.push('xp-10000');
    setAchievements(unlocked);
  };

  useEffect(() => {
    const load = async () => {
      await fetchXP();
      await fetchStats();
    };
    load();
  }, []);

  useEffect(() => {
    fetchStats();
  }, [xp.total, xp.level]);

  const progress = ((xp.total % 200) / 200) * 100;
  const levelInfo = getLevelInfo(xp.level);
  const nextLevelInfo = getLevelInfo(xp.level + 1);

  // Calculate streaks (simplified - would need date tracking for real streaks)
  const journalStreak = useMemo(() => {
    // This is a placeholder - real streak calculation would need date tracking
    return Math.min(Math.floor(stats.journalEntries / 7), 30);
  }, [stats.journalEntries]);

  // XP breakdown by category
  const xpByCategory = useMemo(() => {
    const breakdown: Record<string, number> = {};
    events.forEach(event => {
      const category = event.reason.split('.')[0] || 'other';
      breakdown[category] = (breakdown[category] || 0) + event.points;
    });
    return breakdown;
  }, [events]);

  // Top activities
  const topActivities = useMemo(() => {
    const activityCount: Record<string, number> = {};
    events.forEach(event => {
      activityCount[event.reason] = (activityCount[event.reason] || 0) + 1;
    });
    return Object.entries(activityCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [events]);

  return (
    <PageShell title="Progress" subtitle="Earn XP by partnering with Sylvia. Meaningful actions push you through levels.">
      {/* Level Display */}
      <div className="glass-panel rounded-3xl border border-white/70 p-8 mb-6 space-y-4 bg-gradient-to-br from-white to-gray-50">
            <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {levelInfo.iconName && ICON_MAP[levelInfo.iconName] && (
                React.createElement(ICON_MAP[levelInfo.iconName], { className: 'w-12 h-12 text-black' })
              )}
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-secondary-light">Level {xp.level}</p>
                <h2 className="text-4xl font-bold text-black">{xp.levelName}</h2>
                <p className="text-sm text-secondary-light mt-1">{xp.levelDescription}</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-black">{xp.total.toLocaleString()}</p>
            <p className="text-xs uppercase tracking-[0.2em] text-secondary-light">Total XP</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="w-full h-4 rounded-full bg-white/80 overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out" 
              style={{ width: `${progress}%` }} 
            />
          </div>
          <div className="flex items-center justify-between text-xs text-secondary-light">
            <span>{xp.total % 200} / 200 XP</span>
            <span className="font-semibold flex items-center gap-1">
              Next: {nextLevelInfo.name}
              {nextLevelInfo.iconName && ICON_MAP[nextLevelInfo.iconName] && (
                React.createElement(ICON_MAP[nextLevelInfo.iconName], { className: 'w-3 h-3' })
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Journal Entries', value: stats.journalEntries, Icon: FileText, color: 'from-blue-50 to-blue-100' },
          { label: 'Agenda Items', value: stats.agendaItems, Icon: CheckCircle2, color: 'from-green-50 to-green-100' },
          { label: 'Pomodoros', value: stats.pomodoros, Icon: Timer, color: 'from-red-50 to-red-100' },
          { label: 'Calendar Events', value: stats.calendarEvents, Icon: Calendar, color: 'from-purple-50 to-purple-100' },
        ].map(stat => (
          <div key={stat.label} className={`rounded-2xl border border-white/70 bg-gradient-to-br ${stat.color} p-4`}>
            <div className="flex items-center justify-between mb-2">
              <stat.Icon className="w-6 h-6 text-gray-700" />
              <span className="text-2xl font-bold text-black">{stat.value}</span>
            </div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          <span>Achievements</span>
          <span className="text-sm font-normal text-secondary-light">({achievements.length} / {ACHIEVEMENTS.length})</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {ACHIEVEMENTS.map(achievement => {
            const isUnlocked = achievements.includes(achievement.id);
            return (
              <div
                key={achievement.id}
                className={`rounded-2xl border p-4 transition-all ${
                  isUnlocked
                    ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 shadow-md'
                    : 'bg-white/50 border-white/70 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl ${isUnlocked ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                    <achievement.Icon className={`w-5 h-5 ${isUnlocked ? 'text-yellow-700' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-semibold ${isUnlocked ? 'text-black' : 'text-gray-400'}`}>
                      {achievement.title}
                    </h4>
                    <p className={`text-xs mt-1 ${isUnlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                      {achievement.description}
                    </p>
                    {achievement.xp > 0 && isUnlocked && (
                      <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-yellow-200 text-yellow-800 text-xs font-semibold">
                        +{achievement.xp} XP
                      </span>
                    )}
                  </div>
                  {isUnlocked && (
                    <CheckCircle2 className="w-5 h-5 text-yellow-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* XP Breakdown & Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* XP Breakdown */}
        <div className="glass-panel rounded-3xl border border-white/70 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            <span>XP Breakdown</span>
          </h3>
          {Object.keys(xpByCategory).length === 0 ? (
            <p className="text-sm text-secondary-light">No XP earned yet</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(xpByCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([category, total]) => (
                  <div key={category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize font-medium">{category}</span>
                      <span className="font-semibold">{total} XP</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/60 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        style={{ width: `${(total / xp.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Top Activities */}
        <div className="glass-panel rounded-3xl border border-white/70 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5" />
            <span>Top Activities</span>
          </h3>
          {topActivities.length === 0 ? (
            <p className="text-sm text-secondary-light">No activities yet</p>
          ) : (
            <div className="space-y-3">
              {topActivities.map(([activity, count], index) => (
                <div key={activity} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                    <span className="text-sm capitalize">{activity.replace('.', ' ')}</span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-black text-white text-xs font-semibold">
                    {count}x
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent XP Events */}
      <div className="glass-panel rounded-3xl border border-white/70 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5" />
            <span>Recent Activity</span>
          </h3>
          <button 
            onClick={fetchXP} 
            className="px-3 py-1 rounded-full bg-white border border-white/70 text-black text-xs hover:bg-gray-50 transition"
          >
            Refresh
          </button>
        </div>
        {events.length === 0 ? (
          <p className="text-secondary-light text-sm">No activity yet. Start using Sylvia to earn XP!</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto invisible-scrollbar">
            {events.map(event => (
              <div key={event.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/60 hover:bg-white/80 transition">
                <div className="flex-1">
                  <p className="font-medium text-sm capitalize">{event.reason.replace('.', ' ')}</p>
                  <p className="text-xs text-secondary-light">{new Date(event.createdAt).toLocaleString()}</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold shadow-sm">
                  +{event.points}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default GamificationPage;
