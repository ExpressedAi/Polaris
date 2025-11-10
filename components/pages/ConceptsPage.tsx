import React, { useEffect, useState, useCallback, useMemo } from 'react';
import PageShell from './PageShell';
import { ConceptRecord } from '../../types';
import { entityStorage } from '../../services/storage';
import MarkdownBlock from '../MarkdownBlock';
import { subscribeToEntityUpdates } from '../../services/entityEvents';
import { useAppContext } from '../../context/AppContext';
import {
  Lightbulb,
  Search,
  Edit2,
  Trash2,
  Tag,
  X,
  Filter,
  Brain,
  Zap,
  Target,
  BarChart3,
} from 'lucide-react';

const ConceptsPage: React.FC = () => {
  const { setEntityDetailView, setActiveEntity } = useAppContext();
  const [concepts, setConcepts] = useState<ConceptRecord[]>([]);
  const [editingConcept, setEditingConcept] = useState<ConceptRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [conceptEditForm, setConceptEditForm] = useState({
    name: '',
    description: '',
    category: '',
    tags: '',
    notes: '',
  });

  const load = useCallback(async () => {
    const data = await entityStorage.getConceptRecords();
    setConcepts(data.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt)));
  }, []);

  useEffect(() => {
    load();
    const unsubscribe = subscribeToEntityUpdates('concept', load);
    return unsubscribe;
  }, [load]);

  const filteredConcepts = useMemo(() => {
    let filtered = concepts;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query) ||
        c.category?.toLowerCase().includes(query) ||
        c.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    if (selectedCategory) {
      filtered = filtered.filter(c => c.category === selectedCategory);
    }
    if (selectedTag) {
      filtered = filtered.filter(c => c.tags?.includes(selectedTag));
    }
    return filtered;
  }, [concepts, searchQuery, selectedCategory, selectedTag]);

  const stats = useMemo(() => {
    const total = concepts.length;
    const categories = new Set(concepts.map(c => c.category).filter(Boolean));
    const allTags = concepts.flatMap(c => c.tags || []);
    const uniqueTags = new Set(allTags);
    const recent = concepts.filter(c => {
      const daysSince = (Date.now() - c.createdAt) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    }).length;

    return {
      total,
      categories: categories.size,
      uniqueTags: uniqueTags.size,
      recent,
    };
  }, [concepts]);

  const categories = useMemo(() => {
    const cats = new Set(concepts.map(c => c.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [concepts]);

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    concepts.forEach(c => {
      c.tags?.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [concepts]);


  const startEdit = (concept: ConceptRecord) => {
    setEditingConcept(concept);
    setConceptEditForm({
      name: concept.name,
      description: concept.description || '',
      category: concept.category || '',
      tags: concept.tags?.join(', ') || '',
      notes: concept.notes || '',
    });
  };

  const saveEdit = async () => {
    if (!editingConcept) return;
    await entityStorage.saveConceptRecord({
      ...editingConcept,
      ...conceptEditForm,
      tags: conceptEditForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      updatedAt: Date.now(),
    });
    setEditingConcept(null);
    setConceptEditForm({
      name: '',
      description: '',
      category: '',
      tags: '',
      notes: '',
    });
    load();
  };

  const deleteConcept = async (id: string) => {
    await entityStorage.deleteConceptRecord(id);
    load();
  };

  return (
    <PageShell
      title="Concepts"
      subtitle="Ideas, applications, technologies, and concepts. Track your thinking and innovations."
    >
      {/* Stats Dashboard */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-purple-50 to-purple-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <Lightbulb className="w-6 h-6 text-purple-600" />
            <span className="text-2xl font-bold text-black">{stats.total}</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">Total Concepts</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-blue-50 to-blue-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-6 h-6 text-blue-600" />
            <span className="text-2xl font-bold text-black">{stats.categories}</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">Categories</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-green-50 to-green-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <Tag className="w-6 h-6 text-green-600" />
            <span className="text-2xl font-bold text-black">{stats.uniqueTags}</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">Unique Tags</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-orange-50 to-orange-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <Zap className="w-6 h-6 text-orange-600" />
            <span className="text-2xl font-bold text-black">{stats.recent}</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">This Week</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 space-y-4">
        <div className="glass-panel rounded-2xl border border-white/70 p-4">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-secondary-light" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search concepts..."
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

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-secondary-light flex items-center gap-1">
            <Filter className="w-4 h-4" />
            Filter:
          </span>
          <button
            onClick={() => {
              setSelectedCategory(null);
              setSelectedTag(null);
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              selectedCategory === null && selectedTag === null
                ? 'bg-black text-white'
                : 'bg-white/80 border border-white/70 hover:bg-white'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                selectedCategory === cat
                  ? 'bg-black text-white'
                  : 'bg-white/80 border border-white/70 hover:bg-white'
              }`}
            >
              {cat}
            </button>
          ))}
          {tagCounts.length > 0 && (
            <>
              <span className="text-xs text-secondary-light mx-2">|</span>
              <span className="text-xs text-secondary-light">Tags:</span>
              {tagCounts.slice(0, 5).map(([tag, count]) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    selectedTag === tag
                      ? 'bg-black text-white'
                      : 'bg-white/80 border border-white/70 hover:bg-white'
                  }`}
                >
                  #{tag} ({count})
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Concepts List */}
      {filteredConcepts.length === 0 ? (
        <div className="glass-panel rounded-3xl border border-white/70 p-12 text-center">
          <div className="flex justify-center mb-4">
            <Lightbulb className="w-16 h-16 text-secondary-light" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {concepts.length === 0 ? 'No concepts yet' : 'No matches found'}
          </h3>
          <p className="text-secondary-light">
            {concepts.length === 0
              ? "Concepts are created through conversation with Sylvia. Talk to her about ideas, applications, technologies, and concepts, and she'll add them here."
              : 'Try adjusting your search or filters.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 min-w-0">
          {filteredConcepts.map(concept => {
            const isEditing = editingConcept?.id === concept.id;

            return (
              <div
                key={concept.id}
                onClick={(e) => {
                  // Don't navigate if clicking edit/delete buttons
                  if ((e.target as HTMLElement).closest('button')) return;
                  if (!isEditing) {
                    setEntityDetailView({ type: 'concept', id: concept.id });
                    setActiveEntity({ type: 'concept', id: concept.id, data: concept });
                  }
                }}
                className={`rounded-3xl border p-6 transition-all flex flex-col min-w-0 ${
                  isEditing
                    ? 'border-black bg-black text-white shadow-xl'
                    : 'border-white/70 bg-white/90 hover:shadow-xl hover:border-purple-200 hover:bg-white cursor-pointer'
                }`}
                style={{ minHeight: '280px' }}
              >
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                        Name *
                      </label>
                      <input
                        value={conceptEditForm.name}
                        onChange={(e) => setConceptEditForm({ ...conceptEditForm, name: e.target.value })}
                        className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                        Description
                      </label>
                      <textarea
                        value={conceptEditForm.description}
                        onChange={(e) => setConceptEditForm({ ...conceptEditForm, description: e.target.value })}
                        rows={3}
                        className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                          Category
                        </label>
                        <input
                          value={conceptEditForm.category}
                          onChange={(e) => setConceptEditForm({ ...conceptEditForm, category: e.target.value })}
                          className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                          Tags
                        </label>
                        <input
                          value={conceptEditForm.tags}
                          onChange={(e) => setConceptEditForm({ ...conceptEditForm, tags: e.target.value })}
                          placeholder="tag1, tag2"
                          className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                        Notes
                      </label>
                      <textarea
                        value={conceptEditForm.notes}
                        onChange={(e) => setConceptEditForm({ ...conceptEditForm, notes: e.target.value })}
                        rows={2}
                        className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
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
                        onClick={() => {
                          setEditingConcept(null);
                          setConceptEditForm({
                            name: '',
                            description: '',
                            category: '',
                            tags: '',
                            notes: '',
                          });
                        }}
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {concept.category && (
                            <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                              {concept.category}
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-primary-light break-words overflow-wrap-anywhere">{concept.name}</h3>
                      </div>
                    </div>

                    {/* Description - Properly styled markdown panel */}
                    {concept.description && (
                      <div className="mb-4 flex-1 min-h-0">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-50/80 to-white/80 border border-gray-200/50 min-w-0">
                          <div className="concept-description min-w-0">
                            <MarkdownBlock content={concept.description} className="text-sm text-gray-700 leading-relaxed break-words overflow-wrap-anywhere" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {concept.tags && concept.tags.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-1.5">
                        {concept.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100 flex items-center gap-1.5"
                          >
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Notes */}
                    {concept.notes && (
                      <div className="mb-4 p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                        <MarkdownBlock content={concept.notes} className="text-xs text-gray-600 leading-relaxed" />
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="mb-4 pt-3 border-t border-gray-200/50">
                      <div className="flex items-center gap-4 text-xs text-secondary-light">
                        <span>Created {new Date(concept.createdAt).toLocaleDateString()}</span>
                        {concept.updatedAt && concept.updatedAt !== concept.createdAt && (
                          <span>Updated {new Date(concept.updatedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-white/20">
                      <button
                        onClick={() => startEdit(concept)}
                        className="px-3 py-1.5 rounded-full bg-white/80 border border-white/70 text-xs font-medium hover:bg-white transition flex items-center gap-1.5"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => deleteConcept(concept.id)}
                        className="px-3 py-1.5 rounded-full bg-white/80 border border-white/70 text-xs font-medium hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
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

export default ConceptsPage;

