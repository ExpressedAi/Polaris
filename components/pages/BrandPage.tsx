import React, { useEffect, useState, useCallback, useMemo } from 'react';
import PageShell from './PageShell';
import { BrandRecord } from '../../types';
import { entityStorage } from '../../services/storage';
import MarkdownBlock from '../MarkdownBlock';
import { subscribeToEntityUpdates } from '../../services/entityEvents';
import { useAppContext } from '../../context/AppContext';
import { Mic, Palette, MapPin, Gem, MessageSquare, Sparkles, Search } from 'lucide-react';

type BrandCategory = 'voice' | 'visual' | 'positioning' | 'values' | 'messaging' | 'other';

const CATEGORY_CONFIG: Record<BrandCategory, { label: string; Icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string }> = {
  voice: { label: 'Voice', Icon: Mic, color: 'text-purple-700', bgColor: 'bg-purple-50' },
  visual: { label: 'Visual', Icon: Palette, color: 'text-pink-700', bgColor: 'bg-pink-50' },
  positioning: { label: 'Positioning', Icon: MapPin, color: 'text-blue-700', bgColor: 'bg-blue-50' },
  values: { label: 'Values', Icon: Gem, color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
  messaging: { label: 'Messaging', Icon: MessageSquare, color: 'text-indigo-700', bgColor: 'bg-indigo-50' },
  other: { label: 'Other', Icon: Sparkles, color: 'text-gray-700', bgColor: 'bg-gray-50' },
};

const detectCategory = (name: string, description: string): BrandCategory => {
  const text = `${name} ${description}`.toLowerCase();
  if (text.match(/\b(voice|tone|speak|say|language|words|communicate)\b/)) return 'voice';
  if (text.match(/\b(visual|design|color|font|logo|image|aesthetic|style)\b/)) return 'visual';
  if (text.match(/\b(position|positioning|market|competitor|differentiate|unique)\b/)) return 'positioning';
  if (text.match(/\b(value|values|principle|belief|ethos|mission|vision)\b/)) return 'values';
  if (text.match(/\b(message|messaging|tagline|slogan|copy|content|narrative)\b/)) return 'messaging';
  return 'other';
};

const BrandPage: React.FC = () => {
  const { setEntityDetailView, setActiveEntity } = useAppContext();
  const [records, setRecords] = useState<BrandRecord[]>([]);
  const [editingRecord, setEditingRecord] = useState<BrandRecord | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BrandCategory | 'all'>('all');

  const load = useCallback(async () => {
    const data = await entityStorage.getBrandRecords();
    setRecords(data.sort((a, b) => b.createdAt - a.createdAt));
  }, []);

  useEffect(() => {
    load();
    const unsubscribe = subscribeToEntityUpdates('brand', load);
    return unsubscribe;
  }, [load]);

  const filteredRecords = useMemo(() => {
    let filtered = records;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(record => {
        const category = detectCategory(record.name, record.description);
        return category === selectedCategory;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(record =>
        record.name.toLowerCase().includes(query) ||
        record.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [records, selectedCategory, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<BrandCategory, number> = {
      voice: 0,
      visual: 0,
      positioning: 0,
      values: 0,
      messaging: 0,
      other: 0,
    };
    records.forEach(record => {
      const category = detectCategory(record.name, record.description);
      counts[category]++;
    });
    return counts;
  }, [records]);

  const startEdit = (record: BrandRecord) => {
    setEditingRecord(record);
    setEditName(record.name);
    setEditDescription(record.description);
  };

  const saveEdit = async () => {
    if (!editingRecord) return;
    await entityStorage.saveBrandRecord({
      ...editingRecord,
      name: editName,
      description: editDescription,
    });
    setEditingRecord(null);
    setEditName('');
    setEditDescription('');
    load();
  };

  const cancelEdit = () => {
    setEditingRecord(null);
    setEditName('');
    setEditDescription('');
  };

  const deleteRecord = async (id: string) => {
    await entityStorage.deleteBrandRecord(id);
    load();
  };

  return (
    <PageShell title="Brand Systems" subtitle="Your brand DNA. Voice, visual language, positioning, and values that Sylvia references in every conversation.">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-6">
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
          const category = key as BrandCategory;
          const count = categoryCounts[category];
          return (
            <div
              key={key}
              onClick={() => setSelectedCategory(selectedCategory === category ? 'all' : category)}
              className={`rounded-2xl border p-4 cursor-pointer transition-all ${
                selectedCategory === category
                  ? 'border-black bg-black text-white shadow-lg'
                  : 'border-white/70 bg-white/80 hover:bg-white hover:shadow-md'
              }`}
            >
            <div className="flex items-center justify-between mb-2">
              <config.Icon className={`w-6 h-6 ${selectedCategory === category ? 'text-white' : config.color}`} />
              <span className={`text-2xl font-bold ${selectedCategory === category ? 'text-white' : 'text-black'}`}>
                {count}
              </span>
            </div>
              <p className={`text-xs uppercase tracking-[0.2em] ${selectedCategory === category ? 'text-white/80' : 'text-secondary-light'}`}>
                {config.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="glass-panel rounded-2xl border border-white/70 p-4">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-secondary-light" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search brand elements..."
              className="flex-1 bg-transparent outline-none text-lg placeholder:text-secondary-light"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-3 py-1 rounded-full bg-white/80 border border-white/70 text-sm hover:bg-white transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Brand Elements Grid */}
      {filteredRecords.length === 0 ? (
        <div className="glass-panel rounded-3xl border border-white/70 p-12 text-center">
          <div className="flex justify-center mb-4">
            <Palette className="w-16 h-16 text-secondary-light" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {records.length === 0 ? 'No brand elements yet' : 'No matches found'}
          </h3>
          <p className="text-secondary-light">
            {records.length === 0
              ? "Tell Sylvia about your brand voice, visual language, positioning, or values. She'll remember and reference them."
              : 'Try adjusting your search or category filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecords.map(record => {
            const category = detectCategory(record.name, record.description);
            const config = CATEGORY_CONFIG[category];
            const isEditing = editingRecord?.id === record.id;

            return (
              <div
                key={record.id}
                onClick={(e) => {
                  // Don't navigate if clicking edit/delete buttons
                  if ((e.target as HTMLElement).closest('button')) return;
                  if (!isEditing) {
                    setEntityDetailView({ type: 'brand', id: record.id });
                    setActiveEntity({ type: 'brand', id: record.id, data: record });
                  }
                }}
                className={`rounded-3xl border p-6 transition-all ${
                  isEditing
                    ? 'border-black bg-black text-white shadow-xl'
                    : 'border-white/70 bg-white/90 hover:shadow-lg hover:border-white cursor-pointer'
                }`}
              >
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                        Element Name
                      </label>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                        placeholder="Brand element name"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                        Description / Guidance
                      </label>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={6}
                        className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
                        placeholder="How should Sylvia reference this? What makes it unique?"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        className="flex-1 px-4 py-2 rounded-2xl bg-white text-black font-semibold hover:bg-gray-100 transition"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 rounded-2xl bg-white/20 text-white border border-white/30 hover:bg-white/30 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl ${config.bgColor} flex items-center justify-center`}>
                  <config.Icon className={`w-6 h-6 ${config.color}`} />
                </div>
                        <div>
                          <div className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${config.bgColor} ${config.color} mb-1`}>
                            {config.label}
                          </div>
                          <h3 className="text-xl font-bold">{record.name}</h3>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                      <MarkdownBlock content={record.description} className="text-sm leading-relaxed" />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/20">
                      <span className="text-xs text-secondary-light">
                        {new Date(record.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(record)}
                          className="px-3 py-1.5 rounded-full bg-white/80 border border-white/70 text-xs font-medium hover:bg-white transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteRecord(record.id)}
                          className="px-3 py-1.5 rounded-full bg-white/80 border border-white/70 text-xs font-medium hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
};

export default BrandPage;
