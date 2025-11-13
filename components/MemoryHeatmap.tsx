import React, { useMemo } from 'react';
import { MemoryResult } from '../utils/memorySearch';

interface MemoryHeatmapProps {
  memories: MemoryResult[];
  onDateClick?: (date: Date, count: number) => void;
}

interface DayData {
  date: Date;
  count: number;
  memories: MemoryResult[];
}

/**
 * GitHub-style contribution heatmap calendar
 * Shows memory activity over the past year
 */
const MemoryHeatmap: React.FC<MemoryHeatmapProps> = ({ memories, onDateClick }) => {
  const heatmapData = useMemo(() => {
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    // Create map of date -> memories
    const dateMap = new Map<string, MemoryResult[]>();

    memories.forEach(memory => {
      const memoryDate = new Date(memory.createdAt);
      if (memoryDate >= oneYearAgo) {
        const dateKey = memoryDate.toISOString().split('T')[0];
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, []);
        }
        dateMap.get(dateKey)!.push(memory);
      }
    });

    // Generate all days for the past year
    const days: DayData[] = [];
    const current = new Date(oneYearAgo);

    while (current <= now) {
      const dateKey = current.toISOString().split('T')[0];
      const dayMemories = dateMap.get(dateKey) || [];

      days.push({
        date: new Date(current),
        count: dayMemories.length,
        memories: dayMemories,
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [memories]);

  // Calculate max count for color intensity
  const maxCount = useMemo(() => {
    return Math.max(...heatmapData.map(d => d.count), 1);
  }, [heatmapData]);

  const getColorClass = (count: number): string => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800';
    const intensity = count / maxCount;
    if (intensity >= 0.75) return 'bg-indigo-600 dark:bg-indigo-500';
    if (intensity >= 0.5) return 'bg-indigo-400 dark:bg-indigo-400';
    if (intensity >= 0.25) return 'bg-indigo-300 dark:bg-indigo-300';
    return 'bg-indigo-200 dark:bg-indigo-200';
  };

  // Group days by week
  const weeks = useMemo(() => {
    const result: DayData[][] = [];
    let currentWeek: DayData[] = [];

    // Pad start to align with week start (Sunday)
    const firstDay = heatmapData[0];
    if (firstDay) {
      const dayOfWeek = firstDay.date.getDay();
      for (let i = 0; i < dayOfWeek; i++) {
        currentWeek.push({
          date: new Date(0),
          count: -1, // Placeholder
          memories: [],
        });
      }
    }

    heatmapData.forEach((day, index) => {
      currentWeek.push(day);

      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });

    // Pad end
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({
          date: new Date(0),
          count: -1,
          memories: [],
        });
      }
      result.push(currentWeek);
    }

    return result;
  }, [heatmapData]);

  const monthLabels = useMemo(() => {
    const labels: Array<{ month: string; weekIndex: number }> = [];
    let currentMonth = -1;

    weeks.forEach((week, weekIndex) => {
      const firstValidDay = week.find(d => d.count >= 0);
      if (firstValidDay) {
        const month = firstValidDay.date.getMonth();
        if (month !== currentMonth) {
          currentMonth = month;
          labels.push({
            month: firstValidDay.date.toLocaleDateString('en-US', { month: 'short' }),
            weekIndex,
          });
        }
      }
    });

    return labels;
  }, [weeks]);

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="glass-panel border border-white/70 rounded-3xl p-6">
      <h3 className="text-lg font-semibold mb-4">Activity Heatmap</h3>

      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1" style={{ minWidth: '800px' }}>
          {/* Month labels */}
          <div className="flex gap-1 mb-1">
            <div style={{ width: '30px' }}></div>
            {monthLabels.map((label, i) => (
              <div
                key={i}
                className="text-xs text-gray-600 dark:text-gray-400"
                style={{
                  marginLeft: i === 0 ? 0 : `${(label.weekIndex - (monthLabels[i - 1]?.weekIndex || 0)) * 14}px`,
                  width: '40px',
                }}
              >
                {label.month}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col gap-1">
              {[0, 1, 2, 3, 4, 5, 6].map(i => (
                <div
                  key={i}
                  className="text-xs text-gray-600 dark:text-gray-400 flex items-center justify-end"
                  style={{ width: '30px', height: '12px' }}
                >
                  {i % 2 === 1 ? dayLabels[i] : ''}
                </div>
              ))}
            </div>

            {/* Days grid */}
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => {
                  if (day.count === -1) {
                    return (
                      <div
                        key={dayIndex}
                        className="w-3 h-3"
                        style={{ width: '12px', height: '12px' }}
                      />
                    );
                  }

                  return (
                    <div
                      key={dayIndex}
                      className={`w-3 h-3 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-indigo-500 ${getColorClass(day.count)}`}
                      style={{ width: '12px', height: '12px' }}
                      title={`${day.date.toLocaleDateString()}: ${day.count} ${day.count === 1 ? 'memory' : 'memories'}`}
                      onClick={() => onDateClick?.(day.date, day.count)}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-600 dark:text-gray-400">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" style={{ width: '12px', height: '12px' }} />
              <div className="w-3 h-3 rounded-sm bg-indigo-200 dark:bg-indigo-200" style={{ width: '12px', height: '12px' }} />
              <div className="w-3 h-3 rounded-sm bg-indigo-300 dark:bg-indigo-300" style={{ width: '12px', height: '12px' }} />
              <div className="w-3 h-3 rounded-sm bg-indigo-400 dark:bg-indigo-400" style={{ width: '12px', height: '12px' }} />
              <div className="w-3 h-3 rounded-sm bg-indigo-600 dark:bg-indigo-500" style={{ width: '12px', height: '12px' }} />
            </div>
            <span>More</span>
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p>
          <strong>{heatmapData.filter(d => d.count > 0).length}</strong> active days in the past year
        </p>
      </div>
    </div>
  );
};

export default MemoryHeatmap;
