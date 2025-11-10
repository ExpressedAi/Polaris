import React, { useEffect, useState, useCallback } from 'react';
import PageShell from './PageShell';
import { useAppContext, EntityDetailView } from '../../context/AppContext';
import { entityStorage } from '../../services/storage';
import { PeopleRecord, BrandRecord, ConceptRecord, JournalEntry, CalendarEvent, GoalRecord, VendorTask, AppView } from '../../types';
import MarkdownBlock from '../MarkdownBlock';
import { ArrowLeft, Edit2, Trash2, X } from 'lucide-react';

const EntityDetailPage: React.FC = () => {
  const { entityDetailView, setEntityDetailView, setActiveEntity, setActiveView } = useAppContext();
  const [entity, setEntity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit form states
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editTags, setEditTags] = useState('');

  const loadEntity = useCallback(async () => {
    if (!entityDetailView.type || !entityDetailView.id) {
      setLoading(false);
      return;
    }

    try {
      let data: any = null;
      
      switch (entityDetailView.type) {
        case 'person':
          const people = await entityStorage.getPeopleRecords();
          data = people.find(p => p.id === entityDetailView.id);
          break;
        case 'brand':
          const brands = await entityStorage.getBrandRecords();
          data = brands.find(b => b.id === entityDetailView.id);
          break;
        case 'concept':
          const concepts = await entityStorage.getConceptRecords();
          data = concepts.find(c => c.id === entityDetailView.id);
          break;
        case 'journal':
          const journals = await entityStorage.getJournalEntries();
          data = journals.find(j => j.id === entityDetailView.id);
          break;
        case 'calendar':
          const calendars = await entityStorage.getCalendarEvents();
          data = calendars.find(c => c.id === entityDetailView.id);
          break;
        case 'goal':
          const goals = await entityStorage.getGoals();
          data = goals.find(g => g.id === entityDetailView.id);
          break;
        case 'task':
          const tasks = await entityStorage.getVendorTasks();
          data = tasks.find(t => t.id === entityDetailView.id);
          break;
      }

      if (data) {
        setEntity(data);
        // Set active entity for context awareness
        setActiveEntity({ type: entityDetailView.type, id: entityDetailView.id, data });
        // Initialize edit form
        if (entityDetailView.type === 'brand') {
          setEditName(data.name);
          setEditDescription(data.description || '');
          setEditContent(data.content || '');
          setEditNotes(data.notes || '');
        } else if (entityDetailView.type === 'concept') {
          setEditName(data.name);
          setEditDescription(data.description || '');
          setEditCategory(data.category || '');
          setEditTags((data.tags || []).join(', '));
          setEditNotes(data.notes || '');
        }
      }
    } catch (error) {
      console.error('Failed to load entity:', error);
    } finally {
      setLoading(false);
    }
  }, [entityDetailView, setActiveEntity]);
  
  const handleSaveEdit = async () => {
    if (!entity) return;
    
    try {
      if (entityDetailView.type === 'brand') {
        await entityStorage.saveBrandRecord({
          ...entity,
          name: editName,
          description: editDescription,
          content: editContent,
          notes: editNotes,
          updatedAt: Date.now(),
        });
      } else if (entityDetailView.type === 'concept') {
        await entityStorage.saveConceptRecord({
          ...entity,
          name: editName,
          description: editDescription,
          category: editCategory,
          tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
          notes: editNotes,
          updatedAt: Date.now(),
        });
      }
      setIsEditing(false);
      await loadEntity(); // Reload to show updated data
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to original values
    if (entity) {
      if (entityDetailView.type === 'brand') {
        setEditName(entity.name);
        setEditDescription(entity.description || '');
        setEditContent(entity.content || '');
        setEditNotes(entity.notes || '');
      } else if (entityDetailView.type === 'concept') {
        setEditName(entity.name);
        setEditDescription(entity.description || '');
        setEditCategory(entity.category || '');
        setEditTags((entity.tags || []).join(', '));
        setEditNotes(entity.notes || '');
      }
    }
  };

  useEffect(() => {
    loadEntity();
  }, [loadEntity]);

  const handleClose = () => {
    setEntityDetailView({ type: null, id: '' });
    setActiveEntity({ type: null, id: '' });
  };

  const handleBack = () => {
    // Navigate back to the list view
    switch (entityDetailView.type) {
      case 'person':
        setActiveView(AppView.PEOPLE);
        break;
      case 'brand':
        setActiveView(AppView.BRAND);
        break;
      case 'concept':
        setActiveView(AppView.CONCEPTS);
        break;
      case 'journal':
        setActiveView(AppView.JOURNAL);
        break;
      case 'calendar':
        setActiveView(AppView.CALENDAR);
        break;
      case 'goal':
      case 'task':
        setActiveView(AppView.POLARIS);
        break;
    }
    setEntityDetailView({ type: null, id: '' });
    setActiveEntity({ type: null, id: '' });
  };

  if (loading) {
    return (
      <PageShell title="Loading...">
        <div className="flex items-center justify-center h-64">
          <p className="text-secondary-light">Loading...</p>
        </div>
      </PageShell>
    );
  }

  if (!entity) {
    return (
      <PageShell title="Not Found">
        <div className="flex items-center justify-center h-64">
          <p className="text-secondary-light">Entity not found</p>
          <button onClick={handleBack} className="ml-4 px-4 py-2 rounded-full bg-black text-white">
            Go Back
          </button>
        </div>
      </PageShell>
    );
  }

  // Render based on entity type
  if (entityDetailView.type === 'person') {
    const person = entity as PeopleRecord;
    return (
      <PageShell title={person.name} subtitle="Person Profile">
        <div className="space-y-6">
          {/* Header with back button */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-white/70 hover:bg-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to People
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 rounded-full bg-white/80 border border-white/70 hover:bg-white transition flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            </div>
          </div>

          {/* Full content - no truncation */}
          <div className="glass-panel rounded-3xl border border-white/70 p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {person.role && (
                <div>
                  <h3 className="text-xs uppercase tracking-[0.3em] text-secondary-light mb-2">Role</h3>
                  <p className="text-lg">{person.role}</p>
                </div>
              )}
              {person.company && (
                <div>
                  <h3 className="text-xs uppercase tracking-[0.3em] text-secondary-light mb-2">Company</h3>
                  <p className="text-lg">{person.company}</p>
                </div>
              )}
              {person.location && (
                <div>
                  <h3 className="text-xs uppercase tracking-[0.3em] text-secondary-light mb-2">Location</h3>
                  <p className="text-lg">{person.location}</p>
                </div>
              )}
              {person.email && (
                <div>
                  <h3 className="text-xs uppercase tracking-[0.3em] text-secondary-light mb-2">Email</h3>
                  <p className="text-lg">{person.email}</p>
                </div>
              )}
              {person.phone && (
                <div>
                  <h3 className="text-xs uppercase tracking-[0.3em] text-secondary-light mb-2">Phone</h3>
                  <p className="text-lg">{person.phone}</p>
                </div>
              )}
            </div>
            
            {person.attributes && person.attributes.length > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-[0.3em] text-secondary-light mb-2">Attributes</h3>
                <div className="flex flex-wrap gap-2">
                  {person.attributes.map(attr => (
                    <span key={attr} className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm">
                      {attr}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {person.tags && person.tags.length > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-[0.3em] text-secondary-light mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {person.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {person.profile && (
              <div>
                <h3 className="text-xs uppercase tracking-[0.3em] text-secondary-light mb-2">Profile</h3>
                <div className="prose max-w-none">
                  <MarkdownBlock content={person.profile} />
                </div>
              </div>
            )}
            
            {person.notes && (
              <div>
                <h3 className="text-xs uppercase tracking-[0.3em] text-secondary-light mb-2">Notes</h3>
                <div className="prose max-w-none">
                  <MarkdownBlock content={person.notes} />
                </div>
              </div>
            )}
            
            {person.connections && person.connections.length > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-[0.3em] text-secondary-light mb-2">Connections</h3>
                <div className="space-y-2">
                      {person.connections.map((conn, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="font-medium">{conn.relationship}</p>
                      {conn.notes && (
                        <div className="text-sm text-gray-600 mt-1">
                          <MarkdownBlock content={conn.notes} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </PageShell>
    );
  }

  if (entityDetailView.type === 'brand') {
    const brand = entity as BrandRecord;
    return (
      <PageShell title={brand.name} subtitle="Brand Element">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-white/70 hover:bg-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Brand
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 rounded-full bg-white/80 border border-white/70 hover:bg-white transition flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>
          </div>
          
          {/* Always show content */}
          <div className="glass-panel rounded-3xl border border-white/70 p-8 space-y-6">
            {brand.description && (
              <div>
                <h3 className="text-xs uppercase tracking-[0.3em] text-secondary-light mb-2">Description / Guidance</h3>
                <div className="prose max-w-none">
                  <MarkdownBlock content={brand.description} />
                </div>
              </div>
            )}
            {brand.content && (
              <div>
                <h3 className="text-xs uppercase tracking-[0.3em] text-secondary-light mb-2">Content</h3>
                <div className="prose max-w-none">
                  <MarkdownBlock content={brand.content} />
                </div>
              </div>
            )}
            {brand.notes && (
              <div>
                <h3 className="text-xs uppercase tracking-[0.3em] text-secondary-light mb-2">Notes</h3>
                <div className="prose max-w-none">
                  <MarkdownBlock content={brand.notes} />
                </div>
              </div>
            )}
            {!brand.description && !brand.content && !brand.notes && (
              <p className="text-sm text-secondary-light">No content available. Click Edit to add information.</p>
            )}
          </div>

          {/* Edit form overlay */}
          {isEditing && (
            <div className="glass-panel rounded-3xl border border-white/70 p-8 space-y-6 bg-white/95 backdrop-blur-sm shadow-xl">
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-secondary-light mb-2 block">
                  Element Name
                </label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-2 text-primary-light placeholder:text-secondary-light focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30"
                  placeholder="Brand element name"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-secondary-light mb-2 block">
                  Description / Guidance
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={6}
                  className="w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-2 text-primary-light placeholder:text-secondary-light focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30 resize-none"
                  placeholder="How should Sylvia reference this? What makes it unique?"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-secondary-light mb-2 block">
                  Content
                </label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={8}
                  className="w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-2 text-primary-light placeholder:text-secondary-light focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30 resize-none"
                  placeholder="Full content or notes"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-secondary-light mb-2 block">
                  Notes
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-2 text-primary-light placeholder:text-secondary-light focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30 resize-none"
                  placeholder="Additional notes"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-2 rounded-2xl bg-black text-white font-semibold hover:bg-gray-800 transition"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 rounded-2xl bg-white/80 border border-white/70 text-primary-light hover:bg-white transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </PageShell>
    );
  }

  if (entityDetailView.type === 'concept') {
    const concept = entity as ConceptRecord;
    return (
      <PageShell title={concept.name} subtitle="Concept">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-white/70 hover:bg-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Concepts
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 rounded-full bg-white/80 border border-white/70 hover:bg-white transition flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>
          </div>
          
          {/* Always show content */}
          <div className="glass-panel rounded-3xl border border-white/70 p-8 space-y-6">
            {concept.category && (
              <div>
                <h3 className="text-xs uppercase tracking-[0.3em] text-secondary-light mb-2">Category</h3>
                <p className="text-lg">{concept.category}</p>
              </div>
            )}
            {concept.description && (
              <div>
                <h3 className="text-xs uppercase tracking-[0.3em] text-secondary-light mb-2">Description</h3>
                <div className="prose max-w-none concept-description">
                  <MarkdownBlock content={concept.description} />
                </div>
              </div>
            )}
            {concept.notes && (
              <div>
                <h3 className="text-xs uppercase tracking-[0.3em] text-secondary-light mb-2">Notes</h3>
                <div className="prose max-w-none">
                  <MarkdownBlock content={concept.notes} />
                </div>
              </div>
            )}
            {concept.tags && concept.tags.length > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-[0.3em] text-secondary-light mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {concept.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {!concept.category && !concept.description && !concept.notes && (!concept.tags || concept.tags.length === 0) && (
              <p className="text-sm text-secondary-light">No content available. Click Edit to add information.</p>
            )}
          </div>

          {/* Edit form overlay */}
          {isEditing && (
            <div className="glass-panel rounded-3xl border border-white/70 p-8 space-y-6 bg-white/95 backdrop-blur-sm shadow-xl">
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-secondary-light mb-2 block">
                  Name
                </label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-2 text-primary-light placeholder:text-secondary-light focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30"
                  placeholder="Concept name"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-secondary-light mb-2 block">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={8}
                  className="w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-2 text-primary-light placeholder:text-secondary-light focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30 resize-none"
                  placeholder="Full description"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-secondary-light mb-2 block">
                  Category
                </label>
                <input
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-2 text-primary-light placeholder:text-secondary-light focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30"
                  placeholder="Category (e.g., AI Application, Technology)"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-secondary-light mb-2 block">
                  Tags (comma-separated)
                </label>
                <input
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-2 text-primary-light placeholder:text-secondary-light focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30"
                  placeholder="tag1, tag2, tag3"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-secondary-light mb-2 block">
                  Notes
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-2 text-primary-light placeholder:text-secondary-light focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30 resize-none"
                  placeholder="Additional notes"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-2 rounded-2xl bg-black text-white font-semibold hover:bg-gray-800 transition"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 rounded-2xl bg-white/80 border border-white/70 text-primary-light hover:bg-white transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </PageShell>
    );
  }

  return null;
};

export default EntityDetailPage;

