import React, { useEffect, useState, useCallback, useMemo } from 'react';
import PageShell from './PageShell';
import { PeopleRecord } from '../../types';
import { entityStorage } from '../../services/storage';
import { migratePeopleToConcepts } from '../../services/migrateConcepts';
import MarkdownBlock from '../MarkdownBlock';
import { subscribeToEntityUpdates } from '../../services/entityEvents';
import { useAppContext } from '../../context/AppContext';
import {
  Users,
  User,
  Building2,
  MapPin,
  Mail,
  Phone,
  Tag,
  Link2,
  Search,
  Filter,
  X,
  Plus,
  Edit2,
  Trash2,
  Briefcase,
  FileText,
  Sparkles,
  TrendingUp,
  Award,
  Target,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

const COMMON_ATTRIBUTES = [
  'Decision Maker',
  'Technical',
  'Gatekeeper',
  'Influencer',
  'Champion',
  'Stakeholder',
  'Collaborator',
  'Mentor',
  'Client',
  'Vendor',
  'Partner',
];

const RELATIONSHIP_TYPES = [
  'Reports To',
  'Manages',
  'Collaborates With',
  'Mentor',
  'Mentee',
  'Peer',
  'Client',
  'Vendor',
  'Partner',
  'Advisor',
  'Colleague',
];

const PeoplePage: React.FC = () => {
  const { setActiveEntity } = useAppContext();
  const [records, setRecords] = useState<PeopleRecord[]>([]);
  const [editingRecord, setEditingRecord] = useState<PeopleRecord | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<PeopleRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAttribute, setFilterAttribute] = useState<string | null>(null);
  const [showAddConnection, setShowAddConnection] = useState(false);
  const [newConnectionPersonId, setNewConnectionPersonId] = useState('');
  const [newConnectionRelationship, setNewConnectionRelationship] = useState('');
  const [newConnectionStrength, setNewConnectionStrength] = useState<'weak' | 'moderate' | 'strong'>('moderate');
  const [newConnectionNotes, setNewConnectionNotes] = useState('');
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{ migrated: number; kept: number; errors: string[] } | null>(null);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAttributes, setEditAttributes] = useState<string[]>([]);
  const [editProfile, setEditProfile] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newAttribute, setNewAttribute] = useState('');
  const [newTag, setNewTag] = useState('');

  const load = useCallback(async () => {
    const data = await entityStorage.getPeopleRecords();
    setRecords(data.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt)));
  }, []);

  useEffect(() => {
    load();
    const unsubscribe = subscribeToEntityUpdates('people', load);
    return unsubscribe;
  }, [load]);

  const filteredRecords = useMemo(() => {
    let filtered = records;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(record =>
        record.name.toLowerCase().includes(query) ||
        record.role?.toLowerCase().includes(query) ||
        record.company?.toLowerCase().includes(query) ||
        record.attributes?.some(attr => attr.toLowerCase().includes(query)) ||
        record.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        record.profile?.toLowerCase().includes(query) ||
        record.notes?.toLowerCase().includes(query)
      );
    }

    if (filterAttribute) {
      filtered = filtered.filter(record =>
        record.attributes?.includes(filterAttribute)
      );
    }

    return filtered;
  }, [records, searchQuery, filterAttribute]);

  const allAttributes = useMemo(() => {
    const attrs = new Set<string>();
    records.forEach(record => {
      record.attributes?.forEach(attr => attrs.add(attr));
    });
    return Array.from(attrs).sort();
  }, [records]);

  const getPersonById = (id: string) => records.find(p => p.id === id);

  const startEdit = (record: PeopleRecord) => {
    setEditingRecord(record);
    setEditName(record.name);
    setEditRole(record.role || '');
    setEditCompany(record.company || '');
    setEditLocation(record.location || '');
    setEditEmail(record.email || '');
    setEditPhone(record.phone || '');
    setEditAttributes(record.attributes || []);
    setEditProfile(record.profile || '');
    setEditNotes(record.notes || '');
    setEditTags(record.tags || []);
    setSelectedPerson(null);
    setActiveEntity({ type: 'person', id: record.id, data: record });
  };

  const cancelEdit = () => {
    setEditingRecord(null);
    setEditName('');
    setEditRole('');
    setEditCompany('');
    setEditLocation('');
    setEditEmail('');
    setEditPhone('');
    setEditAttributes([]);
    setEditProfile('');
    setEditNotes('');
    setEditTags([]);
    setNewAttribute('');
    setNewTag('');
    setActiveEntity({ type: null, id: '' });
  };

  const saveEdit = async () => {
    if (!editingRecord) return;
    await entityStorage.savePeopleRecord({
      ...editingRecord,
      name: editName,
      role: editRole || undefined,
      company: editCompany || undefined,
      location: editLocation || undefined,
      email: editEmail || undefined,
      phone: editPhone || undefined,
      attributes: editAttributes.length > 0 ? editAttributes : undefined,
      profile: editProfile || undefined,
      notes: editNotes || undefined,
      tags: editTags.length > 0 ? editTags : undefined,
      updatedAt: Date.now(),
    });
    cancelEdit();
    load();
  };

  const deletePerson = async (id: string) => {
    // Remove connections from other people
    const updatedRecords = records.map(record => ({
      ...record,
      connections: record.connections?.filter(conn => conn.personId !== id) || [],
      updatedAt: Date.now(),
    }));
    
    for (const record of updatedRecords) {
      if (record.connections?.length !== records.find(r => r.id === record.id)?.connections?.length) {
        await entityStorage.savePeopleRecord(record);
      }
    }
    
    await entityStorage.deletePeopleRecord(id);
    load();
  };

  const addAttribute = () => {
    if (newAttribute.trim() && !editAttributes.includes(newAttribute.trim())) {
      setEditAttributes([...editAttributes, newAttribute.trim()]);
      setNewAttribute('');
    }
  };

  const removeAttribute = (attr: string) => {
    setEditAttributes(editAttributes.filter(a => a !== attr));
  };

  const addTag = () => {
    if (newTag.trim() && !editTags.includes(newTag.trim())) {
      setEditTags([...editTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setEditTags(editTags.filter(t => t !== tag));
  };

  const handleMigrateConcepts = async () => {
    setMigrating(true);
    setMigrationResult(null);
    try {
      const result = await migratePeopleToConcepts();
      setMigrationResult(result);
      load(); // Reload to show updated list
    } catch (error) {
      setMigrationResult({
        migrated: 0,
        kept: 0,
        errors: [error instanceof Error ? error.message : String(error)],
      });
    } finally {
      setMigrating(false);
    }
  };

  const addConnection = async () => {
    if (!selectedPerson || !newConnectionPersonId || !newConnectionRelationship) return;

    const connectionExists = selectedPerson.connections?.some(
      c => c.personId === newConnectionPersonId && c.relationship === newConnectionRelationship
    );

    if (connectionExists) {
      alert('This connection already exists');
      return;
    }

    await entityStorage.savePeopleRecord({
      ...selectedPerson,
      connections: [
        ...(selectedPerson.connections || []),
        {
          personId: newConnectionPersonId,
          relationship: newConnectionRelationship,
          strength: newConnectionStrength,
          notes: newConnectionNotes || undefined,
        },
      ],
      updatedAt: Date.now(),
    });

    setShowAddConnection(false);
    setNewConnectionPersonId('');
    setNewConnectionRelationship('');
    setNewConnectionStrength('moderate');
    setNewConnectionNotes('');
    load();
  };

  const removeConnection = async (personId: string, connectionPersonId: string) => {
    const person = getPersonById(personId);
    if (!person) return;

    await entityStorage.savePeopleRecord({
      ...person,
      connections: person.connections?.filter(c => c.personId !== connectionPersonId) || [],
      updatedAt: Date.now(),
    });
    load();
  };

  return (
    <PageShell
      title="People Network"
      subtitle="Rich profiles, attributes, and connections. The foundation for Sylvia's context engineering and Polaris goal execution."
    >
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-blue-50 to-blue-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-6 h-6 text-blue-600" />
            <span className="text-2xl font-bold text-black">{records.length}</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">Total People</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-purple-50 to-purple-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <Link2 className="w-6 h-6 text-purple-600" />
            <span className="text-2xl font-bold text-black">
              {records.reduce((sum, r) => sum + (r.connections?.length || 0), 0)}
            </span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">Connections</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-green-50 to-green-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <Tag className="w-6 h-6 text-green-600" />
            <span className="text-2xl font-bold text-black">{allAttributes.length}</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">Attributes</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-orange-50 to-orange-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-6 h-6 text-orange-600" />
            <span className="text-2xl font-bold text-black">
              {records.filter(r => r.attributes?.includes('Decision Maker')).length}
            </span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">Decision Makers</p>
        </div>
      </div>

      {/* Migration Tool */}
      <div className="glass-panel border border-white/70 rounded-3xl p-6 mb-6 bg-gradient-to-br from-yellow-50/50 to-orange-50/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Clean Up People Section
            </h3>
            <p className="text-sm text-secondary-light mt-1">
              Move non-people items (like AI applications, concepts, ideas) to the Concepts section
            </p>
          </div>
          <button
            onClick={handleMigrateConcepts}
            disabled={migrating}
            className="px-4 py-2 rounded-full bg-orange-100 text-orange-700 border border-orange-200 text-sm font-medium hover:bg-orange-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {migrating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Migrating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Migrate to Concepts
              </>
            )}
          </button>
        </div>
        {migrationResult && (
          <div className={`p-4 rounded-2xl border ${
            migrationResult.errors.length > 0
              ? 'bg-red-50 border-red-200'
              : 'bg-green-50 border-green-200'
          }`}>
            <p className="text-sm font-semibold mb-2">
              Migration Complete
            </p>
            <div className="text-xs space-y-1">
              <p>✅ Migrated: {migrationResult.migrated} items to Concepts</p>
              <p>✅ Kept: {migrationResult.kept} items in People</p>
              {migrationResult.errors.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold text-red-700">Errors:</p>
                  {migrationResult.errors.map((error, idx) => (
                    <p key={idx} className="text-red-600">{error}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
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
              placeholder="Search people by name, role, company, attributes, tags..."
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

        {/* Attribute Filters */}
        {allAttributes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-secondary-light flex items-center gap-1">
              <Filter className="w-4 h-4" />
              Filter by:
            </span>
            {allAttributes.map(attr => (
              <button
                key={attr}
                onClick={() => setFilterAttribute(filterAttribute === attr ? null : attr)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  filterAttribute === attr
                    ? 'bg-black text-white'
                    : 'bg-white/80 border border-white/70 hover:bg-white'
                }`}
              >
                {attr}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* People Grid */}
      {filteredRecords.length === 0 ? (
        <div className="glass-panel rounded-3xl border border-white/70 p-12 text-center">
          <div className="flex justify-center mb-4">
            <Users className="w-16 h-16 text-secondary-light" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {records.length === 0 ? 'No people tracked yet' : 'No matches found'}
          </h3>
          <p className="text-secondary-light">
            {records.length === 0
              ? "Tell Sylvia about people you work with. She'll build rich profiles and connections to power Polaris goals."
              : 'Try adjusting your search or filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecords.map(record => {
            const isEditing = editingRecord?.id === record.id;
            const isSelected = selectedPerson?.id === record.id;
            const connections = record.connections || [];
            const connectedPeople = connections
              .map(conn => ({ ...conn, person: getPersonById(conn.personId) }))
              .filter(c => c.person);

            return (
              <div
                key={record.id}
                onClick={(e) => {
                  // Don't navigate if clicking edit/delete buttons or connection links
                  if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;
                  if (!isEditing) {
                    setEntityDetailView({ type: 'person', id: record.id });
                    setActiveEntity({ type: 'person', id: record.id, data: record });
                  }
                }}
                className={`rounded-3xl border p-6 transition-all ${
                  isEditing
                    ? 'border-black bg-black text-white shadow-xl'
                    : isSelected
                    ? 'border-purple-500 bg-purple-50 shadow-lg'
                    : 'border-white/70 bg-white/90 hover:shadow-lg hover:border-white cursor-pointer'
                }`}
              >
                {isEditing ? (
                  <div className="space-y-4">
                    {/* Edit Form */}
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                        Name *
                      </label>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                        placeholder="Full name"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                          Role
                        </label>
                        <input
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                          placeholder="Job title"
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                          Company
                        </label>
                        <input
                          value={editCompany}
                          onChange={(e) => setEditCompany(e.target.value)}
                          className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                          placeholder="Company"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                          Location
                        </label>
                        <input
                          value={editLocation}
                          onChange={(e) => setEditLocation(e.target.value)}
                          className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                          placeholder="City, State"
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                          Email
                        </label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                          placeholder="email@example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                        Attributes
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {editAttributes.map(attr => (
                          <span
                            key={attr}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/20 text-white text-xs"
                          >
                            {attr}
                            <button
                              onClick={() => removeAttribute(attr)}
                              className="hover:text-red-300"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          value={newAttribute}
                          onChange={(e) => setNewAttribute(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addAttribute()}
                          className="flex-1 rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                          placeholder="Add attribute..."
                        />
                        <button
                          onClick={addAttribute}
                          className="px-4 py-2 rounded-2xl bg-white/20 text-white border border-white/30 hover:bg-white/30 transition"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {COMMON_ATTRIBUTES.filter(a => !editAttributes.includes(a)).map(attr => (
                          <button
                            key={attr}
                            onClick={() => {
                              if (!editAttributes.includes(attr)) {
                                setEditAttributes([...editAttributes, attr]);
                              }
                            }}
                            className="px-2 py-1 rounded-full bg-white/10 text-white/70 text-xs hover:bg-white/20 transition"
                          >
                            {attr}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                        Profile / Context
                      </label>
                      <textarea
                        value={editProfile}
                        onChange={(e) => setEditProfile(e.target.value)}
                        rows={4}
                        className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
                        placeholder="Rich context about this person. Their background, expertise, communication style, preferences, etc. This powers Sylvia's understanding."
                      />
                    </div>

                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                        Tags
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {editTags.map(tag => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/20 text-white text-xs"
                          >
                            {tag}
                            <button
                              onClick={() => removeTag(tag)}
                              className="hover:text-red-300"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addTag()}
                          className="flex-1 rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                          placeholder="Add tag..."
                        />
                        <button
                          onClick={addTag}
                          className="px-4 py-2 rounded-2xl bg-white/20 text-white border border-white/30 hover:bg-white/30 transition"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                        Notes
                      </label>
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        rows={3}
                        className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
                        placeholder="Additional notes..."
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
                    {/* View Mode */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-5 h-5 text-gray-600" />
                          <h3 className="text-xl font-bold">{record.name}</h3>
                        </div>
                        {record.role && (
                          <p className="text-sm text-secondary-light flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            {record.role}
                          </p>
                        )}
                        {record.company && (
                          <p className="text-sm text-secondary-light flex items-center gap-1 mt-1">
                            <Building2 className="w-3 h-3" />
                            {record.company}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Contact Info */}
                    {(record.location || record.email || record.phone) && (
                      <div className="space-y-1 mb-4 text-sm">
                        {record.location && (
                          <p className="text-secondary-light flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            {record.location}
                          </p>
                        )}
                        {record.email && (
                          <p className="text-secondary-light flex items-center gap-2">
                            <Mail className="w-3 h-3" />
                            {record.email}
                          </p>
                        )}
                        {record.phone && (
                          <p className="text-secondary-light flex items-center gap-2">
                            <Phone className="w-3 h-3" />
                            {record.phone}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Attributes */}
                    {record.attributes && record.attributes.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1.5">
                          {record.attributes.map(attr => (
                            <span
                              key={attr}
                              className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-medium"
                            >
                              <Tag className="w-3 h-3 mr-1" />
                              {attr}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {record.tags && record.tags.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1.5">
                          {record.tags.map(tag => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Profile */}
                    {record.profile && (
                      <div className="mb-4">
                        <MarkdownBlock content={record.profile} className="text-sm leading-relaxed" />
                      </div>
                    )}

                    {/* Connections */}
                    {connectedPeople.length > 0 && (
                      <div className="mb-4 p-3 rounded-2xl bg-blue-50 border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Link2 className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-semibold text-blue-900 uppercase tracking-[0.1em]">
                            Connections ({connectedPeople.length})
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {connectedPeople.map((conn, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs bg-white/60 rounded-lg p-2"
                            >
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{conn.person?.name}</div>
                                <div className="text-gray-600">{conn.relationship}</div>
                                {conn.notes && (
                                  <div className="text-gray-500 mt-0.5">
                                    <MarkdownBlock content={conn.notes} className="text-xs" />
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-xs ${
                                    conn.strength === 'strong'
                                      ? 'bg-green-100 text-green-700'
                                      : conn.strength === 'moderate'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {conn.strength || 'moderate'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {record.notes && (
                      <div className="mb-4">
                        <MarkdownBlock content={record.notes} className="text-sm text-secondary-light" />
                      </div>
                    )}

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
                        {!isSelected && (
                          <button
                            onClick={() => {
                              setSelectedPerson(record);
                              setActiveEntity({ type: 'person', id: record.id, data: record });
                              setShowAddConnection(true);
                            }}
                            className="px-3 py-1.5 rounded-full bg-white/80 border border-white/70 text-xs font-medium hover:bg-white transition flex items-center gap-1"
                            title="Add connection"
                          >
                            <Link2 className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => startEdit(record)}
                          className="px-3 py-1.5 rounded-full bg-white/80 border border-white/70 text-xs font-medium hover:bg-white transition flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => deletePerson(record.id)}
                          className="px-3 py-1.5 rounded-full bg-white/80 border border-white/70 text-xs font-medium hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
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

      {/* Add Connection Modal */}
      {showAddConnection && selectedPerson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-3xl border border-white/70 p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Connection</h3>
              <button
                onClick={() => {
                  setShowAddConnection(false);
                  setSelectedPerson(null);
                }}
                className="text-secondary-light hover:text-black transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-secondary-light mb-4">
              Connect <strong>{selectedPerson.name}</strong> to another person
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-secondary-light mb-2 block">
                  Person
                </label>
                <select
                  value={newConnectionPersonId}
                  onChange={(e) => setNewConnectionPersonId(e.target.value)}
                  className="w-full rounded-2xl border border-white/70 px-4 py-2 bg-white/80 focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="">Select a person...</option>
                  {records
                    .filter(p => p.id !== selectedPerson.id)
                    .map(person => (
                      <option key={person.id} value={person.id}>
                        {person.name} {person.role ? `(${person.role})` : ''}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-secondary-light mb-2 block">
                  Relationship
                </label>
                <select
                  value={newConnectionRelationship}
                  onChange={(e) => setNewConnectionRelationship(e.target.value)}
                  className="w-full rounded-2xl border border-white/70 px-4 py-2 bg-white/80 focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="">Select relationship...</option>
                  {RELATIONSHIP_TYPES.map(rel => (
                    <option key={rel} value={rel}>
                      {rel}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-secondary-light mb-2 block">
                  Strength
                </label>
                <select
                  value={newConnectionStrength}
                  onChange={(e) =>
                    setNewConnectionStrength(e.target.value as 'weak' | 'moderate' | 'strong')
                  }
                  className="w-full rounded-2xl border border-white/70 px-4 py-2 bg-white/80 focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="weak">Weak</option>
                  <option value="moderate">Moderate</option>
                  <option value="strong">Strong</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-secondary-light mb-2 block">
                  Notes (optional)
                </label>
                <textarea
                  value={newConnectionNotes}
                  onChange={(e) => setNewConnectionNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-2xl border border-white/70 px-4 py-2 bg-white/80 focus:outline-none focus:ring-2 focus:ring-black resize-none"
                  placeholder="Additional context about this connection..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addConnection}
                  className="flex-1 px-4 py-2 rounded-2xl bg-black text-white font-semibold hover:shadow-lg transition"
                >
                  Add Connection
                </button>
                <button
                  onClick={() => {
                    setShowAddConnection(false);
                    setSelectedPerson(null);
                  }}
                  className="px-4 py-2 rounded-2xl bg-white border border-white/70 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default PeoplePage;
