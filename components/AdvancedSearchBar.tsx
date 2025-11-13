import React, { useState, useRef, useEffect } from 'react';
import { SearchFilters, SavedSearch } from '../utils/memorySearch';

interface AdvancedSearchBarProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  availableTypes: string[];
  availableTags: string[];
  searchHistory: string[];
  savedSearches: SavedSearch[];
  onSaveSearch: (name: string) => void;
  onLoadSearch: (search: SavedSearch) => void;
  onDeleteSearch: (id: string) => void;
}

/**
 * Advanced search bar with filters, boolean operators, date ranges, saved searches
 */
const AdvancedSearchBar: React.FC<AdvancedSearchBarProps> = ({
  filters,
  onFiltersChange,
  availableTypes,
  availableTags,
  searchHistory,
  savedSearches,
  onSaveSearch,
  onLoadSearch,
  onDeleteSearch,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const activeFilterCount = [
    filters.types.length > 0,
    filters.tags.length > 0,
    filters.dateFrom !== undefined,
    filters.dateTo !== undefined,
    filters.excludeTypes && filters.excludeTypes.length > 0,
    filters.searchIn !== 'all',
    filters.status && filters.status.length > 0,
    filters.priority && filters.priority.length > 0,
  ].filter(Boolean).length;

  const handleQueryChange = (value: string) => {
    onFiltersChange({ ...filters, query: value });
  };

  const handleTypeToggle = (type: string) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type];
    onFiltersChange({ ...filters, types: newTypes });
  };

  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    onFiltersChange({ ...filters, tags: newTags });
  };

  const handleDateFromChange = (value: string) => {
    const timestamp = value ? new Date(value).getTime() : undefined;
    onFiltersChange({ ...filters, dateFrom: timestamp });
  };

  const handleDateToChange = (value: string) => {
    const timestamp = value ? new Date(value).getTime() : undefined;
    onFiltersChange({ ...filters, dateTo: timestamp });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      query: '',
      types: [],
      tags: [],
      searchIn: 'all',
      excludeTypes: [],
    });
  };

  const handleSaveSearch = () => {
    if (saveSearchName.trim()) {
      onSaveSearch(saveSearchName.trim());
      setSaveSearchName('');
      setShowSaveDialog(false);
    }
  };

  const quickDateRanges = [
    { label: 'Today', getValue: () => ({ from: new Date().setHours(0, 0, 0, 0), to: Date.now() }) },
    {
      label: 'Last 7 days',
      getValue: () => ({ from: Date.now() - 7 * 24 * 60 * 60 * 1000, to: Date.now() }),
    },
    {
      label: 'Last 30 days',
      getValue: () => ({ from: Date.now() - 30 * 24 * 60 * 60 * 1000, to: Date.now() }),
    },
    {
      label: 'Last 90 days',
      getValue: () => ({ from: Date.now() - 90 * 24 * 60 * 60 * 1000, to: Date.now() }),
    },
  ];

  return (
    <div className="space-y-3">
      {/* Main search bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={filters.query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => setShowHistory(true)}
            onBlur={() => setTimeout(() => setShowHistory(false), 200)}
            placeholder='Search memories... (Try: "meeting AND john", "project OR idea", -exclude)'
            className="w-full rounded-2xl border border-white/70 px-4 py-3 bg-white/80 pr-24 text-sm"
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {filters.query && (
              <button
                onClick={() => handleQueryChange('')}
                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Clear search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1.5 rounded-lg transition-colors ${
                showFilters || activeFilterCount > 0
                  ? 'bg-indigo-600 text-white'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              title="Advanced filters"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Search history dropdown */}
          {showHistory && searchHistory.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg z-50 max-h-48 overflow-y-auto">
              <div className="p-2">
                <div className="text-xs uppercase tracking-wider text-gray-500 px-2 py-1">
                  Recent Searches
                </div>
                {searchHistory.slice(0, 5).map((query, i) => (
                  <button
                    key={i}
                    onClick={() => handleQueryChange(query)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowSavedSearches(!showSavedSearches)}
          className="px-4 py-3 rounded-2xl border border-white/70 bg-white/80 hover:bg-white transition-colors text-sm font-medium"
          title="Saved searches"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </button>

        <button
          onClick={() => setShowSaveDialog(true)}
          className="px-4 py-3 rounded-2xl border border-white/70 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-sm font-medium"
          title="Save current search"
        >
          Save
        </button>
      </div>

      {/* Active filters display */}
      {(filters.types.length > 0 || filters.tags.length > 0 || filters.dateFrom || filters.dateTo) && (
        <div className="flex flex-wrap items-center gap-2">
          {filters.types.map(type => (
            <span
              key={type}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-sm"
            >
              Type: {type}
              <button
                onClick={() => handleTypeToggle(type)}
                className="hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-full p-0.5"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          {filters.tags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-sm"
            >
              Tag: {tag}
              <button
                onClick={() => handleTagToggle(tag)}
                className="hover:bg-emerald-200 dark:hover:bg-emerald-800 rounded-full p-0.5"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          {(filters.dateFrom || filters.dateTo) && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-sm">
              Date range
              <button
                onClick={() => onFiltersChange({ ...filters, dateFrom: undefined, dateTo: undefined })}
                className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          <button
            onClick={handleClearFilters}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Advanced filters panel */}
      {showFilters && (
        <div className="glass-panel border border-white/70 rounded-3xl p-6 space-y-6 animate-fade-in">
          {/* Search in dropdown */}
          <div>
            <label className="block text-sm font-medium mb-2">Search In</label>
            <select
              value={filters.searchIn}
              onChange={(e) => onFiltersChange({ ...filters, searchIn: e.target.value as any })}
              className="w-full rounded-2xl border border-white/70 px-4 py-2 bg-white/80 text-sm"
            >
              <option value="all">All fields</option>
              <option value="title">Title only</option>
              <option value="content">Content only</option>
            </select>
          </div>

          {/* Type filters */}
          <div>
            <label className="block text-sm font-medium mb-2">Entity Types</label>
            <div className="flex flex-wrap gap-2">
              {availableTypes.map(type => (
                <button
                  key={type}
                  onClick={() => handleTypeToggle(type)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filters.types.includes(type)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white/80 border border-white/70 hover:bg-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Tag filters */}
          {availableTags.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {availableTags.slice(0, 15).map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      filters.tags.includes(tag)
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white/80 border border-white/70 hover:bg-white'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date range */}
          <div>
            <label className="block text-sm font-medium mb-2">Date Range</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">From</label>
                <input
                  type="date"
                  value={filters.dateFrom ? new Date(filters.dateFrom).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleDateFromChange(e.target.value)}
                  className="w-full rounded-2xl border border-white/70 px-3 py-2 bg-white/80 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">To</label>
                <input
                  type="date"
                  value={filters.dateTo ? new Date(filters.dateTo).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleDateToChange(e.target.value)}
                  className="w-full rounded-2xl border border-white/70 px-3 py-2 bg-white/80 text-sm"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {quickDateRanges.map(range => (
                <button
                  key={range.label}
                  onClick={() => {
                    const { from, to } = range.getValue();
                    onFiltersChange({ ...filters, dateFrom: from, dateTo: to });
                  }}
                  className="px-3 py-1 rounded-full text-xs bg-white/80 border border-white/70 hover:bg-white transition-colors"
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Saved searches panel */}
      {showSavedSearches && savedSearches.length > 0 && (
        <div className="glass-panel border border-white/70 rounded-3xl p-4 space-y-2 animate-fade-in">
          <div className="text-sm font-medium mb-2">Saved Searches</div>
          {savedSearches.map(search => (
            <div
              key={search.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-white/60 hover:bg-white/80 transition-colors"
            >
              <button
                onClick={() => onLoadSearch(search)}
                className="flex-1 text-left font-medium text-sm"
              >
                {search.name}
              </button>
              <button
                onClick={() => onDeleteSearch(search.id)}
                className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 text-red-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Save search dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Save Search</h3>
            <input
              type="text"
              value={saveSearchName}
              onChange={(e) => setSaveSearchName(e.target.value)}
              placeholder="Enter search name..."
              className="w-full rounded-2xl border border-gray-300 dark:border-gray-600 px-4 py-3 mb-4"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && handleSaveSearch()}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setSaveSearchName('');
                }}
                className="px-4 py-2 rounded-2xl border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSearch}
                disabled={!saveSearchName.trim()}
                className="px-4 py-2 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearchBar;
