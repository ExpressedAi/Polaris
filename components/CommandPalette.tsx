import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { AppView } from '../types';

interface Command {
  id: string;
  label: string;
  description?: string;
  action: () => void;
  category: string;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, commands }) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!search.trim()) return commands;

    const lowerSearch = search.toLowerCase();
    return commands.filter((cmd) => {
      const inLabel = cmd.label.toLowerCase().includes(lowerSearch);
      const inDescription = cmd.description?.toLowerCase().includes(lowerSearch);
      const inKeywords = cmd.keywords?.some((k) => k.toLowerCase().includes(lowerSearch));
      return inLabel || inDescription || inKeywords;
    });
  }, [commands, search]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  let globalIndex = 0;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-start justify-center p-4 pt-[10vh] animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-panel rounded-3xl border-2 border-white/70 shadow-2xl w-full max-w-2xl animate-scale-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/70">
          <Search className="w-5 h-5 text-secondary-light" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent outline-none text-base placeholder-secondary-light"
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-border-light dark:hover:bg-border-dark rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Commands List */}
        <div
          ref={listRef}
          className="max-h-[60vh] overflow-y-auto invisible-scrollbar"
        >
          {Object.keys(groupedCommands).length === 0 ? (
            <div className="px-6 py-12 text-center text-secondary-light">
              No commands found
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category} className="py-2">
                <div className="px-6 py-2 text-xs uppercase tracking-wider text-secondary-light font-semibold">
                  {category}
                </div>
                {cmds.map((cmd) => {
                  const isSelected = globalIndex === selectedIndex;
                  const currentIndex = globalIndex++;

                  return (
                    <button
                      key={cmd.id}
                      onClick={() => {
                        cmd.action();
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={`w-full px-6 py-3 flex items-center justify-between gap-4 transition-colors ${
                        isSelected
                          ? 'bg-purple-50 dark:bg-purple-900/20'
                          : 'hover:bg-border-light dark:hover:bg-border-dark'
                      }`}
                    >
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium text-primary-light">
                          {cmd.label}
                        </div>
                        {cmd.description && (
                          <div className="text-xs text-secondary-light mt-0.5">
                            {cmd.description}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <ArrowRight className="w-4 h-4 text-purple-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-6 py-3 border-t border-white/70 flex items-center justify-between text-xs text-secondary-light">
          <div className="flex items-center gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
