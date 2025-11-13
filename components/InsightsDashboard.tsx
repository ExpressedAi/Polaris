import React, { useEffect, useState } from 'react';
import { TrendingUp, Target, Flame, Calendar, Clock, Award } from 'lucide-react';
import { entityStorage } from '../services/storage';
import { formatRelativeDate } from '../utils/helpers';

interface Stats {
  totalEntities: number;
  todayActivity: number;
  weekStreak: number;
  totalMessages: number;
  totalPomodoros: number;
  completedGoals: number;
}

const InsightsDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalEntities: 0,
    todayActivity: 0,
    weekStreak: 0,
    totalMessages: 0,
    totalPomodoros: 0,
    completedGoals: 0,
  });
  const [recentActivity, setRecentActivity] = useState<Array<{ type: string; time: number; label: string }>>([]);

  useEffect(() => {
    const loadStats = async () => {
      const [
        brand,
        people,
        concepts,
        journal,
        messages,
        pomodoros,
        goals,
      ] = await Promise.all([
        entityStorage.getBrandRecords(),
        entityStorage.getPeopleRecords(),
        entityStorage.getConceptRecords(),
        entityStorage.getJournalEntries(),
        entityStorage.getMessages(),
        entityStorage.getPomodoroSessions(),
        entityStorage.getGoals(),
      ]);

      const total = brand.length + people.length + concepts.length + journal.length;

      // Calculate today's activity
      const today = new Date().setHours(0, 0, 0, 0);
      const todayMessages = messages.filter(m => m.createdAt >= today).length;
      const todayJournal = journal.filter(j => j.createdAt >= today).length;
      const todayActivity = todayMessages + todayJournal;

      // Calculate week streak (simplified)
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const recentMessages = messages.filter(m => m.createdAt >= weekAgo);
      const daysActive = new Set(recentMessages.map(m =>
        new Date(m.createdAt).toDateString()
      )).size;

      // Completed goals
      const completed = goals.filter(g => g.status === 'completed').length;

      setStats({
        totalEntities: total,
        todayActivity,
        weekStreak: daysActive,
        totalMessages: messages.length,
        totalPomodoros: pomodoros.length,
        completedGoals: completed,
      });

      // Recent activity
      const recent: Array<{ type: string; time: number; label: string }> = [];

      journal.slice(-5).forEach(j => {
        recent.push({ type: 'journal', time: j.createdAt, label: j.title || 'Journal entry' });
      });

      concepts.slice(-5).forEach(c => {
        recent.push({ type: 'concept', time: c.createdAt, label: c.name });
      });

      people.slice(-5).forEach(p => {
        recent.push({ type: 'person', time: p.createdAt, label: p.name });
      });

      recent.sort((a, b) => b.time - a.time);
      setRecentActivity(recent.slice(0, 10));
    };

    loadStats();
  }, []);

  const statCards = [
    {
      label: 'Total Items',
      value: stats.totalEntities,
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'from-blue-500 to-indigo-500',
    },
    {
      label: 'Activity Today',
      value: stats.todayActivity,
      icon: <Calendar className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500',
    },
    {
      label: 'Week Streak',
      value: `${stats.weekStreak} days`,
      icon: <Flame className="w-6 h-6" />,
      color: 'from-orange-500 to-red-500',
    },
    {
      label: 'Pomodoros',
      value: stats.totalPomodoros,
      icon: <Clock className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-500',
    },
    {
      label: 'Goals Complete',
      value: stats.completedGoals,
      icon: <Award className="w-6 h-6" />,
      color: 'from-yellow-500 to-orange-500',
    },
    {
      label: 'Messages',
      value: stats.totalMessages,
      icon: <Target className="w-6 h-6" />,
      color: 'from-cyan-500 to-blue-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="glass-panel rounded-2xl border border-white/70 p-4 card-hover"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white mb-3`}>
              {stat.icon}
            </div>
            <div className="text-2xl font-bold text-primary-light">
              {stat.value}
            </div>
            <div className="text-xs text-secondary-light mt-1">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="glass-panel rounded-2xl border border-white/70 p-6">
        <h3 className="text-lg font-semibold text-primary-light mb-4">
          Recent Activity
        </h3>
        <div className="space-y-3">
          {recentActivity.length === 0 ? (
            <p className="text-sm text-secondary-light text-center py-8">
              No recent activity
            </p>
          ) : (
            recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-white/30 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'journal' ? 'bg-purple-500' :
                    activity.type === 'concept' ? 'bg-blue-500' :
                    'bg-green-500'
                  }`} />
                  <span className="text-sm font-medium text-primary-light">
                    {activity.label}
                  </span>
                </div>
                <span className="text-xs text-secondary-light">
                  {formatRelativeDate(activity.time)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default InsightsDashboard;
