import React, { useEffect, useState, useCallback, useMemo } from 'react';
import PageShell from './PageShell';
import { AgendaItem, Deliverable, AgendaSession, PostMortem, GoalRecord } from '../../types';
import { entityStorage } from '../../services/storage';
import { awardExperience } from '../../services/experience';
import { logContext } from '../../services/contextLog';
import MarkdownBlock from '../MarkdownBlock';
import { subscribeToEntityUpdates } from '../../services/entityEvents';
import { useAppContext } from '../../context/AppContext';
import {
  CheckCircle2,
  Clock,
  Play,
  Pause,
  Square,
  Plus,
  Edit2,
  Trash2,
  ArrowRight,
  ArrowDown,
  Zap,
  Target,
  ListChecks,
  Sparkles,
  TrendingUp,
  Award,
  BarChart3,
  Filter,
  Search,
  X,
  Settings,
  User,
  Bot,
  Users,
  Calendar,
  Tag,
  AlertCircle,
  Lightbulb,
  BookOpen,
} from 'lucide-react';

const AgendaPage: React.FC = () => {
  const { sendMessage } = useAppContext();
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [sessions, setSessions] = useState<AgendaSession[]>([]);
  const [postMortems, setPostMortems] = useState<PostMortem[]>([]);
  const [goals, setGoals] = useState<GoalRecord[]>([]);
  const [activeSession, setActiveSession] = useState<AgendaSession | null>(null);
  const [sessionMode, setSessionMode] = useState<AgendaSession['mode']>('semi-auto');
  const [sessionNotes, setSessionNotes] = useState('');
  const [sessionDeliverableIds, setSessionDeliverableIds] = useState<string[]>([]);
  const [sessionGoals, setSessionGoals] = useState<string[]>([]);
  const [sessionSummary, setSessionSummary] = useState('');
  const [sessionGrade, setSessionGrade] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [showSessionConfig, setShowSessionConfig] = useState(false);
  const [autonomousConfig, setAutonomousConfig] = useState({
    personality: '',
    decisionStyle: '',
    communicationStyle: '',
  });

  // Edit states
  const [editingDeliverable, setEditingDeliverable] = useState<Deliverable | null>(null);
  const [editingItem, setEditingItem] = useState<AgendaItem | null>(null);
  const [deliverableEditForm, setDeliverableEditForm] = useState({
    title: '',
    description: '',
    guardrails: '',
    successCriteria: '',
    scope: 'professional' as 'personal' | 'professional',
    priority: 'medium' as 'low' | 'medium' | 'high',
    tags: '',
  });
  const [itemEditForm, setItemEditForm] = useState({
    title: '',
    description: '',
    dueAt: '',
    estimatedTime: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    tags: '',
    deliverableId: '',
  });

  const load = useCallback(async () => {
    const [itemData, deliverableData, sessionData, mortemData, goalData] = await Promise.all([
      entityStorage.getAgendaItems(),
      entityStorage.getDeliverables(),
      entityStorage.getAgendaSessions(),
      entityStorage.getPostMortems(),
      entityStorage.getGoals(),
    ]);
    setItems(itemData.sort((a, b) => (b.dueAt || b.createdAt) - (a.dueAt || a.createdAt)));
    setDeliverables(deliverableData.sort((a, b) => b.createdAt - a.createdAt));
    setSessions(sessionData.sort((a, b) => (b.updatedAt || b.startedAt) - (a.updatedAt || a.startedAt)));
    setPostMortems(mortemData.sort((a, b) => b.createdAt - a.createdAt));
    setGoals(goalData);

    // Find active session
    const active = sessionData.find(s => s.status === 'active' || s.status === 'paused');
    setActiveSession(active || null);
    if (active) {
      setSessionNotes(active.notes || '');
      setSessionMode(active.mode);
      setSessionDeliverableIds(active.deliverableIds);
      setSessionGoals(active.sessionGoals || []);
    }
  }, []);

  useEffect(() => {
    load();
    const unsubscribe = subscribeToEntityUpdates(['agenda', 'deliverable', 'goal'], load);
    return unsubscribe;
  }, [load]);

  const stats = useMemo(() => {
    const totalItems = items.length;
    const doneItems = items.filter(i => i.status === 'done').length;
    const inProgressItems = items.filter(i => i.status === 'in-progress').length;
    const todoItems = items.filter(i => i.status === 'todo').length;
    const activeSessions = sessions.filter(s => s.status === 'active').length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const totalDeliverables = deliverables.length;

    return {
      totalItems,
      doneItems,
      inProgressItems,
      todoItems,
      activeSessions,
      completedSessions,
      totalDeliverables,
    };
  }, [items, sessions, deliverables]);

  const filteredItems = useMemo(() => {
    let filtered = items;
    if (filterStatus) {
      filtered = filtered.filter(i => i.status === filterStatus);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(i =>
        i.title.toLowerCase().includes(query) ||
        i.description?.toLowerCase().includes(query) ||
        i.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    return filtered;
  }, [items, filterStatus, searchQuery]);

  const getDeliverableById = (id: string) => deliverables.find(d => d.id === id);
  const getGoalById = (id: string) => goals.find(g => g.id === id);

  const handleStartSession = async () => {
    // Auto-select deliverable if only one exists and none selected
    let deliverableIdsToUse = sessionDeliverableIds;
    if (deliverableIdsToUse.length === 0 && deliverables.length === 1) {
      deliverableIdsToUse = [deliverables[0].id];
    }
    
    // Allow starting session even without deliverables (for manual mode or when Sylvia will create them)
    if (deliverableIdsToUse.length === 0 && sessionMode !== 'manual') {
      // For auto/semi-auto modes, we need at least one deliverable
      // But don't block - let Sylvia create them during the session
      deliverableIdsToUse = [];
    }

    // Generate task sequence for autonomous/semi-auto modes
    let taskSequence: string[] = [];
    if (sessionMode !== 'manual') {
      // Get all agenda items for selected deliverables
      const deliverableItems = items.filter(item =>
        item.deliverableId && deliverableIdsToUse.includes(item.deliverableId)
      );
      taskSequence = deliverableItems.map(item => item.id);
    }

    const session: AgendaSession = {
      id: `session-${Date.now()}`,
      mode: sessionMode,
      deliverableIds: deliverableIdsToUse,
      taskSequence,
      startedAt: Date.now(),
      status: 'active',
      currentTaskIndex: 0,
      sessionGoals: sessionGoals.length > 0 ? sessionGoals : undefined,
      autonomousAgentConfig: sessionMode === 'auto' ? {
        personality: autonomousConfig.personality || undefined,
        decisionStyle: autonomousConfig.decisionStyle || undefined,
        communicationStyle: autonomousConfig.communicationStyle || undefined,
      } : undefined,
      createdAt: Date.now(),
    };

    await entityStorage.saveAgendaSession(session);
    await awardExperience('agenda.session');
    await logContext('Agenda session started', `Mode: ${sessionMode}`, {
      scope: 'professional',
      tags: ['agenda', 'session', sessionMode],
      metadata: { deliverables: sessionDeliverableIds.join(',') },
      autoGenerated: true,
    });

    // If autonomous mode, start the agent
    if (sessionMode === 'auto') {
      await startAutonomousAgent(session);
    }

    setSessionDeliverableIds([]);
    setSessionGoals([]);
    setShowSessionConfig(false);
    load();
  };

  const startAutonomousAgent = async (session: AgendaSession) => {
    // Get all context for the autonomous agent
    const [people, brand, calendar, journal] = await Promise.all([
      entityStorage.getPeopleRecords(),
      entityStorage.getBrandRecords(),
      entityStorage.getCalendarEvents(),
      entityStorage.getJournalEntries(),
    ]);

    const sessionDeliverables = session.deliverableIds.map(id => getDeliverableById(id)).filter(Boolean);
    const sessionTasks = session.taskSequence?.map(id => items.find(i => i.id === id)).filter(Boolean) || [];

    const agentPrompt = `You are operating as an autonomous agent working on behalf of the user. Your task is to complete this workflow session autonomously.

SESSION MODE: ${session.mode === 'auto' ? 'FULLY AUTONOMOUS' : 'SEMI-AUTONOMOUS'}
${session.autonomousAgentConfig?.personality ? `PERSONALITY: ${session.autonomousAgentConfig.personality}` : ''}
${session.autonomousAgentConfig?.decisionStyle ? `DECISION STYLE: ${session.autonomousAgentConfig.decisionStyle}` : ''}
${session.autonomousAgentConfig?.communicationStyle ? `COMMUNICATION STYLE: ${session.autonomousAgentConfig.communicationStyle}` : ''}

DELIVERABLES TO COMPLETE:
${sessionDeliverables.map(d => `- ${d.title}: ${d.description}\n  Guardrails: ${d.guardrails}\n  Success: ${d.successCriteria}`).join('\n')}

TASK SEQUENCE:
${sessionTasks.map((t, idx) => `${idx + 1}. ${t.title}${t.description ? `: ${t.description}` : ''}${t.estimatedTime ? ` (${t.estimatedTime} min)` : ''}`).join('\n')}

${session.sessionGoals && session.sessionGoals.length > 0 ? `SESSION GOALS:\n${session.sessionGoals.map(g => `- ${getGoalById(g)?.title || g}`).join('\n')}` : ''}

AVAILABLE CONTEXT:
- ${people.length} people in network
- ${brand.length} brand elements
- ${calendar.length} calendar events
- ${journal.length} journal entries

${session.mode === 'auto' 
  ? `AUTONOMOUS MODE: Work through the tasks systematically. Make decisions, take actions, and complete deliverables. Act as the user would act. Use ACTION markers to create entities, update calendar, add people, etc. as needed.`
  : `SEMI-AUTONOMOUS MODE: Guide the user through the workflow. Ask questions, provide suggestions, check progress, and ensure all deliverables are completed. Be collaborative and supportive.`}

Start working through the tasks now. Provide updates as you progress.`;

    await sendMessage(agentPrompt);
  };

  const updateSessionStatus = async (session: AgendaSession, status: AgendaSession['status']) => {
    await entityStorage.saveAgendaSession({
      ...session,
      status,
      updatedAt: Date.now(),
    });
    load();
  };

  const handleSaveNotes = async () => {
    if (!activeSession) return;
    await entityStorage.saveAgendaSession({
      ...activeSession,
      notes: sessionNotes,
      updatedAt: Date.now(),
    });
    load();
  };

  const handleCompleteSession = async () => {
    if (!activeSession) return;

    // Calculate XP based on completed tasks
    const completedTasks = items.filter(item =>
      activeSession.deliverableIds.includes(item.deliverableId || '') &&
      item.status === 'done'
    );
    const xpAwarded = completedTasks.length * 10; // 10 XP per completed task
    await awardExperience('agenda.session');

    const completed: AgendaSession = {
      ...activeSession,
      status: 'completed',
      endedAt: Date.now(),
      summary: sessionSummary,
      notes: sessionNotes,
      xpAwarded,
      updatedAt: Date.now(),
    };

    await entityStorage.saveAgendaSession(completed);
    await entityStorage.savePostMortem({
      id: `mortem-${Date.now()}`,
      sessionId: completed.id,
      notes: sessionSummary,
      grade: sessionGrade ? Number(sessionGrade) : undefined,
      createdAt: Date.now(),
    });

    await logContext('Agenda session completed', sessionSummary || 'Session ended', {
      scope: 'professional',
      tags: ['agenda', 'session', 'post-mortem'],
      metadata: { sessionId: completed.id, xpAwarded },
      autoGenerated: true,
    });

    setSessionSummary('');
    setSessionGrade('');
    setActiveSession(null);
    load();
  };

  const createAgendaItem = async () => {
    if (!itemEditForm.title.trim()) return;
    const item: AgendaItem = {
      id: `agenda-${Date.now()}`,
      title: itemEditForm.title,
      description: itemEditForm.description || undefined,
      status: 'todo',
      dueAt: itemEditForm.dueAt ? new Date(itemEditForm.dueAt).getTime() : undefined,
      estimatedTime: itemEditForm.estimatedTime ? parseInt(itemEditForm.estimatedTime) : undefined,
      priority: itemEditForm.priority,
      tags: itemEditForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      deliverableId: itemEditForm.deliverableId || undefined,
      createdAt: Date.now(),
    };
    await entityStorage.saveAgendaItem(item);
    setItemEditForm({
      title: '',
      description: '',
      dueAt: '',
      estimatedTime: '',
      priority: 'medium',
      tags: '',
      deliverableId: '',
    });
    load();
  };

  const updateItemStatus = async (item: AgendaItem, status: AgendaItem['status']) => {
    await entityStorage.saveAgendaItem({
      ...item,
      status,
      completedAt: status === 'done' ? Date.now() : undefined,
    });
    await awardExperience('agenda.add');
    load();
  };

  const deleteItem = async (id: string) => {
    await entityStorage.deleteAgendaItem(id);
    load();
  };

  const saveDeliverableEdit = async () => {
    if (!editingDeliverable) return;
    await entityStorage.saveDeliverable({
      ...editingDeliverable,
      ...deliverableEditForm,
      tags: deliverableEditForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
    });
    setEditingDeliverable(null);
    load();
  };

  const deleteDeliverable = async (id: string) => {
    const associatedItems = items.filter(i => i.deliverableId === id);
    for (const item of associatedItems) {
      await entityStorage.deleteAgendaItem(item.id);
    }
    await entityStorage.deleteDeliverable(id);
    load();
  };

  const generateWorkflow = async () => {
    if (sessionDeliverableIds.length === 0) return;

    const sessionDeliverables = sessionDeliverableIds.map(id => getDeliverableById(id)).filter(Boolean);
    const [people, brand, calendar, journal] = await Promise.all([
      entityStorage.getPeopleRecords(),
      entityStorage.getBrandRecords(),
      entityStorage.getCalendarEvents(),
      entityStorage.getJournalEntries(),
    ]);

    const workflowPrompt = `Generate a detailed workflow/task sequence for these deliverables:

DELIVERABLES:
${sessionDeliverables.map(d => `- ${d.title}: ${d.description}\n  Guardrails: ${d.guardrails}\n  Success: ${d.successCriteria}`).join('\n')}

AVAILABLE CONTEXT:
- ${people.length} people in network
- ${brand.length} brand elements  
- ${calendar.length} calendar events
- ${journal.length} journal entries

Create a step-by-step workflow with specific, actionable tasks. For each task, respond with:
[ACTION:agenda.add|title|description|deliverableId|estimatedTime|priority]

Where:
- title: Task title
- description: What needs to be done
- deliverableId: One of ${sessionDeliverableIds.join(', ')}
- estimatedTime: Minutes (e.g., 30, 60, 120)
- priority: low, medium, or high

Generate 5-15 tasks that break down these deliverables into actionable steps.`;

    await sendMessage(workflowPrompt);
  };

  return (
    <PageShell
      title="Agenda"
      subtitle="Autonomous & semi-autonomous workflow builder. Set up task sequences for Sylvia to execute or guide you through."
    >
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-7 mb-6">
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-blue-50 to-blue-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <ListChecks className="w-6 h-6 text-blue-600" />
            <span className="text-2xl font-bold text-black">{stats.totalItems}</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">Total Tasks</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-green-50 to-green-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <span className="text-2xl font-bold text-black">{stats.doneItems}</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">Done</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-yellow-50 to-yellow-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-6 h-6 text-yellow-600" />
            <span className="text-2xl font-bold text-black">{stats.inProgressItems}</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">In Progress</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-gray-50 to-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <ListChecks className="w-6 h-6 text-gray-600" />
            <span className="text-2xl font-bold text-black">{stats.todoItems}</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">To Do</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-purple-50 to-purple-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-6 h-6 text-purple-600" />
            <span className="text-2xl font-bold text-black">{stats.totalDeliverables}</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">Deliverables</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-orange-50 to-orange-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <Play className="w-6 h-6 text-orange-600" />
            <span className="text-2xl font-bold text-black">{stats.activeSessions}</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">Active</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-pink-50 to-pink-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-6 h-6 text-pink-600" />
            <span className="text-2xl font-bold text-black">{stats.completedSessions}</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">Completed</p>
        </div>
      </div>

      {/* Active Session */}
      {activeSession && (
        <div className="glass-panel border border-white/70 rounded-3xl p-6 mb-6 space-y-4 bg-gradient-to-br from-purple-50/50 to-blue-50/50">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {activeSession.mode === 'auto' ? (
                  <Bot className="w-5 h-5 text-purple-600" />
                ) : activeSession.mode === 'semi-auto' ? (
                  <Users className="w-5 h-5 text-blue-600" />
                ) : (
                  <User className="w-5 h-5 text-gray-600" />
                )}
                <span className="text-xs uppercase tracking-[0.3em] text-secondary-light">
                  {activeSession.mode === 'auto' ? 'AUTONOMOUS' : activeSession.mode === 'semi-auto' ? 'SEMI-AUTONOMOUS' : 'MANUAL'} SESSION
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  activeSession.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {activeSession.status.toUpperCase()}
                </span>
              </div>
              <h3 className="text-xl font-semibold">Active Workflow Session</h3>
              <p className="text-sm text-secondary-light">
                Started {new Date(activeSession.startedAt).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              {activeSession.status === 'active' && (
                <button
                  onClick={() => updateSessionStatus(activeSession, 'paused')}
                  className="px-4 py-2 rounded-full bg-white border border-white/70 text-sm hover:bg-gray-50 transition flex items-center gap-2"
                >
                  <Pause className="w-4 h-4" />
                  Pause
                </button>
              )}
              {activeSession.status === 'paused' && (
                <button
                  onClick={() => updateSessionStatus(activeSession, 'active')}
                  className="px-4 py-2 rounded-full bg-white border border-white/70 text-sm hover:bg-gray-50 transition flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Resume
                </button>
              )}
              <button
                onClick={() => {
                  setActiveSession(null);
                  setSessionNotes('');
                }}
                className="px-4 py-2 rounded-full bg-white border border-white/70 text-sm hover:bg-gray-50 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Deliverables */}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-secondary-light mb-2">Deliverables</p>
            <div className="flex flex-wrap gap-2">
              {activeSession.deliverableIds.map(id => {
                const deliverable = getDeliverableById(id);
                return deliverable ? (
                  <span
                    key={id}
                    className="px-3 py-1 rounded-full bg-white border border-white/70 text-sm font-medium"
                  >
                    {deliverable.title}
                  </span>
                ) : null;
              })}
            </div>
          </div>

          {/* Session Goals */}
          {activeSession.sessionGoals && activeSession.sessionGoals.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-secondary-light mb-2 flex items-center gap-1">
                <Target className="w-3 h-3" />
                Session Goals
              </p>
              <div className="flex flex-wrap gap-2">
                {activeSession.sessionGoals.map(goalId => {
                  const goal = getGoalById(goalId);
                  return goal ? (
                    <span
                      key={goalId}
                      className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-medium border border-purple-200"
                    >
                      {goal.title}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Task Progress */}
          {activeSession.taskSequence && activeSession.taskSequence.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-secondary-light mb-2">
                Task Sequence ({activeSession.currentTaskIndex || 0 + 1} / {activeSession.taskSequence.length})
              </p>
              <div className="space-y-2">
                {activeSession.taskSequence.slice(0, 5).map((taskId, idx) => {
                  const task = items.find(i => i.id === taskId);
                  if (!task) return null;
                  const isCurrent = idx === (activeSession.currentTaskIndex || 0);
                  return (
                    <div
                      key={taskId}
                      className={`flex items-center gap-3 p-3 rounded-2xl border ${
                        isCurrent
                          ? 'bg-purple-100 border-purple-300'
                          : task.status === 'done'
                          ? 'bg-green-50 border-green-200 opacity-60'
                          : 'bg-white border-white/70'
                      }`}
                    >
                      {task.status === 'done' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : isCurrent ? (
                        <ArrowRight className="w-5 h-5 text-purple-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-gray-400" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{task.title}</p>
                        {task.estimatedTime && (
                          <p className="text-xs text-secondary-light">{task.estimatedTime} min</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {activeSession.taskSequence.length > 5 && (
                  <p className="text-xs text-secondary-light text-center">
                    +{activeSession.taskSequence.length - 5} more tasks
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Session Notes */}
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-secondary-light mb-2 block">
              Live Notes / Transcript
            </label>
            <textarea
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder={
                activeSession.mode === 'auto'
                  ? 'Autonomous agent is working... Notes will appear here.'
                  : activeSession.mode === 'semi-auto'
                  ? 'Jam session notes... Sylvia is guiding you through the workflow.'
                  : 'Session notes...'
              }
              rows={6}
              className="w-full rounded-2xl border border-white/70 px-4 py-3 bg-white/80 focus:outline-none focus:ring-2 focus:ring-black resize-none"
            />
            <button
              onClick={handleSaveNotes}
              className="mt-2 px-4 py-2 rounded-full bg-black text-white text-sm font-medium hover:shadow-lg transition"
            >
              Save Notes
            </button>
          </div>

          {/* Completion */}
          <div className="pt-4 border-t border-white/20 space-y-3">
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-secondary-light mb-2 block">
                Post-Mortem Summary
              </label>
              <textarea
                value={sessionSummary}
                onChange={(e) => setSessionSummary(e.target.value)}
                placeholder="What happened? What was accomplished? What did you learn?"
                rows={3}
                className="w-full rounded-2xl border border-white/70 px-4 py-3 bg-white/80 focus:outline-none focus:ring-2 focus:ring-black resize-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <select
                value={sessionGrade}
                onChange={(e) => setSessionGrade(e.target.value)}
                className="rounded-2xl border border-white/70 px-4 py-2 bg-white/80 focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">Grade Session</option>
                {[5, 4, 3, 2, 1].map(value => (
                  <option key={value} value={value}>
                    {value} ⭐
                  </option>
                ))}
              </select>
              <button
                onClick={handleCompleteSession}
                className="flex-1 px-4 py-2 rounded-2xl bg-black text-white font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Complete Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start New Session */}
      {!activeSession && (
        <div className="glass-panel border border-white/70 rounded-3xl p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Start Workflow Session
              </h3>
              <p className="text-sm text-secondary-light mt-1">
                Choose mode and deliverables to begin
              </p>
            </div>
            <button
              onClick={() => setShowSessionConfig(!showSessionConfig)}
              className="px-4 py-2 rounded-full bg-white border border-white/70 text-sm hover:bg-gray-50 transition flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Config
            </button>
          </div>

          {/* Mode Selection */}
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-secondary-light mb-2 block">
              Session Mode
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['manual', 'semi-auto', 'auto'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setSessionMode(mode)}
                  className={`p-4 rounded-2xl border transition ${
                    sessionMode === mode
                      ? 'border-black bg-black text-white shadow-lg'
                      : 'border-white/70 bg-white/80 hover:bg-white'
                  }`}
                >
                  {mode === 'auto' ? (
                    <Bot className="w-6 h-6 mx-auto mb-2" />
                  ) : mode === 'semi-auto' ? (
                    <Users className="w-6 h-6 mx-auto mb-2" />
                  ) : (
                    <User className="w-6 h-6 mx-auto mb-2" />
                  )}
                  <p className="text-sm font-semibold capitalize mb-1">
                    {mode === 'auto' ? 'Autonomous' : mode === 'semi-auto' ? 'Semi-Auto' : 'Manual'}
                  </p>
                  <p className="text-xs opacity-70">
                    {mode === 'auto'
                      ? 'Agent works independently'
                      : mode === 'semi-auto'
                      ? 'Guided collaboration'
                      : 'Full manual control'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Autonomous Config */}
          {showSessionConfig && sessionMode === 'auto' && (
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-3">
              <p className="text-sm font-semibold text-purple-900">Autonomous Agent Configuration</p>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-purple-700 mb-2 block">
                  Personality / How should the agent act?
                </label>
                <textarea
                  value={autonomousConfig.personality}
                  onChange={(e) => setAutonomousConfig({ ...autonomousConfig, personality: e.target.value })}
                  placeholder="e.g., Proactive, decisive, detail-oriented, communicates clearly..."
                  rows={2}
                  className="w-full rounded-2xl border border-purple-200 px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-purple-700 mb-2 block">
                  Decision Style
                </label>
                <input
                  value={autonomousConfig.decisionStyle}
                  onChange={(e) => setAutonomousConfig({ ...autonomousConfig, decisionStyle: e.target.value })}
                  placeholder="e.g., Fast decisions, consult context first, conservative approach..."
                  className="w-full rounded-2xl border border-purple-200 px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-purple-700 mb-2 block">
                  Communication Style
                </label>
                <input
                  value={autonomousConfig.communicationStyle}
                  onChange={(e) => setAutonomousConfig({ ...autonomousConfig, communicationStyle: e.target.value })}
                  placeholder="e.g., Concise updates, detailed reports, minimal communication..."
                  className="w-full rounded-2xl border border-purple-200 px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          )}

          {/* Deliverables Selection */}
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-secondary-light mb-2 block">
              Select Deliverables
            </label>
            {deliverables.length === 0 ? (
              <p className="text-sm text-secondary-light p-4 rounded-2xl bg-white/50 border border-dashed border-white/70">
                No deliverables yet. Tell Sylvia about what you want to achieve, or start a session and she'll help create deliverables as you work.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {deliverables.map(deliverable => (
                  <button
                    key={deliverable.id}
                    onClick={() =>
                      setSessionDeliverableIds(prev =>
                        prev.includes(deliverable.id)
                          ? prev.filter(id => id !== deliverable.id)
                          : [...prev, deliverable.id]
                      )
                    }
                    className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
                      sessionDeliverableIds.includes(deliverable.id)
                        ? 'bg-black text-white border-black'
                        : 'bg-white border-white/70 hover:bg-gray-50'
                    }`}
                  >
                    {deliverable.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Session Goals */}
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-secondary-light mb-2 block">
              Link to Goals (Optional)
            </label>
            {goals.length === 0 ? (
              <p className="text-xs text-secondary-light">No goals available. Create goals in Polaris first.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {goals.map(goal => (
                  <button
                    key={goal.id}
                    onClick={() =>
                      setSessionGoals(prev =>
                        prev.includes(goal.id)
                          ? prev.filter(id => id !== goal.id)
                          : [...prev, goal.id]
                      )
                    }
                    className={`px-3 py-1 rounded-full border text-xs font-medium transition flex items-center gap-1 ${
                      sessionGoals.includes(goal.id)
                        ? 'bg-purple-100 text-purple-700 border-purple-300'
                        : 'bg-white border-white/70 hover:bg-gray-50'
                    }`}
                  >
                    <Target className="w-3 h-3" />
                    {goal.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {sessionMode !== 'manual' && sessionDeliverableIds.length > 0 && (
              <button
                onClick={generateWorkflow}
                className="px-4 py-2 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-sm font-medium hover:bg-blue-100 transition flex items-center gap-2"
              >
                <Lightbulb className="w-4 h-4" />
                Generate Workflow
              </button>
            )}
            <button
              onClick={handleStartSession}
              className="flex-1 px-4 py-2 rounded-full bg-black text-white text-sm font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              {sessionMode === 'auto' ? (
                <>
                  <Bot className="w-4 h-4" />
                  Start Autonomous Session
                </>
              ) : sessionMode === 'semi-auto' ? (
                <>
                  <Users className="w-4 h-4" />
                  Start Jam Session
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Start Manual Session
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Deliverables Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Target className="w-6 h-6" />
              Deliverables
            </h2>
            <p className="text-sm text-secondary-light mt-1">
              Deliverables are created through conversation with Sylvia. Talk to her about what you want to achieve and she'll add them here.
            </p>
          </div>
        </div>

        {deliverables.length === 0 ? (
          <div className="glass-panel rounded-3xl border border-white/70 p-12 text-center">
            <div className="flex justify-center mb-4">
              <Target className="w-16 h-16 text-secondary-light" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No deliverables yet</h3>
            <p className="text-secondary-light">
              Tell Sylvia about the outcomes you want to achieve. She'll create deliverables here, then you can build workflows around them.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {deliverables.map(deliverable => {
              const isEditing = editingDeliverable?.id === deliverable.id;
              const deliverableItems = items.filter(i => i.deliverableId === deliverable.id);
              const completedItems = deliverableItems.filter(i => i.status === 'done').length;

              return (
                <div
                  key={deliverable.id}
                  className={`rounded-3xl border p-6 transition-all ${
                    isEditing
                      ? 'border-black bg-black text-white shadow-xl'
                      : 'border-white/70 bg-white/90 hover:shadow-lg hover:border-white'
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                          Title *
                        </label>
                        <input
                          value={deliverableEditForm.title}
                          onChange={(e) =>
                            setDeliverableEditForm({ ...deliverableEditForm, title: e.target.value })
                          }
                          className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                          placeholder="Deliverable title"
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                          Description *
                        </label>
                        <textarea
                          value={deliverableEditForm.description}
                          onChange={(e) =>
                            setDeliverableEditForm({ ...deliverableEditForm, description: e.target.value })
                          }
                          rows={3}
                          className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
                          placeholder="What needs to be delivered?"
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                          Guardrails
                        </label>
                        <textarea
                          value={deliverableEditForm.guardrails}
                          onChange={(e) =>
                            setDeliverableEditForm({ ...deliverableEditForm, guardrails: e.target.value })
                          }
                          rows={2}
                          className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
                          placeholder="Constraints, boundaries, things to avoid..."
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                          Success Criteria
                        </label>
                        <textarea
                          value={deliverableEditForm.successCriteria}
                          onChange={(e) =>
                            setDeliverableEditForm({ ...deliverableEditForm, successCriteria: e.target.value })
                          }
                          rows={2}
                          className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
                          placeholder="How will you know this is complete?"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                            Scope
                          </label>
                          <select
                            value={deliverableEditForm.scope}
                            onChange={(e) =>
                              setDeliverableEditForm({
                                ...deliverableEditForm,
                                scope: e.target.value as 'personal' | 'professional',
                              })
                            }
                            className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                          >
                            <option value="personal">Personal</option>
                            <option value="professional">Professional</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                            Priority
                          </label>
                          <select
                            value={deliverableEditForm.priority}
                            onChange={(e) =>
                              setDeliverableEditForm({
                                ...deliverableEditForm,
                                priority: e.target.value as 'low' | 'medium' | 'high',
                              })
                            }
                            className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                          Tags (comma-separated)
                        </label>
                        <input
                          value={deliverableEditForm.tags}
                          onChange={(e) =>
                            setDeliverableEditForm({ ...deliverableEditForm, tags: e.target.value })
                          }
                          className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                          placeholder="tag1, tag2, tag3"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            if (editingDeliverable.id.startsWith('deliverable-')) {
                              // New deliverable
                              await entityStorage.saveDeliverable({
                                ...editingDeliverable,
                                ...deliverableEditForm,
                                tags: deliverableEditForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
                              });
                            } else {
                              // Existing deliverable
                              await saveDeliverableEdit();
                            }
                            setEditingDeliverable(null);
                            load();
                          }}
                          className="flex-1 px-4 py-2 rounded-2xl bg-white text-black font-semibold hover:bg-gray-100 transition"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingDeliverable(null);
                            setDeliverableEditForm({
                              title: '',
                              description: '',
                              guardrails: '',
                              successCriteria: '',
                              scope: 'professional',
                              priority: 'medium',
                              tags: '',
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
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                deliverable.priority === 'high'
                                  ? 'bg-red-100 text-red-700'
                                  : deliverable.priority === 'medium'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {deliverable.priority}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">
                              {deliverable.scope}
                            </span>
                            {deliverableItems.length > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">
                                {completedItems}/{deliverableItems.length} tasks
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl font-bold mb-2">{deliverable.title}</h3>
                        </div>
                      </div>
                      <MarkdownBlock content={deliverable.description} className="text-sm mb-3" />
                      {deliverable.guardrails && (
                        <div className="mb-3 p-3 rounded-2xl bg-yellow-50 border border-yellow-100">
                          <p className="text-xs font-semibold text-yellow-900 uppercase tracking-[0.1em] mb-1">
                            Guardrails
                          </p>
                          <p className="text-xs text-yellow-700">{deliverable.guardrails}</p>
                        </div>
                      )}
                      {deliverable.successCriteria && (
                        <div className="mb-3 p-3 rounded-2xl bg-green-50 border border-green-100">
                          <p className="text-xs font-semibold text-green-900 uppercase tracking-[0.1em] mb-1">
                            Success Criteria
                          </p>
                          <p className="text-xs text-green-700">{deliverable.successCriteria}</p>
                        </div>
                      )}
                      {deliverable.tags.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-1.5">
                          {deliverable.tags.map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs border border-blue-100"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 pt-4 border-t border-white/20">
                        <button
                          onClick={() => startEditDeliverable(deliverable)}
                          className="px-3 py-1.5 rounded-full bg-white/80 border border-white/70 text-xs font-medium hover:bg-white transition flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => deleteDeliverable(deliverable.id)}
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

      {/* Search and Filter */}
      <div className="mb-6 space-y-4">
        <div className="glass-panel rounded-2xl border border-white/70 p-4">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-secondary-light" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks by title, description, tags..."
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
            onClick={() => setFilterStatus(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              filterStatus === null
                ? 'bg-black text-white'
                : 'bg-white/80 border border-white/70 hover:bg-white'
            }`}
          >
            All
          </button>
          {['todo', 'in-progress', 'done'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(filterStatus === status ? null : status)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition capitalize ${
                filterStatus === status
                  ? 'bg-black text-white'
                  : 'bg-white/80 border border-white/70 hover:bg-white'
              }`}
            >
              {status.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks List */}
      {filteredItems.length === 0 ? (
        <div className="glass-panel rounded-3xl border border-white/70 p-12 text-center">
          <div className="flex justify-center mb-4">
            <ListChecks className="w-16 h-16 text-secondary-light" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {items.length === 0 ? 'No tasks yet' : 'No matches found'}
          </h3>
          <p className="text-secondary-light">
            {items.length === 0
              ? 'Tasks are created through conversation with Sylvia or by generating workflows from deliverables. Talk to her about what needs to be done.'
              : 'Try adjusting your search or filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map(item => {
            const deliverable = item.deliverableId ? getDeliverableById(item.deliverableId) : null;
            const isEditing = editingItem?.id === item.id;

            return (
              <div
                key={item.id}
                className={`rounded-3xl border p-6 transition-all ${
                  isEditing
                    ? 'border-black bg-black text-white shadow-xl'
                    : 'border-white/70 bg-white/90 hover:shadow-lg hover:border-white'
                }`}
              >
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                        Title *
                      </label>
                      <input
                        value={itemEditForm.title}
                        onChange={(e) => setItemEditForm({ ...itemEditForm, title: e.target.value })}
                        className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                        Description
                      </label>
                      <textarea
                        value={itemEditForm.description}
                        onChange={(e) => setItemEditForm({ ...itemEditForm, description: e.target.value })}
                        rows={3}
                        className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                          Due Date
                        </label>
                        <input
                          type="datetime-local"
                          value={itemEditForm.dueAt}
                          onChange={(e) => setItemEditForm({ ...itemEditForm, dueAt: e.target.value })}
                          className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                          Estimated Time (min)
                        </label>
                        <input
                          type="number"
                          value={itemEditForm.estimatedTime}
                          onChange={(e) => setItemEditForm({ ...itemEditForm, estimatedTime: e.target.value })}
                          className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                          onClick={async () => {
                            await entityStorage.saveAgendaItem({
                              ...item,
                              title: itemEditForm.title,
                              description: itemEditForm.description || undefined,
                              dueAt: itemEditForm.dueAt ? new Date(itemEditForm.dueAt).getTime() : undefined,
                              estimatedTime: itemEditForm.estimatedTime ? parseInt(itemEditForm.estimatedTime) : undefined,
                              priority: itemEditForm.priority,
                              tags: itemEditForm.tags.split(',').map(t => t.trim()).filter(Boolean),
                              deliverableId: itemEditForm.deliverableId || undefined,
                            });
                            setEditingItem(null);
                            setItemEditForm({
                              title: '',
                              description: '',
                              dueAt: '',
                              estimatedTime: '',
                              priority: 'medium',
                              tags: '',
                              deliverableId: '',
                            });
                            load();
                          }}
                        className="flex-1 px-4 py-2 rounded-2xl bg-white text-black font-semibold hover:bg-gray-100 transition"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingItem(null);
                          setItemEditForm({
                            title: '',
                            description: '',
                            dueAt: '',
                            estimatedTime: '',
                            priority: 'medium',
                            tags: '',
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
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              item.status === 'done'
                                ? 'bg-green-100 text-green-700'
                                : item.status === 'in-progress'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {item.status.replace('-', ' ')}
                          </span>
                          {item.priority && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                item.priority === 'high'
                                  ? 'bg-red-100 text-red-700'
                                  : item.priority === 'medium'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {item.priority}
                            </span>
                          )}
                          {deliverable && (
                            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs">
                              {deliverable.title}
                            </span>
                          )}
                          {item.estimatedTime && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.estimatedTime} min
                            </span>
                          )}
                        </div>
                        <h4 className="text-xl font-bold mb-1">{item.title}</h4>
                        {item.description && (
                          <MarkdownBlock content={item.description} className="text-sm mb-2" />
                        )}
                        {item.dueAt && (
                          <p className="text-xs text-secondary-light flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Due: {new Date(item.dueAt).toLocaleString()}
                          </p>
                        )}
                        {item.tags && item.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {item.tags.map(tag => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-4 border-t border-white/20">
                      <div className="flex gap-2">
                        {(['todo', 'in-progress', 'done'] as AgendaItem['status'][]).map(status => (
                          <button
                            key={status}
                            onClick={() => updateItemStatus(item, status)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition capitalize ${
                              item.status === status
                                ? 'bg-black text-white'
                                : 'bg-white/80 border border-white/70 hover:bg-white'
                            }`}
                          >
                            {status.replace('-', ' ')}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setItemEditForm({
                            title: item.title,
                            description: item.description || '',
                            dueAt: item.dueAt ? new Date(item.dueAt).toISOString().slice(0, 16) : '',
                            estimatedTime: item.estimatedTime?.toString() || '',
                            priority: item.priority || 'medium',
                            tags: item.tags?.join(', ') || '',
                            deliverableId: item.deliverableId || '',
                          });
                        }}
                        className="px-3 py-1.5 rounded-full bg-white/80 border border-white/70 text-xs font-medium hover:bg-white transition flex items-center gap-1 ml-auto"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
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

      {/* Session History */}
      {sessions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            Session History
          </h2>
          <div className="space-y-4">
            {sessions.filter(s => s.status === 'completed').map(session => {
              const sessionDeliverables = session.deliverableIds.map(id => getDeliverableById(id)).filter(Boolean);
              const postMortem = postMortems.find(pm => pm.sessionId === session.id);

              return (
                <div
                  key={session.id}
                  className="rounded-3xl border border-white/70 bg-white/90 p-6 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {session.mode === 'auto' ? (
                          <Bot className="w-4 h-4 text-purple-600" />
                        ) : session.mode === 'semi-auto' ? (
                          <Users className="w-4 h-4 text-blue-600" />
                        ) : (
                          <User className="w-4 h-4 text-gray-600" />
                        )}
                        <span className="text-xs uppercase tracking-[0.2em] text-secondary-light">
                          {session.mode === 'auto' ? 'Autonomous' : session.mode === 'semi-auto' ? 'Semi-Auto' : 'Manual'}
                        </span>
                        <span className="text-xs text-secondary-light">
                          {new Date(session.startedAt).toLocaleDateString()}
                        </span>
                        {session.xpAwarded && (
                          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                            +{session.xpAwarded} XP
                          </span>
                        )}
                      </div>
                      <h4 className="text-lg font-semibold">
                        {sessionDeliverables.map(d => d.title).join(', ')}
                      </h4>
                    </div>
                    {postMortem?.grade && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-semibold">{postMortem.grade}/5</span>
                      </div>
                    )}
                  </div>
                  {session.summary && (
                    <MarkdownBlock content={session.summary} className="text-sm" />
                  )}
                  {postMortem && (
                    <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
                      <p className="text-xs font-semibold text-gray-900 uppercase tracking-[0.1em] mb-1">
                        Post-Mortem
                      </p>
                      <p className="text-xs text-gray-700">{postMortem.notes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default AgendaPage;
