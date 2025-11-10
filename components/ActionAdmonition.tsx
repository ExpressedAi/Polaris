import React, { useState, useEffect } from 'react';
import { X, Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import MarkdownBlock from './MarkdownBlock';
import { SylviaEvent } from '../services/sylviaLog';
import { getSetting, saveSetting } from '../services/storage';

interface Props {
  event: SylviaEvent;
  onRate: (id: string, rating: number) => void;
}

// Map event kinds to admonition types and colors
const getAdmonitionType = (kind: SylviaEvent['kind'], actionId?: string): {
  type: 'note' | 'tip' | 'info' | 'success' | 'warning';
  icon: string;
  title: string;
} => {
  if (actionId?.includes('delete')) {
    return { type: 'warning', icon: '⚠️', title: 'Action Taken' };
  }
  
  switch (kind) {
    case 'people':
      return { type: 'success', icon: '👤', title: 'Person Added' };
    case 'concept':
      return { type: 'info', icon: '💡', title: 'Concept Added' };
    case 'brand':
      return { type: 'tip', icon: '🎨', title: 'Brand Element Added' };
    case 'calendar':
      return { type: 'note', icon: '📅', title: 'Event Added' };
    case 'journal':
      return { type: 'info', icon: '📝', title: 'Journal Entry Created' };
    case 'agenda':
      return { type: 'tip', icon: '✅', title: 'Agenda Item Added' };
    case 'deliverable':
      return { type: 'success', icon: '🎯', title: 'Deliverable Created' };
    case 'goal':
      return { type: 'success', icon: '🎯', title: 'Goal Added' };
    case 'task':
      return { type: 'tip', icon: '✅', title: 'Task Created' };
    case 'pomodoro':
      return { type: 'note', icon: '🍅', title: 'Pomodoro Session' };
    default:
      return { type: 'info', icon: '⚡', title: 'Action Executed' };
  }
};

const ActionAdmonition: React.FC<Props> = ({ event, onRate }) => {
  const [isDismissed, setIsDismissed] = useState(false);

  // Load dismissed IDs from storage
  useEffect(() => {
    const loadDismissed = async () => {
      const dismissed = await getSetting('dismissedActionAdmonitions', []) as string[];
      if (dismissed.includes(event.id)) {
        setIsDismissed(true);
      }
    };
    loadDismissed();
  }, [event.id]);

  // Save dismissed ID to storage
  const handleDismiss = async () => {
    setIsDismissed(true);
    const dismissed = await getSetting('dismissedActionAdmonitions', []) as string[];
    await saveSetting('dismissedActionAdmonitions', [...dismissed, event.id]);
  };

  if (isDismissed) {
    return null;
  }

  const { type, icon, title } = getAdmonitionType(event.kind, event.actionId);
  
  // Build markdown content for the admonition
  let markdownContent = `**${title}**\n\n${event.summary}`;
  
  if (event.detail) {
    markdownContent += `\n\n${event.detail}`;
  }
  
  // Format payload nicely if present
  if (event.payload) {
    const payloadLines = event.payload.split('|').filter(Boolean);
    if (payloadLines.length > 0) {
      markdownContent += `\n\n**Details:**\n`;
      payloadLines.forEach((line, idx) => {
        if (line.trim()) {
          markdownContent += `- ${line.trim()}\n`;
        }
      });
    }
  }

  return (
    <div className={`admonition admonition-${type} relative group mt-3`}>
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-white/20"
        title="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Header with icon and title */}
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <div className="admonition-title flex items-center justify-between">
            <span>{title}</span>
            <span className="text-xs font-normal opacity-60">
              {new Date(event.timestamp).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="admonition-body">
        <MarkdownBlock content={markdownContent} />
      </div>

      {/* Rating controls */}
      <div className="mt-4 pt-4 border-t border-current/20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs opacity-70">Rate this action:</span>
          <button
            onClick={() => onRate(event.id, -1)}
            className={`p-1.5 rounded-lg transition ${
              event.rating === -1
                ? 'bg-red-500/20 text-red-700 border border-red-500/30'
                : 'hover:bg-white/20 border border-transparent'
            }`}
            title="Negative"
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => onRate(event.id, 1)}
            className={`p-1.5 rounded-lg transition ${
              event.rating === 1
                ? 'bg-green-500/20 text-green-700 border border-green-500/30'
                : 'hover:bg-white/20 border border-transparent'
            }`}
            title="Positive"
          >
            <ThumbsUp className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 opacity-60" />
          <input
            type="number"
            min="1"
            max="100"
            value={event.rating && event.rating > 1 ? event.rating : ''}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : undefined;
              if (val !== undefined && val >= 1 && val <= 100) {
                onRate(event.id, val);
              }
            }}
            placeholder="1-100"
            className="w-20 px-2 py-1 rounded-lg border border-current/20 bg-white/20 text-xs focus:outline-none focus:ring-2 focus:ring-current/30"
          />
          {event.rating && event.rating > 1 && (
            <span className="text-xs opacity-60">/100</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActionAdmonition;


