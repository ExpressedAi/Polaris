import React, { useState } from 'react';
import { MemoryResult } from '../utils/memorySearch';
import { formatRelativeDate, truncate } from '../utils/helpers';
import MarkdownBlock from './MarkdownBlock';

interface MemoryCardProps {
  memory: MemoryResult;
  view: 'list' | 'grid' | 'compact';
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  onClick?: (memory: MemoryResult) => void;
  onEdit?: (memory: MemoryResult) => void;
  onDelete?: (memory: MemoryResult) => void;
  onDuplicate?: (memory: MemoryResult) => void;
  onPin?: (memory: MemoryResult) => void;
  isPinned?: boolean;
  searchQuery?: string;
}

/**
 * Memory card component with multiple view modes
 */
const MemoryCard: React.FC<MemoryCardProps> = ({
  memory,
  view,
  selected = false,
  onSelect,
  onClick,
  onEdit,
  onDelete,
  onDuplicate,
  onPin,
  isPinned = false,
  searchQuery,
}) => {
  const [showActions, setShowActions] = useState(false);

  const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      'Journal entry': 'bg-emerald-100 text-emerald-700',
      'Agenda task': 'bg-blue-100 text-blue-700',
      'Calendar event': 'bg-purple-100 text-purple-700',
      'Deliverable': 'bg-orange-100 text-orange-700',
      'Brand atom': 'bg-pink-100 text-pink-700',
      'Person': 'bg-cyan-100 text-cyan-700',
      'Concept': 'bg-indigo-100 text-indigo-700',
      'Goal': 'bg-yellow-100 text-yellow-700',
      'Task': 'bg-red-100 text-red-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
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

    try {
      const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const parts = text.split(regex);
      return parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-700 px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      );
    } catch {
      return text;
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.actions-menu')) {
      return;
    }
    onClick?.(memory);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect?.(memory.id, e.target.checked);
  };

  // Compact view
  if (view === 'compact') {
    return (
      <div
        className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
          selected
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
            : 'border-white/70 bg-white/85 hover:bg-white hover:shadow-md'
        }`}
        onClick={handleCardClick}
      >
        {onSelect && (
          <input
            type="checkbox"
            checked={selected}
            onChange={handleCheckboxChange}
            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
        )}
        <span className="text-lg">{getTypeIcon(memory.type)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isPinned && <span className="text-yellow-500">📌</span>}
            <h4 className="font-semibold text-sm truncate">{highlightText(memory.title || 'Untitled')}</h4>
          </div>
          <p className="text-xs text-secondary-light">{memory.type}</p>
        </div>
        <span className="text-xs text-secondary-light whitespace-nowrap">
          {formatRelativeDate(memory.createdAt)}
        </span>
      </div>
    );
  }

  // Grid view
  if (view === 'grid') {
    return (
      <div
        className={`glass-panel border rounded-3xl p-5 transition-all cursor-pointer relative ${
          selected
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
            : 'border-white/70 hover:shadow-lg hover:border-indigo-300'
        }`}
        onClick={handleCardClick}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {onSelect && (
          <input
            type="checkbox"
            checked={selected}
            onChange={handleCheckboxChange}
            className="absolute top-4 left-4 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 z-10"
          />
        )}

        {showActions && (
          <div className="actions-menu absolute top-4 right-4 flex gap-1 z-10">
            {onPin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPin(memory);
                }}
                className={`p-1.5 rounded-lg transition-colors ${
                  isPinned ? 'text-yellow-500 bg-yellow-100' : 'bg-white/90 hover:bg-white'
                }`}
                title={isPinned ? 'Unpin' : 'Pin'}
              >
                📌
              </button>
            )}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(memory);
                }}
                className="p-1.5 rounded-lg bg-white/90 hover:bg-white transition-colors"
                title="Edit"
              >
                ✏
              </button>
            )}
            {onDuplicate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(memory);
                }}
                className="p-1.5 rounded-lg bg-white/90 hover:bg-white transition-colors"
                title="Duplicate"
              >
                📋
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(memory);
                }}
                className="p-1.5 rounded-lg bg-white/90 hover:bg-red-100 text-red-600 transition-colors"
                title="Delete"
              >
                🗑
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">{getTypeIcon(memory.type)}</span>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getTypeColor(memory.type)}`}>
            {memory.type}
          </span>
          {isPinned && !showActions && <span className="text-yellow-500">📌</span>}
        </div>

        <h3 className="text-lg font-semibold mb-2 line-clamp-2">
          {highlightText(memory.title || 'Untitled')}
        </h3>

        <div className="text-sm text-secondary line-clamp-3 mb-3">
          {highlightText(truncate(memory.content, 150))}
        </div>

        {memory.tags && memory.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {memory.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-700"
              >
                {tag}
              </span>
            ))}
            {memory.tags.length > 3 && (
              <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-700">
                +{memory.tags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-secondary-light pt-3 border-t border-gray-200 dark:border-gray-700">
          <span>{formatRelativeDate(memory.createdAt)}</span>
          {memory.status && (
            <span className={`px-2 py-0.5 rounded-full ${
              memory.status === 'done' ? 'bg-green-100 text-green-700' :
              memory.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {memory.status}
            </span>
          )}
        </div>
      </div>
    );
  }

  // List view (default)
  return (
    <div
      className={`glass-panel border rounded-3xl p-5 transition-all cursor-pointer relative ${
        selected
          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
          : 'border-white/70 hover:shadow-lg hover:border-indigo-300'
      }`}
      onClick={handleCardClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start gap-4">
        {onSelect && (
          <input
            type="checkbox"
            checked={selected}
            onChange={handleCheckboxChange}
            className="mt-1 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
        )}

        <span className="text-3xl flex-shrink-0">{getTypeIcon(memory.type)}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {isPinned && <span className="text-yellow-500">📌</span>}
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getTypeColor(memory.type)}`}>
                {memory.type}
              </span>
            </div>
            <span className="text-xs text-secondary-light">
              {formatRelativeDate(memory.createdAt)}
            </span>
          </div>

          <h3 className="text-xl font-semibold mb-2">
            {highlightText(memory.title || 'Untitled')}
          </h3>

          <div className="text-sm text-secondary mb-3 line-clamp-2">
            {highlightText(memory.content)}
          </div>

          <div className="flex items-center gap-3">
            {memory.tags && memory.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {memory.tags.slice(0, 5).map(tag => (
                  <span
                    key={tag}
                    className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-700"
                  >
                    {tag}
                  </span>
                ))}
                {memory.tags.length > 5 && (
                  <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-700">
                    +{memory.tags.length - 5}
                  </span>
                )}
              </div>
            )}

            {memory.status && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                memory.status === 'done' ? 'bg-green-100 text-green-700' :
                memory.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {memory.status}
              </span>
            )}

            {memory.priority && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                memory.priority === 'high' ? 'bg-red-100 text-red-700' :
                memory.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {memory.priority}
              </span>
            )}
          </div>
        </div>

        {showActions && (
          <div className="actions-menu flex flex-col gap-1">
            {onPin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPin(memory);
                }}
                className={`p-1.5 rounded-lg transition-colors ${
                  isPinned ? 'text-yellow-500 bg-yellow-100' : 'bg-white/90 hover:bg-white'
                }`}
                title={isPinned ? 'Unpin' : 'Pin'}
              >
                📌
              </button>
            )}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(memory);
                }}
                className="p-1.5 rounded-lg bg-white/90 hover:bg-white transition-colors"
                title="Edit"
              >
                ✏
              </button>
            )}
            {onDuplicate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(memory);
                }}
                className="p-1.5 rounded-lg bg-white/90 hover:bg-white transition-colors"
                title="Duplicate"
              >
                📋
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(memory);
                }}
                className="p-1.5 rounded-lg bg-white/90 hover:bg-red-100 text-red-600 transition-colors"
                title="Delete"
              >
                🗑
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryCard;
