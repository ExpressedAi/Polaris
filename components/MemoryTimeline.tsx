import React, { useMemo } from 'react';
import { MemoryResult } from '../utils/memorySearch';
import { formatRelativeDate } from '../utils/helpers';

interface MemoryTimelineProps {
  memories: MemoryResult[];
  onMemoryClick?: (memory: MemoryResult) => void;
  searchQuery?: string;
}

interface TimelineGroup {
  label: string;
  date: Date;
  memories: MemoryResult[];
}

/**
 * Visual timeline view of memories with chronological markers
 */
const MemoryTimeline: React.FC<MemoryTimelineProps> = ({
  memories,
  onMemoryClick,
  searchQuery,
}) => {
  const timelineGroups = useMemo(() => {
    const groups: TimelineGroup[] = [];
    const sortedMemories = [...memories].sort((a, b) => b.createdAt - a.createdAt);

    let currentGroup: TimelineGroup | null = null;

    sortedMemories.forEach(memory => {
      const memoryDate = new Date(memory.createdAt);
      const dateKey = memoryDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      if (!currentGroup || currentGroup.label !== dateKey) {
        currentGroup = {
          label: dateKey,
          date: memoryDate,
          memories: [],
        };
        groups.push(currentGroup);
      }

      currentGroup.memories.push(memory);
    });

    return groups;
  }, [memories]);

  const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      'Journal entry': 'bg-emerald-500',
      'Agenda task': 'bg-blue-500',
      'Calendar event': 'bg-purple-500',
      'Deliverable': 'bg-orange-500',
      'Brand atom': 'bg-pink-500',
      'Person': 'bg-cyan-500',
      'Concept': 'bg-indigo-500',
      'Goal': 'bg-yellow-500',
      'Task': 'bg-red-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  const getTypeIcon = (type: string): string => {
    const icons: Record<string, string> = {
      'Journal entry': '📔',
      'Agenda task': '✓',
      'Calendar event': '📅',
      'Deliverable': '📦',
      'Brand atom': '✨',
      'Person': '👤',
      'Concept': '💡',
      'Goal': '🎯',
      'Task': '☑',
    };
    return icons[type] || '📄';
  };

  const highlightText = (text: string): React.ReactNode => {
    if (!searchQuery || !searchQuery.trim()) return text;

    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-700">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getRelativeLabel = (dateStr: string, date: Date): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const memoryDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (memoryDay.getTime() === today.getTime()) return '🌟 Today';
    if (memoryDay.getTime() === yesterday.getTime()) return '🔹 Yesterday';

    const daysAgo = Math.floor((today.getTime() - memoryDay.getTime()) / (1000 * 60 * 60 * 24));
    if (daysAgo < 7) return `🔸 ${daysAgo} days ago`;

    return dateStr;
  };

  if (memories.length === 0) {
    return (
      <div className="text-center py-12 text-secondary-light">
        <p className="text-lg">No memories to display</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical timeline line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 opacity-30" />

      <div className="space-y-8">
        {timelineGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="relative">
            {/* Date marker */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative z-10 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
                <div className="text-center">
                  <div className="text-xs font-semibold">
                    {group.date.toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                  <div className="text-2xl font-bold leading-none">
                    {group.date.getDate()}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {getRelativeLabel(group.label, group.date)}
                </h3>
                <p className="text-sm text-secondary-light">
                  {group.memories.length} {group.memories.length === 1 ? 'memory' : 'memories'}
                </p>
              </div>
            </div>

            {/* Memories in this group */}
            <div className="ml-24 space-y-3">
              {group.memories.map((memory, memoryIndex) => (
                <div
                  key={memory.id}
                  className="relative group cursor-pointer"
                  onClick={() => onMemoryClick?.(memory)}
                >
                  {/* Connection line to timeline */}
                  <div className="absolute -left-16 top-6 w-12 h-0.5 bg-gray-300 dark:bg-gray-600 group-hover:bg-indigo-500 transition-colors" />

                  {/* Memory card */}
                  <div className="glass-panel border border-white/70 rounded-3xl p-5 hover:shadow-lg hover:border-indigo-300 transition-all">
                    <div className="flex items-start gap-4">
                      {/* Type icon */}
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full ${getTypeColor(memory.type)} flex items-center justify-center text-white text-lg shadow-md`}
                      >
                        {getTypeIcon(memory.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                            {memory.type}
                          </span>
                          <span className="text-xs text-secondary-light">
                            {new Date(memory.createdAt).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <h4 className="text-lg font-semibold text-primary mb-1">
                          {highlightText(memory.title || 'Untitled')}
                        </h4>

                        <p className="text-sm text-secondary line-clamp-2">
                          {highlightText(memory.content)}
                        </p>

                        {/* Tags */}
                        {memory.tags && memory.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {memory.tags.slice(0, 3).map(tag => (
                              <span
                                key={tag}
                                className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                              >
                                {tag}
                              </span>
                            ))}
                            {memory.tags.length > 3 && (
                              <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                +{memory.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Status indicators */}
                        <div className="flex items-center gap-2 mt-2 text-xs">
                          {memory.status && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                              {memory.status}
                            </span>
                          )}
                          {memory.priority && (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full ${
                                memory.priority === 'high'
                                  ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                                  : memory.priority === 'medium'
                                  ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                                  : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                              }`}
                            >
                              {memory.priority}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemoryTimeline;
