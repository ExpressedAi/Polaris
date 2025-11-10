import React from 'react';
import MarkdownBlock from './MarkdownBlock';
import { SylviaEvent } from '../services/sylviaLog';

const colorMap: Partial<Record<SylviaEvent['kind'], string>> = {
  agenda: 'bg-[#F4F8FF] border-[#C2D4FF]',
  journal: 'bg-[#FFF7F4] border-[#FFD9C2]',
  deliverable: 'bg-[#F5FFF4] border-[#C2FFD5]',
  calendar: 'bg-[#F4FFFE] border-[#C2FFF8]',
  pomodoro: 'bg-[#FFF4FB] border-[#FFCAF0]',
  brand: 'bg-white border-white/70',
  client: 'bg-white border-white/70',
  people: 'bg-white border-white/70',
  goal: 'bg-white border-white/70',
  system: 'bg-white border-white/70',
};

interface Props {
  events: SylviaEvent[];
  onRate: (id: string, rating: number) => void;
}

const SylviaEventLog: React.FC<Props> = ({ events, onRate }) => (
  <div className="space-y-3 px-5 py-4 overflow-y-auto soft-scrollbar">
    {events.length === 0 && (
      <p className="text-sm text-secondary-light">No recent actions yet.</p>
    )}
    {events.map(event => (
      <div
        key={event.id}
        className={`rounded-2xl border ${colorMap[event.kind] || 'bg-white border-white/70'} p-3 text-sm`}
      >
        <div className="flex items-center justify-between text-xs text-secondary-light mb-2">
          <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
          <span className="uppercase tracking-[0.2em]">{event.kind}</span>
        </div>
        <p className="font-semibold mb-1">{event.summary}</p>
        {event.actionId && (
          <p className="text-xs text-secondary-light mb-1">Action: <code className="bg-white/50 px-1 rounded">{event.actionId}</code></p>
        )}
        {event.detail && (
          <div className="message-content text-xs">
            <MarkdownBlock content={event.detail} />
          </div>
        )}
        {event.payload && event.payload.length > 0 && (
          <div className="mt-2 p-2 rounded-lg bg-white/50 border border-white/70">
            <p className="text-xs text-secondary-light mb-1">Payload:</p>
            <code className="text-xs break-all">{event.payload.length > 150 ? event.payload.substring(0, 150) + '...' : event.payload}</code>
          </div>
        )}
        {event.link && (
          <a
            href={event.link}
            className="text-xs text-primary underline mt-2 inline-block"
            target="_blank"
            rel="noreferrer"
          >
            View record
          </a>
        )}
        <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-white/30">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-secondary-light">Rating:</span>
            <div className="flex gap-1 flex-1">
              <button
                onClick={() => onRate(event.id, -1)}
                className={`px-3 py-1 rounded-full border text-xs ${
                  event.rating === -1 ? 'bg-red-500 text-white border-red-500' : 'bg-white text-secondary-light border-white/70 hover:bg-red-50'
                }`}
                title="Negative"
              >
                −
              </button>
              <button
                onClick={() => onRate(event.id, 1)}
                className={`px-3 py-1 rounded-full border text-xs ${
                  event.rating === 1 ? 'bg-green-500 text-white border-green-500' : 'bg-white text-secondary-light border-white/70 hover:bg-green-50'
                }`}
                title="Positive"
              >
                +
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-secondary-light">Score (1-100):</span>
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
              className="w-20 px-2 py-1 rounded-full border border-white/70 bg-white/80 text-xs"
            />
            {event.rating && event.rating > 1 && (
              <span className="text-xs text-secondary-light">{event.rating}/100</span>
            )}
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default SylviaEventLog;
