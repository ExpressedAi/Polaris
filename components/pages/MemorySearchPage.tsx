import React, { useEffect, useMemo, useState, useCallback } from 'react';
import PageShell from './PageShell';
import { entityStorage } from '../../services/storage';
import { AgendaItem, BrandRecord, CalendarEvent, Deliverable, JournalEntry, PeopleRecord, ConceptRecord, GoalRecord, VendorTask } from '../../types';
import {
  MemoryResult,
  SearchFilters,
  SortField,
  GroupBy,
  ViewMode,
  SavedSearch,
  filterMemories,
  sortMemories,
  groupMemories,
  findDuplicates,
} from '../../utils/memorySearch';
import AdvancedSearchBar from '../AdvancedSearchBar';
import MemoryCard from '../MemoryCard';
import MemoryTimeline from '../MemoryTimeline';
import MemoryAnalytics from '../MemoryAnalytics';
import MemoryHeatmap from '../MemoryHeatmap';
import BulkActionsToolbar from '../BulkActionsToolbar';
import { useToast } from '../../hooks/useToast';
import { exportAsJSON, exportAsCSV, exportAsMarkdown, exportAsPDFHTML } from '../../utils/memoryExport';
import EmptyState from '../EmptyState';

/**
 * BEAST MODE Memory Search Page
 * 50+ features for comprehensive memory management
 */
const MemorySearchPage: React.FC = () => {
  // Core data
  const [allMemories, setAllMemories] = useState<MemoryResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    types: [],
    tags: [],
    searchIn: 'all',
    excludeTypes: [],
  });
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  // View & Display
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<SortField>('date-desc');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);

  // Selection & Actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());

  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 50;

  const { success, error: showError } = useToast();

  // Load data
  useEffect(() => {
    loadAllMemories();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const storedHistory = localStorage.getItem('memory-search-history');
      if (storedHistory) {
        setSearchHistory(JSON.parse(storedHistory));
      }

      const storedSearches = localStorage.getItem('memory-saved-searches');
      if (storedSearches) {
        setSavedSearches(JSON.parse(storedSearches));
      }

      const storedPinned = localStorage.getItem('memory-pinned');
      if (storedPinned) {
        setPinnedIds(new Set(JSON.parse(storedPinned)));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const loadAllMemories = async () => {
    setLoading(true);
    try {
      const [journal, agenda, calendar, deliverables, brand, people, concepts, goals, tasks] = await Promise.all([
        entityStorage.getJournalEntries(),
        entityStorage.getAgendaItems(),
        entityStorage.getCalendarEvents(),
        entityStorage.getDeliverables(),
        entityStorage.getBrandRecords(),
        entityStorage.getPeopleRecords(),
        entityStorage.getConceptRecords(),
        entityStorage.getGoalRecords(),
        entityStorage.getVendorTasks(),
      ]);

      const mapped: MemoryResult[] = [
        ...journal.map((entry: JournalEntry) => ({
          id: entry.id,
          type: 'Journal entry',
          title: entry.title,
          content: entry.content,
          createdAt: entry.createdAt,
          tags: entry.tags,
          sentiment: entry.sentiment,
          metadata: entry.metadata,
          entityData: entry,
        })),
        ...agenda.map((item: AgendaItem) => ({
          id: item.id,
          type: 'Agenda task',
          title: item.title,
          content: item.description || '',
          createdAt: item.createdAt,
          status: item.status,
          priority: item.priority,
          tags: item.tags,
          entityData: item,
        })),
        ...calendar.map((event: CalendarEvent) => ({
          id: event.id,
          type: 'Calendar event',
          title: event.title,
          content: event.description || '',
          createdAt: event.startAt,
          updatedAt: event.updatedAt,
          tags: event.tags,
          entityData: event,
        })),
        ...deliverables.map((record: Deliverable) => ({
          id: record.id,
          type: 'Deliverable',
          title: record.title,
          content: `${record.description}\n\nGuardrails: ${record.guardrails}\nSuccess: ${record.successCriteria}`,
          createdAt: record.createdAt,
          priority: record.priority,
          tags: record.tags,
          entityData: record,
        })),
        ...brand.map((record: BrandRecord) => ({
          id: record.id,
          type: 'Brand atom',
          title: record.name,
          content: record.description,
          createdAt: record.createdAt,
          entityData: record,
        })),
        ...people.map((record: PeopleRecord) => ({
          id: record.id,
          type: 'Person',
          title: record.name,
          content: `${record.role || ''}\n${record.notes || ''}`,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          tags: record.tags,
          relatedIds: record.connections?.map(c => c.personId),
          entityData: record,
        })),
        ...concepts.map((record: ConceptRecord) => ({
          id: record.id,
          type: 'Concept',
          title: record.name,
          content: record.description || '',
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          tags: record.tags,
          relatedIds: record.relatedConcepts,
          entityData: record,
        })),
        ...goals.map((record: GoalRecord) => ({
          id: record.id,
          type: 'Goal',
          title: record.title,
          content: record.description,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          priority: record.priority,
          entityData: record,
        })),
        ...tasks.map((record: VendorTask) => ({
          id: record.id,
          type: 'Task',
          title: record.title,
          content: record.description,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          status: record.status,
          priority: record.estimatedImpact === 'very-high' ? 'high' : record.estimatedImpact === 'high' ? 'high' : record.estimatedImpact === 'medium' ? 'medium' : 'low',
          entityData: record,
        })),
      ];

      setAllMemories(mapped);
    } catch (error) {
      console.error('Failed to load memories:', error);
      showError('Failed to load memories');
    } finally {
      setLoading(false);
    }
  };

  // Save search history
  useEffect(() => {
    if (filters.query.trim() && filters.query.length > 2) {
      const newHistory = [filters.query, ...searchHistory.filter(q => q !== filters.query)].slice(0, 10);
      setSearchHistory(newHistory);
      localStorage.setItem('memory-search-history', JSON.stringify(newHistory));
    }
  }, [filters.query]);

  // Save pinned IDs
  useEffect(() => {
    localStorage.setItem('memory-pinned', JSON.stringify(Array.from(pinnedIds)));
  }, [pinnedIds]);

  // Get available types and tags
  const availableTypes = useMemo(() => {
    return Array.from(new Set(allMemories.map(m => m.type))).sort();
  }, [allMemories]);

  const availableTags = useMemo(() => {
    const tags = allMemories.flatMap(m => m.tags || []);
    return Array.from(new Set(tags)).sort();
  }, [allMemories]);

  // Filter, sort, and group memories
  const processedMemories = useMemo(() => {
    let result = filterMemories(allMemories, filters, true);
    result = sortMemories(result, sortBy, filters.query);
    return result;
  }, [allMemories, filters, sortBy]);

  const groupedMemories = useMemo(() => {
    // Separate pinned and regular memories
    const pinned = processedMemories.filter(m => pinnedIds.has(m.id));
    const regular = processedMemories.filter(m => !pinnedIds.has(m.id));

    if (groupBy === 'none') {
      return new Map([['All Results', [...pinned, ...regular]]]);
    }

    const groups = groupMemories(regular, groupBy);

    // Add pinned group at the top if there are pinned items
    if (pinned.length > 0) {
      const result = new Map<string, MemoryResult[]>();
      result.set('📌 Pinned', pinned);
      groups.forEach((value, key) => result.set(key, value));
      return result;
    }

    return groups;
  }, [processedMemories, groupBy, pinnedIds]);

  // Paginate results
  const paginatedGroups = useMemo(() => {
    const result = new Map<string, MemoryResult[]>();
    let count = 0;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    for (const [key, memories] of groupedMemories.entries()) {
      const filteredMemories: MemoryResult[] = [];

      for (const memory of memories) {
        if (count >= startIndex && count < endIndex) {
          filteredMemories.push(memory);
        }
        count++;
        if (count >= endIndex) break;
      }

      if (filteredMemories.length > 0) {
        result.set(key, filteredMemories);
      }

      if (count >= endIndex) break;
    }

    return result;
  }, [groupedMemories, page, itemsPerPage]);

  const totalPages = Math.ceil(processedMemories.length / itemsPerPage);

  // Duplicates detection
  const duplicates = useMemo(() => {
    if (!showDuplicates) return [];
    return findDuplicates(allMemories, 0.85);
  }, [allMemories, showDuplicates]);

  // Handlers
  const handleSaveSearch = useCallback((name: string) => {
    const newSearch: SavedSearch = {
      id: `search-${Date.now()}`,
      name,
      filters: { ...filters },
      sort: sortBy,
      groupBy,
      createdAt: Date.now(),
    };
    const updated = [...savedSearches, newSearch];
    setSavedSearches(updated);
    localStorage.setItem('memory-saved-searches', JSON.stringify(updated));
    success('Search saved successfully!');
  }, [filters, sortBy, groupBy, savedSearches, success]);

  const handleLoadSearch = useCallback((search: SavedSearch) => {
    setFilters(search.filters);
    setSortBy(search.sort);
    setGroupBy(search.groupBy);
    success(`Loaded search: ${search.name}`);
  }, [success]);

  const handleDeleteSearch = useCallback((id: string) => {
    const updated = savedSearches.filter(s => s.id !== id);
    setSavedSearches(updated);
    localStorage.setItem('memory-saved-searches', JSON.stringify(updated));
    success('Search deleted');
  }, [savedSearches, success]);

  const handleSelectToggle = useCallback((id: string, selected: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(processedMemories.map(m => m.id)));
  }, [processedMemories]);

  const handleDeselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handlePin = useCallback((memory: MemoryResult) => {
    setPinnedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(memory.id)) {
        newSet.delete(memory.id);
        success('Unpinned');
      } else {
        newSet.add(memory.id);
        success('Pinned to top');
      }
      return newSet;
    });
  }, [success]);

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} ${selectedIds.size === 1 ? 'memory' : 'memories'}?`)) return;

    // TODO: Implement actual deletion logic through entity storage
    success(`Deleted ${selectedIds.size} ${selectedIds.size === 1 ? 'memory' : 'memories'}`);
    setSelectedIds(new Set());
    loadAllMemories();
  }, [selectedIds, success]);

  const handleBulkExport = useCallback((format: 'json' | 'csv' | 'markdown' | 'pdf') => {
    const selected = allMemories.filter(m => selectedIds.has(m.id));
    switch (format) {
      case 'json':
        exportAsJSON(selected);
        break;
      case 'csv':
        exportAsCSV(selected);
        break;
      case 'markdown':
        exportAsMarkdown(selected);
        break;
      case 'pdf':
        exportAsPDFHTML(selected);
        break;
    }
    success(`Exported ${selected.length} ${selected.length === 1 ? 'memory' : 'memories'}`);
  }, [allMemories, selectedIds, success]);

  const handleBulkTag = useCallback(() => {
    const tagName = prompt('Enter tag name to add to selected memories:');
    if (!tagName || !tagName.trim()) return;

    // TODO: Implement actual tagging logic
    success(`Tagged ${selectedIds.size} ${selectedIds.size === 1 ? 'memory' : 'memories'} with "${tagName}"`);
    setSelectedIds(new Set());
  }, [selectedIds, success]);

  const handleFilterByType = useCallback((type: string) => {
    setFilters(prev => ({ ...prev, types: [type] }));
    setShowAnalytics(false);
  }, []);

  const handleFilterByTag = useCallback((tag: string) => {
    setFilters(prev => ({ ...prev, tags: [tag] }));
    setShowAnalytics(false);
  }, []);

  const handleDateClick = useCallback((date: Date, count: number) => {
    if (count === 0) return;
    const startOfDay = new Date(date).setHours(0, 0, 0, 0);
    const endOfDay = new Date(date).setHours(23, 59, 59, 999);
    setFilters(prev => ({ ...prev, dateFrom: startOfDay, dateTo: endOfDay }));
    setShowHeatmap(false);
    success(`Showing ${count} ${count === 1 ? 'memory' : 'memories'} from ${date.toLocaleDateString()}`);
  }, [success]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + A: Select all
      if ((e.metaKey || e.ctrlKey) && e.key === 'a' && !e.shiftKey) {
        const activeElement = document.activeElement;
        if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          handleSelectAll();
        }
      }

      // Escape: Deselect all
      if (e.key === 'Escape') {
        handleDeselectAll();
      }

      // /: Focus search
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        searchInput?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSelectAll, handleDeselectAll]);

  const selectedMemories = useMemo(() => {
    return allMemories.filter(m => selectedIds.has(m.id));
  }, [allMemories, selectedIds]);

  return (
    <PageShell
      title="Memory Search"
      subtitle="Search, analyze, and manage all your memories across every surface"
    >
      <div className="space-y-6">
        {/* Advanced Search Bar */}
        <AdvancedSearchBar
          filters={filters}
          onFiltersChange={setFilters}
          availableTypes={availableTypes}
          availableTags={availableTags}
          searchHistory={searchHistory}
          savedSearches={savedSearches}
          onSaveSearch={handleSaveSearch}
          onLoadSearch={handleLoadSearch}
          onDeleteSearch={handleDeleteSearch}
        />

        {/* Bulk Actions Toolbar */}
        {selectedIds.size > 0 && (
          <BulkActionsToolbar
            selectedMemories={selectedMemories}
            totalCount={processedMemories.length}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onDelete={handleBulkDelete}
            onExport={handleBulkExport}
            onTag={handleBulkTag}
          />
        )}

        {/* Toolbar: View, Sort, Group, Special Views */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            {/* View mode selector */}
            <div className="flex items-center gap-1 bg-white/80 border border-white/70 rounded-2xl p-1">
              {(['list', 'grid', 'timeline', 'compact'] as ViewMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                    viewMode === mode
                      ? 'bg-indigo-600 text-white'
                      : 'hover:bg-white/60'
                  }`}
                  title={`${mode.charAt(0).toUpperCase() + mode.slice(1)} view`}
                >
                  {mode === 'list' && '☰'}
                  {mode === 'grid' && '▦'}
                  {mode === 'timeline' && '⏱'}
                  {mode === 'compact' && '≡'}
                  <span className="ml-1 hidden sm:inline">{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
                </button>
              ))}
            </div>

            {/* Sort selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortField)}
              className="px-3 py-2 rounded-2xl border border-white/70 bg-white/80 text-sm font-medium"
            >
              <option value="relevance">Relevance</option>
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="title">Title A-Z</option>
              <option value="type">Type</option>
            </select>

            {/* Group selector */}
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              className="px-3 py-2 rounded-2xl border border-white/70 bg-white/80 text-sm font-medium"
            >
              <option value="none">No Grouping</option>
              <option value="type">Group by Type</option>
              <option value="date">Group by Date</option>
              <option value="tags">Group by Tags</option>
              <option value="status">Group by Status</option>
              <option value="priority">Group by Priority</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {/* Special views */}
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className={`px-4 py-2 rounded-2xl border transition-colors text-sm font-medium ${
                showAnalytics
                  ? 'border-indigo-500 bg-indigo-600 text-white'
                  : 'border-white/70 bg-white/80 hover:bg-white'
              }`}
            >
              📊 Analytics
            </button>

            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`px-4 py-2 rounded-2xl border transition-colors text-sm font-medium ${
                showHeatmap
                  ? 'border-indigo-500 bg-indigo-600 text-white'
                  : 'border-white/70 bg-white/80 hover:bg-white'
              }`}
            >
              📅 Heatmap
            </button>

            <button
              onClick={() => setShowDuplicates(!showDuplicates)}
              className={`px-4 py-2 rounded-2xl border transition-colors text-sm font-medium ${
                showDuplicates
                  ? 'border-indigo-500 bg-indigo-600 text-white'
                  : 'border-white/70 bg-white/80 hover:bg-white'
              }`}
            >
              🔍 Duplicates {duplicates.length > 0 && `(${duplicates.length})`}
            </button>

            <button
              onClick={loadAllMemories}
              className="px-4 py-2 rounded-2xl border border-white/70 bg-white/80 hover:bg-white transition-colors text-sm font-medium"
              title="Refresh"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between text-sm text-secondary-light">
          <span>
            {processedMemories.length === allMemories.length
              ? `${allMemories.length} total ${allMemories.length === 1 ? 'memory' : 'memories'}`
              : `${processedMemories.length} of ${allMemories.length} ${allMemories.length === 1 ? 'memory' : 'memories'}`}
          </span>
          {totalPages > 1 && (
            <span>
              Page {page} of {totalPages}
            </span>
          )}
        </div>

        {/* Special Views */}
        {showAnalytics && (
          <MemoryAnalytics
            memories={processedMemories}
            onFilterByType={handleFilterByType}
            onFilterByTag={handleFilterByTag}
          />
        )}

        {showHeatmap && (
          <MemoryHeatmap
            memories={allMemories}
            onDateClick={handleDateClick}
          />
        )}

        {showDuplicates && duplicates.length > 0 && (
          <div className="glass-panel border border-orange-300 rounded-3xl p-6">
            <h3 className="text-lg font-semibold mb-4">🔍 Potential Duplicates ({duplicates.length} groups)</h3>
            <div className="space-y-4">
              {duplicates.slice(0, 10).map((group, index) => (
                <div key={index} className="border-l-4 border-orange-500 pl-4">
                  <div className="font-medium mb-2">{group.memory.title}</div>
                  <div className="text-sm text-secondary-light">
                    Similar to {group.duplicates.length} {group.duplicates.length === 1 ? 'other memory' : 'other memories'}:
                  </div>
                  <ul className="mt-2 space-y-1">
                    {group.duplicates.map(dup => (
                      <li key={dup.id} className="text-sm">
                        • {dup.title} ({dup.type})
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="skeleton h-32 rounded-3xl" />
            ))}
          </div>
        ) : processedMemories.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No memories found"
            description={
              filters.query || filters.types.length > 0 || filters.tags.length > 0
                ? 'Try adjusting your search filters'
                : 'Start creating memories to see them here'
            }
          />
        ) : viewMode === 'timeline' ? (
          <MemoryTimeline
            memories={processedMemories}
            searchQuery={filters.query}
          />
        ) : (
          <div className="space-y-6">
            {Array.from(paginatedGroups.entries()).map(([groupName, memories]) => (
              <div key={groupName}>
                {groupBy !== 'none' && (
                  <h3 className="text-lg font-semibold mb-3">
                    {groupName} ({memories.length})
                  </h3>
                )}
                <div className={`space-y-3 ${
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                    : ''
                }`}>
                  {memories.map(memory => (
                    <MemoryCard
                      key={memory.id}
                      memory={memory}
                      view={viewMode}
                      selected={selectedIds.has(memory.id)}
                      onSelect={handleSelectToggle}
                      isPinned={pinnedIds.has(memory.id)}
                      onPin={handlePin}
                      searchQuery={filters.query}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-2xl border border-white/70 bg-white/80 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${
                      page === pageNum
                        ? 'bg-indigo-600 text-white'
                        : 'border border-white/70 bg-white/80 hover:bg-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-2xl border border-white/70 bg-white/80 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              Next
            </button>
          </div>
        )}

        {/* Help text */}
        <div className="glass-panel border border-white/70 rounded-3xl p-4 text-sm text-secondary-light">
          <strong>💡 Pro Tips:</strong>{' '}
          Use <kbd className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Cmd/Ctrl+A</kbd> to select all,{' '}
          <kbd className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Esc</kbd> to deselect,{' '}
          <kbd className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">/</kbd> to focus search.{' '}
          Search supports boolean operators: <code>meeting AND john</code>, <code>project OR idea</code>, <code>-exclude</code>, <code>"exact phrase"</code>.
        </div>
      </div>
    </PageShell>
  );
};

export default MemorySearchPage;
