import React, { useEffect, useMemo, useState } from 'react';
import PageShell from './PageShell';
import { entityStorage } from '../../services/storage';
import { AgendaItem, BrandRecord, CalendarEvent, Deliverable, JournalEntry, PeopleRecord } from '../../types';
import MarkdownBlock from '../MarkdownBlock';

interface MemoryResult {
  id: string;
  type: string;
  title: string;
  content: string;
  createdAt: number;
}

const MemorySearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MemoryResult[]>([]);

  useEffect(() => {
    const load = async () => {
      const [journal, agenda, calendar, deliverables, brand, people] = await Promise.all([
        entityStorage.getJournalEntries(),
        entityStorage.getAgendaItems(),
        entityStorage.getCalendarEvents(),
        entityStorage.getDeliverables(),
        entityStorage.getBrandRecords(),
        entityStorage.getPeopleRecords(),
      ]);

      const mapped: MemoryResult[] = [
        ...journal.map((entry: JournalEntry) => ({
          id: entry.id,
          type: 'Journal entry',
          title: entry.title,
          content: entry.content,
          createdAt: entry.createdAt,
        })),
        ...agenda.map((item: AgendaItem) => ({
          id: item.id,
          type: 'Agenda task',
          title: item.title,
          content: item.deliverableId ? `Deliverable: ${item.deliverableId}` : '',
          createdAt: item.createdAt,
        })),
        ...calendar.map((event: CalendarEvent) => ({
          id: event.id,
          type: 'Calendar event',
          title: event.title,
          content: event.description || '',
          createdAt: event.startAt,
        })),
        ...deliverables.map((record: Deliverable) => ({
          id: record.id,
          type: 'Deliverable',
          title: record.title,
          content: `${record.description}\n\nGuardrails: ${record.guardrails}\nSuccess: ${record.successCriteria}`,
          createdAt: record.createdAt,
        })),
        ...brand.map((record: BrandRecord) => ({
          id: record.id,
          type: 'Brand atom',
          title: record.name,
          content: record.description,
          createdAt: record.createdAt,
        })),
        ...people.map((record: PeopleRecord) => ({
          id: record.id,
          type: 'Person',
          title: record.name,
          content: `${record.role || ''}\n${record.notes || ''}`,
          createdAt: record.createdAt,
        })),
      ];

      setResults(mapped.sort((a, b) => b.createdAt - a.createdAt));
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return results;
    const term = query.toLowerCase();
    return results.filter(result =>
      result.title.toLowerCase().includes(term) ||
      result.content.toLowerCase().includes(term) ||
      result.type.toLowerCase().includes(term)
    );
  }, [query, results]);

  return (
    <PageShell title="Memory Search" subtitle="Peek into what Sylvia remembers across every surface.">
      <div className="glass-panel border border-white/70 rounded-3xl p-5 mb-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search memories..."
          className="w-full rounded-2xl border border-white/70 px-4 py-3 bg-white/80"
        />
      </div>
      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-secondary-light text-sm">No records match that term yet.</p>
        )}
        {filtered.map(result => (
          <div key={result.id} className="rounded-3xl border border-white/70 bg-white/85 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-secondary-light">
              <span className="uppercase tracking-[0.3em]">{result.type}</span>
              <span>{new Date(result.createdAt).toLocaleString()}</span>
            </div>
            <h3 className="text-lg font-semibold">{result.title || 'Untitled'}</h3>
            <MarkdownBlock content={result.content} className="text-sm" />
          </div>
        ))}
      </div>
    </PageShell>
  );
};

export default MemorySearchPage;
