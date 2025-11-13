import React, { useMemo } from 'react';
import { MemoryResult, calculateMemoryStats, MemoryStats } from '../utils/memorySearch';

interface MemoryAnalyticsProps {
  memories: MemoryResult[];
  onFilterByType?: (type: string) => void;
  onFilterByTag?: (tag: string) => void;
}

/**
 * Comprehensive memory analytics dashboard
 * Shows statistics, trends, and insights about memories
 */
const MemoryAnalytics: React.FC<MemoryAnalyticsProps> = ({
  memories,
  onFilterByType,
  onFilterByTag,
}) => {
  const stats: MemoryStats = useMemo(() => calculateMemoryStats(memories), [memories]);

  const topTypes = useMemo(() => {
    return Object.entries(stats.byType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [stats.byType]);

  const topTags = useMemo(() => {
    return Object.entries(stats.byTag)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [stats.byTag]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel border border-white/70 rounded-3xl p-5">
          <div className="text-sm uppercase tracking-[0.3em] text-secondary-light mb-2">
            Total Memories
          </div>
          <div className="text-3xl font-bold text-primary">{stats.total}</div>
        </div>

        <div className="glass-panel border border-white/70 rounded-3xl p-5">
          <div className="text-sm uppercase tracking-[0.3em] text-secondary-light mb-2">
            Today
          </div>
          <div className="text-3xl font-bold text-indigo-600">
            {stats.byTimeRange.today}
          </div>
          <div className="text-xs text-secondary-light mt-1">
            {stats.byTimeRange.thisWeek} this week
          </div>
        </div>

        <div className="glass-panel border border-white/70 rounded-3xl p-5">
          <div className="text-sm uppercase tracking-[0.3em] text-secondary-light mb-2">
            Avg/Day
          </div>
          <div className="text-3xl font-bold text-emerald-600">
            {stats.averagePerDay}
          </div>
          <div className="text-xs text-secondary-light mt-1">
            {stats.byTimeRange.thisMonth} this month
          </div>
        </div>

        <div className="glass-panel border border-white/70 rounded-3xl p-5">
          <div className="text-sm uppercase tracking-[0.3em] text-secondary-light mb-2">
            Most Active
          </div>
          <div className="text-sm font-semibold text-primary mt-2">
            {stats.mostActiveDay || 'No data'}
          </div>
        </div>
      </div>

      {/* Time Range Stats */}
      <div className="glass-panel border border-white/70 rounded-3xl p-6">
        <h3 className="text-lg font-semibold mb-4">Activity by Time Range</h3>
        <div className="space-y-3">
          {[
            { label: 'Today', count: stats.byTimeRange.today, max: stats.total },
            { label: 'This Week', count: stats.byTimeRange.thisWeek, max: stats.total },
            { label: 'This Month', count: stats.byTimeRange.thisMonth, max: stats.total },
            { label: 'This Year', count: stats.byTimeRange.thisYear, max: stats.total },
          ].map(item => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-sm text-secondary-light">
                  {item.count} ({Math.round((item.count / item.max) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${(item.count / item.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Types */}
      {topTypes.length > 0 && (
        <div className="glass-panel border border-white/70 rounded-3xl p-6">
          <h3 className="text-lg font-semibold mb-4">Top Memory Types</h3>
          <div className="space-y-2">
            {topTypes.map(([type, count]) => (
              <button
                key={type}
                onClick={() => onFilterByType?.(type)}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/60 hover:bg-white/80 transition-colors border border-white/70 text-left"
              >
                <span className="font-medium">{type}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-secondary-light">
                    {count} ({Math.round((count / stats.total) * 100)}%)
                  </span>
                  <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{ width: `${(count / stats.total) * 100}%` }}
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Top Tags */}
      {topTags.length > 0 && (
        <div className="glass-panel border border-white/70 rounded-3xl p-6">
          <h3 className="text-lg font-semibold mb-4">Most Used Tags</h3>
          <div className="flex flex-wrap gap-2">
            {topTags.map(([tag, count]) => (
              <button
                key={tag}
                onClick={() => onFilterByTag?.(tag)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors text-sm font-medium"
              >
                <span>{tag}</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-200 dark:bg-indigo-800 text-xs">
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Timeline Info */}
      {stats.oldestMemory > 0 && stats.newestMemory > 0 && (
        <div className="glass-panel border border-white/70 rounded-3xl p-6">
          <h3 className="text-lg font-semibold mb-4">Memory Timeline</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-secondary-light">Oldest Memory</span>
              <span className="font-medium">{formatDate(stats.oldestMemory)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-secondary-light">Newest Memory</span>
              <span className="font-medium">{formatDate(stats.newestMemory)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-secondary-light">Time Span</span>
              <span className="font-medium">
                {Math.floor((stats.newestMemory - stats.oldestMemory) / (1000 * 60 * 60 * 24))} days
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Type Distribution Chart */}
      <div className="glass-panel border border-white/70 rounded-3xl p-6">
        <h3 className="text-lg font-semibold mb-4">Type Distribution</h3>
        <div className="space-y-2">
          {Object.entries(stats.byType)
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => (
              <div key={type}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">{type}</span>
                  <span className="text-xs text-secondary-light">
                    {count} / {stats.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${(count / stats.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default MemoryAnalytics;
