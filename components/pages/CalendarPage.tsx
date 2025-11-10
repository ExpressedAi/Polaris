import React, { useEffect, useState, useCallback, useMemo } from 'react';
import PageShell from './PageShell';
import { CalendarEvent, PeopleRecord } from '../../types';
import { entityStorage } from '../../services/storage';
import MarkdownBlock from '../MarkdownBlock';
import { subscribeToEntityUpdates } from '../../services/entityEvents';
import { useAppContext } from '../../context/AppContext';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Video,
  Users,
  Tag,
  Repeat,
  Bell,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  X,
  ExternalLink,
  TrendingUp,
  CalendarDays,
} from 'lucide-react';

const EVENT_TYPES = [
  { value: 'meeting', label: 'Meeting', color: '#3B82F6' },
  { value: 'call', label: 'Call', color: '#10B981' },
  { value: 'appointment', label: 'Appointment', color: '#8B5CF6' },
  { value: 'event', label: 'Event', color: '#F59E0B' },
  { value: 'deadline', label: 'Deadline', color: '#EF4444' },
  { value: 'reminder', label: 'Reminder', color: '#6B7280' },
  { value: 'other', label: 'Other', color: '#9CA3AF' },
];

const RECURRENCE_OPTIONS = ['none', 'daily', 'weekly', 'monthly', 'yearly'];

const getMonthDays = (reference: Date) => {
  const start = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const startDay = start.getDay();
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - startDay);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    days.push(date);
  }
  return days;
};

const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [people, setPeople] = useState<PeopleRecord[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [showUpcoming, setShowUpcoming] = useState(true);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editMeetingLink, setEditMeetingLink] = useState('');
  const [editEventType, setEditEventType] = useState<CalendarEvent['eventType']>('meeting');
  const [editParticipants, setEditParticipants] = useState<string[]>([]);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editColor, setEditColor] = useState('');
  const [editIsRecurring, setEditIsRecurring] = useState(false);
  const [editRecurrenceRule, setEditRecurrenceRule] = useState('none');
  const [editReminderMinutes, setEditReminderMinutes] = useState<number | undefined>();
  const [newTag, setNewTag] = useState('');

  const load = useCallback(async () => {
    const [eventsData, peopleData] = await Promise.all([
      entityStorage.getCalendarEvents(),
      entityStorage.getPeopleRecords(),
    ]);
    setEvents(eventsData.sort((a, b) => a.startAt - b.startAt));
    setPeople(peopleData);
  }, []);

  useEffect(() => {
    load();
    const unsubscribe = subscribeToEntityUpdates('calendar', load);
    return unsubscribe;
  }, [load]);

  const filteredEvents = useMemo(() => {
    let filtered = events;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query) ||
        event.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (filterType) {
      filtered = filtered.filter(event => event.eventType === filterType);
    }

    return filtered;
  }, [events, searchQuery, filterType]);

  const upcomingEvents = useMemo(() => {
    const now = Date.now();
    return filteredEvents
      .filter(event => event.startAt >= now)
      .slice(0, 5)
      .sort((a, b) => a.startAt - b.startAt);
  }, [filteredEvents]);

  const todayEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return filteredEvents.filter(
      event => event.startAt >= today.getTime() && event.startAt < tomorrow.getTime()
    );
  }, [filteredEvents]);

  const selectedDateEvents = useMemo(() => {
    const dayKey = selectedDate.toDateString();
    return filteredEvents.filter(event => new Date(event.startAt).toDateString() === dayKey);
  }, [filteredEvents, selectedDate]);

  const eventMap = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    filteredEvents.forEach(event => {
      const key = new Date(event.startAt).toDateString();
      if (!map[key]) map[key] = [];
      map[key] = [...map[key], event];
    });
    return map;
  }, [filteredEvents]);

  const daysInGrid = useMemo(() => getMonthDays(currentMonth), [currentMonth]);

  const stats = useMemo(() => {
    const now = Date.now();
    const upcoming = events.filter(e => e.startAt >= now).length;
    const past = events.filter(e => e.startAt < now).length;
    const thisWeek = events.filter(e => {
      const eventDate = new Date(e.startAt);
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      return eventDate >= weekStart && eventDate < weekEnd;
    }).length;

    return { total: events.length, upcoming, past, thisWeek };
  }, [events]);

  const startEdit = (event: CalendarEvent) => {
    setEditingEvent(event);
    setEditTitle(event.title);
    setEditDescription(event.description || '');
    setEditStart(new Date(event.startAt).toISOString().slice(0, 16));
    setEditEnd(new Date(event.endAt).toISOString().slice(0, 16));
    setEditLocation(event.location || '');
    setEditMeetingLink(event.meetingLink || '');
    setEditEventType(event.eventType || 'meeting');
    setEditParticipants(event.participants || []);
    setEditTags(event.tags || []);
    setEditColor(event.color || EVENT_TYPES.find(t => t.value === event.eventType)?.color || '#3B82F6');
    setEditIsRecurring(event.isRecurring || false);
    setEditRecurrenceRule(event.recurrenceRule || 'none');
    setEditReminderMinutes(event.reminderMinutes);
    setSelectedDate(new Date(event.startAt));
  };

  const cancelEdit = () => {
    setEditingEvent(null);
    setEditTitle('');
    setEditDescription('');
    setEditStart('');
    setEditEnd('');
    setEditLocation('');
    setEditMeetingLink('');
    setEditEventType('meeting');
    setEditParticipants([]);
    setEditTags([]);
    setEditColor('');
    setEditIsRecurring(false);
    setEditRecurrenceRule('none');
    setEditReminderMinutes(undefined);
    setNewTag('');
  };

  const saveEdit = async () => {
    if (!editingEvent) return;
    await entityStorage.saveCalendarEvent({
      ...editingEvent,
      title: editTitle,
      description: editDescription || undefined,
      startAt: editStart ? new Date(editStart).getTime() : editingEvent.startAt,
      endAt: editEnd ? new Date(editEnd).getTime() : editingEvent.endAt,
      location: editLocation || undefined,
      meetingLink: editMeetingLink || undefined,
      eventType: editEventType,
      participants: editParticipants.length > 0 ? editParticipants : undefined,
      tags: editTags.length > 0 ? editTags : undefined,
      color: editColor || undefined,
      isRecurring: editIsRecurring || undefined,
      recurrenceRule: editRecurrenceRule !== 'none' ? editRecurrenceRule : undefined,
      reminderMinutes: editReminderMinutes || undefined,
      updatedAt: Date.now(),
    });
    cancelEdit();
    load();
  };

  const deleteEvent = async (eventId: string) => {
    await entityStorage.deleteCalendarEvent(eventId);
    load();
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

  const getPersonById = (id: string) => people.find(p => p.id === id);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const startOfMonthLabel = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const goToPreviousMonth = () => {
    const next = new Date(currentMonth);
    next.setMonth(currentMonth.getMonth() - 1);
    setCurrentMonth(next);
  };

  const goToNextMonth = () => {
    const next = new Date(currentMonth);
    next.setMonth(currentMonth.getMonth() + 1);
    setCurrentMonth(next);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  return (
    <PageShell
      title="Calendar"
      subtitle="Temporal anchors with rich context. Participants, locations, meeting links, and more for Sylvia's understanding."
    >
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-blue-50 to-blue-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <CalendarDays className="w-6 h-6 text-blue-600" />
            <span className="text-2xl font-bold text-black">{stats.total}</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">Total Events</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-green-50 to-green-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <span className="text-2xl font-bold text-black">{stats.upcoming}</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">Upcoming</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-purple-50 to-purple-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-6 h-6 text-purple-600" />
            <span className="text-2xl font-bold text-black">{stats.thisWeek}</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">This Week</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-orange-50 to-orange-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <CalendarIcon className="w-6 h-6 text-orange-600" />
            <span className="text-2xl font-bold text-black">{todayEvents.length}</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">Today</p>
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
              placeholder="Search events by title, description, location, tags..."
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

        {/* Event Type Filters */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-secondary-light flex items-center gap-1">
            <Filter className="w-4 h-4" />
            Filter:
          </span>
          <button
            onClick={() => setFilterType(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              filterType === null
                ? 'bg-black text-white'
                : 'bg-white/80 border border-white/70 hover:bg-white'
            }`}
          >
            All
          </button>
          {EVENT_TYPES.map(type => (
            <button
              key={type.value}
              onClick={() => setFilterType(filterType === type.value ? null : type.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition flex items-center gap-1 ${
                filterType === type.value
                  ? 'bg-black text-white'
                  : 'bg-white/80 border border-white/70 hover:bg-white'
              }`}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: type.color }}
              />
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="glass-panel border border-white/70 rounded-3xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={goToPreviousMonth}
              className="p-2 rounded-full bg-white/80 border border-white/70 hover:bg-white transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-xl font-semibold">{startOfMonthLabel}</h2>
            <button
              onClick={goToNextMonth}
              className="p-2 rounded-full bg-white/80 border border-white/70 hover:bg-white transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={goToToday}
            className="px-4 py-2 rounded-full bg-black text-white text-sm font-medium hover:shadow-lg transition"
          >
            Today
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-xs uppercase tracking-[0.3em] text-secondary-light mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="font-semibold">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {daysInGrid.map(date => {
            const key = date.toDateString();
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
            const isToday = key === new Date().toDateString();
            const isSelected = key === selectedDate.toDateString();
            const dayEvents = eventMap[key] || [];

            return (
              <button
                key={key + date.getDate()}
                onClick={() => setSelectedDate(date)}
                className={`rounded-2xl border px-2 py-3 text-left space-y-1 transition min-h-[80px] ${
                  isSelected
                    ? 'bg-black text-white border-black shadow-lg'
                    : isToday
                    ? 'bg-blue-50 border-blue-200 text-primary-light'
                    : 'bg-white/70 text-primary-light border-white/70 hover:bg-white'
                } ${!isCurrentMonth ? 'opacity-40' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-semibold ${isToday && !isSelected ? 'text-blue-600' : ''}`}>
                    {date.getDate()}
                  </p>
                  {isToday && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  )}
                </div>
                {dayEvents.length > 0 && (
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map(event => {
                      const typeConfig = EVENT_TYPES.find(t => t.value === event.eventType) || EVENT_TYPES[0];
                      return (
                        <div
                          key={event.id}
                          className="text-[9px] px-1 py-0.5 rounded truncate"
                          style={{
                            backgroundColor: isSelected
                              ? 'rgba(255,255,255,0.2)'
                              : `${typeConfig.color}20`,
                            color: isSelected ? 'white' : typeConfig.color,
                          }}
                        >
                          {formatTime(event.startAt)} {event.title.substring(0, 15)}
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <p className="text-[9px] text-secondary-light">
                        +{dayEvents.length - 2} more
                      </p>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Selected Date Events */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel border border-white/70 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </h3>
              <span className="text-sm text-secondary-light">
                {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? 's' : ''}
              </span>
            </div>

            {selectedDateEvents.length === 0 ? (
              <p className="text-sm text-secondary-light text-center py-8">
                No events scheduled for this date.
              </p>
            ) : (
              <div className="space-y-4">
                {selectedDateEvents.map(event => {
                  const typeConfig = EVENT_TYPES.find(t => t.value === event.eventType) || EVENT_TYPES[0];
                  const isEditing = editingEvent?.id === event.id;
                  const eventParticipants = event.participants?.map(id => getPersonById(id)).filter(Boolean) || [];

                  return (
                    <div
                      key={event.id}
                      className={`rounded-3xl border p-6 transition-all ${
                        isEditing
                          ? 'border-black bg-black text-white shadow-xl'
                          : 'border-white/70 bg-white/90 hover:shadow-lg hover:border-white'
                      }`}
                      style={{
                        borderLeftWidth: isEditing ? '4px' : '1px',
                        borderLeftColor: isEditing ? 'white' : typeConfig.color,
                      }}
                    >
                      {isEditing ? (
                        <div className="space-y-4">
                          {/* Edit Form */}
                          <div>
                            <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                              Title *
                            </label>
                            <input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                              placeholder="Event title"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                                Start
                              </label>
                              <input
                                type="datetime-local"
                                value={editStart}
                                onChange={(e) => setEditStart(e.target.value)}
                                className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                              />
                            </div>
                            <div>
                              <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                                End
                              </label>
                              <input
                                type="datetime-local"
                                value={editEnd}
                                onChange={(e) => setEditEnd(e.target.value)}
                                className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                              Event Type
                            </label>
                            <select
                              value={editEventType}
                              onChange={(e) => {
                                setEditEventType(e.target.value as CalendarEvent['eventType']);
                                const type = EVENT_TYPES.find(t => t.value === e.target.value);
                                if (type) setEditColor(type.color);
                              }}
                              className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                            >
                              {EVENT_TYPES.map(type => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
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
                                placeholder="Venue or address"
                              />
                            </div>
                            <div>
                              <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                                Meeting Link
                              </label>
                              <input
                                type="url"
                                value={editMeetingLink}
                                onChange={(e) => setEditMeetingLink(e.target.value)}
                                className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                                placeholder="https://..."
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                              Participants
                            </label>
                            <select
                              multiple
                              value={editParticipants}
                              onChange={(e) => {
                                const selected = Array.from(e.target.selectedOptions, option => option.value);
                                setEditParticipants(selected);
                              }}
                              className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50 min-h-[100px]"
                              size={5}
                            >
                              {people.map(person => (
                                <option key={person.id} value={person.id}>
                                  {person.name} {person.role ? `(${person.role})` : ''}
                                </option>
                              ))}
                            </select>
                            <p className="text-xs text-white/50 mt-1">
                              Hold Cmd/Ctrl to select multiple
                            </p>
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
                              Description
                            </label>
                            <textarea
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              rows={4}
                              className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
                              placeholder="Event details, agenda, notes..."
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="flex items-center gap-2 text-xs text-white/70 mb-2">
                                <input
                                  type="checkbox"
                                  checked={editIsRecurring}
                                  onChange={(e) => setEditIsRecurring(e.target.checked)}
                                  className="rounded"
                                />
                                Recurring Event
                              </label>
                              {editIsRecurring && (
                                <select
                                  value={editRecurrenceRule}
                                  onChange={(e) => setEditRecurrenceRule(e.target.value)}
                                  className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                                >
                                  {RECURRENCE_OPTIONS.filter(o => o !== 'none').map(opt => (
                                    <option key={opt} value={opt}>
                                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                            <div>
                              <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                                Reminder (minutes before)
                              </label>
                              <input
                                type="number"
                                value={editReminderMinutes || ''}
                                onChange={(e) =>
                                  setEditReminderMinutes(e.target.value ? parseInt(e.target.value) : undefined)
                                }
                                className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                                placeholder="15"
                              />
                            </div>
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
                              <div className="flex items-center gap-2 mb-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: typeConfig.color }}
                                />
                                <h4 className="text-xl font-bold">{event.title}</h4>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-secondary-light">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {formatTime(event.startAt)} - {formatTime(event.endAt)}
                                </span>
                                {event.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {event.location}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {event.description && (
                            <div className="mb-4">
                              <MarkdownBlock content={event.description} className="text-sm leading-relaxed" />
                            </div>
                          )}

                          {eventParticipants.length > 0 && (
                            <div className="mb-4 p-3 rounded-2xl bg-blue-50 border border-blue-100">
                              <div className="flex items-center gap-2 mb-2">
                                <Users className="w-4 h-4 text-blue-600" />
                                <span className="text-xs font-semibold text-blue-900 uppercase tracking-[0.1em]">
                                  Participants ({eventParticipants.length})
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {eventParticipants.map(person => (
                                  <span
                                    key={person.id}
                                    className="px-2 py-1 rounded-full bg-white text-blue-900 text-xs"
                                  >
                                    {person.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {event.meetingLink && (
                            <div className="mb-4">
                              <a
                                href={event.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100 transition"
                              >
                                <Video className="w-4 h-4" />
                                Join Meeting
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}

                          {event.tags && event.tags.length > 0 && (
                            <div className="mb-4 flex flex-wrap gap-1.5">
                              {event.tags.map(tag => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs"
                                >
                                  <Tag className="w-3 h-3 mr-1" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-2 pt-4 border-t border-white/20">
                            {event.isRecurring && (
                              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-50 text-purple-700 text-xs">
                                <Repeat className="w-3 h-3" />
                                {event.recurrenceRule}
                              </span>
                            )}
                            {event.reminderMinutes && (
                              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 text-xs">
                                <Bell className="w-3 h-3" />
                                {event.reminderMinutes}m reminder
                              </span>
                            )}
                          </div>

                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={() => startEdit(event)}
                              className="px-3 py-1.5 rounded-full bg-white/80 border border-white/70 text-xs font-medium hover:bg-white transition flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              onClick={() => deleteEvent(event.id)}
                              className="px-3 py-1.5 rounded-full bg-white/80 border border-white/70 text-xs font-medium hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
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
          </div>
        </div>

        {/* Sidebar - Upcoming Events */}
        <div className="space-y-6">
          {showUpcoming && upcomingEvents.length > 0 && (
            <div className="glass-panel border border-white/70 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Upcoming
                </h3>
                <button
                  onClick={() => setShowUpcoming(false)}
                  className="text-secondary-light hover:text-black transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {upcomingEvents.map(event => {
                  const typeConfig = EVENT_TYPES.find(t => t.value === event.eventType) || EVENT_TYPES[0];
                  return (
                    <button
                      key={event.id}
                      onClick={() => {
                        setSelectedDate(new Date(event.startAt));
                        startEdit(event);
                      }}
                      className="w-full text-left p-3 rounded-2xl border border-white/70 bg-white/80 hover:bg-white transition"
                    >
                      <div className="flex items-start gap-2 mb-1">
                        <div
                          className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                          style={{ backgroundColor: typeConfig.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{event.title}</p>
                          <p className="text-xs text-secondary-light">
                            {formatDate(event.startAt)} • {formatTime(event.startAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default CalendarPage;
