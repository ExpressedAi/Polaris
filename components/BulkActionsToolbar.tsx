import React, { useState } from 'react';
import { MemoryResult } from '../utils/memorySearch';
import { exportAsJSON, exportAsCSV, exportAsMarkdown, exportAsPDFHTML, copyToClipboard } from '../utils/memoryExport';
import { useToast } from '../hooks/useToast';

interface BulkActionsToolbarProps {
  selectedMemories: MemoryResult[];
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDelete: () => void;
  onExport: (format: 'json' | 'csv' | 'markdown' | 'pdf') => void;
  onTag: () => void;
  onArchive?: () => void;
}

/**
 * Bulk actions toolbar for selected memories
 */
const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedMemories,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onDelete,
  onExport,
  onTag,
  onArchive,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const { success, error: showError } = useToast();
  const selectedCount = selectedMemories.length;

  const handleExport = async (format: 'json' | 'csv' | 'markdown' | 'pdf') => {
    try {
      switch (format) {
        case 'json':
          exportAsJSON(selectedMemories);
          break;
        case 'csv':
          exportAsCSV(selectedMemories);
          break;
        case 'markdown':
          exportAsMarkdown(selectedMemories);
          break;
        case 'pdf':
          exportAsPDFHTML(selectedMemories);
          break;
      }
      success(`Exported ${selectedCount} ${selectedCount === 1 ? 'memory' : 'memories'} as ${format.toUpperCase()}`);
      setShowExportMenu(false);
    } catch (err) {
      showError('Failed to export memories');
    }
  };

  const handleCopy = async () => {
    const result = await copyToClipboard(selectedMemories);
    if (result) {
      success(`Copied ${selectedCount} ${selectedCount === 1 ? 'memory' : 'memories'} to clipboard`);
    } else {
      showError('Failed to copy to clipboard');
    }
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="sticky top-0 z-40 glass-panel border border-indigo-500 rounded-3xl p-4 shadow-lg animate-slide-in-down">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Selection info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
              {selectedCount}
            </div>
            <div>
              <div className="text-sm font-semibold">
                {selectedCount} {selectedCount === 1 ? 'memory' : 'memories'} selected
              </div>
              <button
                onClick={onDeselectAll}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Clear selection
              </button>
            </div>
          </div>

          {selectedCount < totalCount && (
            <button
              onClick={onSelectAll}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium px-3 py-1 rounded-full hover:bg-indigo-50 transition-colors"
            >
              Select all {totalCount}
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Export dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-4 py-2 rounded-2xl border border-white/70 bg-white/90 hover:bg-white transition-colors text-sm font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export
            </button>

            {showExportMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg z-50 overflow-hidden min-w-[180px]">
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium flex items-center gap-2"
                  >
                    <span>📄</span> Export as JSON
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium flex items-center gap-2"
                  >
                    <span>📊</span> Export as CSV
                  </button>
                  <button
                    onClick={() => handleExport('markdown')}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium flex items-center gap-2"
                  >
                    <span>📝</span> Export as Markdown
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium flex items-center gap-2"
                  >
                    <span>📑</span> Export as PDF (HTML)
                  </button>
                  <div className="border-t border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={handleCopy}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium flex items-center gap-2"
                  >
                    <span>📋</span> Copy to Clipboard
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Tag button */}
          <button
            onClick={onTag}
            className="px-4 py-2 rounded-2xl border border-white/70 bg-white/90 hover:bg-white transition-colors text-sm font-medium flex items-center gap-2"
            title="Add tags"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            Tag
          </button>

          {/* Archive button */}
          {onArchive && (
            <button
              onClick={onArchive}
              className="px-4 py-2 rounded-2xl border border-white/70 bg-white/90 hover:bg-white transition-colors text-sm font-medium flex items-center gap-2"
              title="Archive"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
              Archive
            </button>
          )}

          {/* Delete button */}
          <button
            onClick={onDelete}
            className="px-4 py-2 rounded-2xl border border-red-300 bg-red-50 hover:bg-red-100 text-red-700 transition-colors text-sm font-medium flex items-center gap-2"
            title="Delete selected"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="flex items-center gap-6 mt-3 text-xs text-gray-600 dark:text-gray-400">
        {(() => {
          const types = new Set(selectedMemories.map(m => m.type));
          const tags = new Set(selectedMemories.flatMap(m => m.tags || []));
          return (
            <>
              <span>{types.size} type{types.size !== 1 ? 's' : ''}</span>
              {tags.size > 0 && <span>{tags.size} unique tag{tags.size !== 1 ? 's' : ''}</span>}
              <span>
                Created:{' '}
                {new Date(Math.min(...selectedMemories.map(m => m.createdAt))).toLocaleDateString()}
                {' '}-{' '}
                {new Date(Math.max(...selectedMemories.map(m => m.createdAt))).toLocaleDateString()}
              </span>
            </>
          );
        })()}
      </div>
    </div>
  );
};

export default BulkActionsToolbar;
