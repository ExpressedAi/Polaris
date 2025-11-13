import React, { useEffect, useState, useCallback, useMemo } from 'react';
import PageShell from './PageShell';
import { GoalRecord, VendorTask } from '../../types';
import { entityStorage } from '../../services/storage';
import MarkdownBlock from '../MarkdownBlock';
import { subscribeToEntityUpdates } from '../../services/entityEvents';
import { sendMessage } from '../../services/api';
import { postProcessMessage } from '../../services/postProcessor';
import { executeAction } from '../../services/actionRegistry';
import { getSetting } from '../../services/storage';
import { useAppContext, ActiveEntity } from '../../context/AppContext';
import {
  Target,
  Zap,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Edit2,
  Trash2,
  Sparkles,
  BarChart3,
  Lightbulb,
  BookOpen,
  Award,
  Filter,
  Search,
  X,
  Star,
  MessageSquare,
  ArrowRight,
  RefreshCw,
  Play,
  Pause,
  Square,
  Calendar,
  Tag,
  TrendingDown,
  Activity,
  Gauge,
} from 'lucide-react';

const PolarisPage: React.FC = () => {
  const { setActiveEntity } = useAppContext();
  const [goals, setGoals] = useState<GoalRecord[]>([]);
  const [tasks, setTasks] = useState<VendorTask[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<GoalRecord | null>(null);
  const [editingGoal, setEditingGoal] = useState<GoalRecord | null>(null);
  const [editingTask, setEditingTask] = useState<VendorTask | null>(null);
  const [showTaskFeedback, setShowTaskFeedback] = useState<string | null>(null);
  const [generatingTasks, setGeneratingTasks] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGoalType, setFilterGoalType] = useState<'small' | 'big' | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterEffort, setFilterEffort] = useState<string | null>(null);
  const [filterImpact, setFilterImpact] = useState<string | null>(null);

  // Goal edit form state
  const [goalEditForm, setGoalEditForm] = useState({
    title: '',
    description: '',
    goalType: 'small' as 'small' | 'big',
    scope: 'professional' as 'personal' | 'professional',
    priority: 'medium' as 'low' | 'medium' | 'high',
    metrics: '',
  });

  // Task feedback form state
  const [feedbackForm, setFeedbackForm] = useState({
    completionNotes: '',
    outcome: 'met' as 'exceeded' | 'met' | 'below' | 'missed',
    outcomeDetails: '',
    taskQuality: 50,
    effortAccuracy: 50,
    impactAccuracy: 50,
    clarity: 50,
    helpfulness: 50,
    feedbackNotes: '',
    whatWorked: [] as string[],
    whatDidntWork: [] as string[],
    suggestions: '',
  });

  const load = useCallback(async () => {
    const [goalData, taskData] = await Promise.all([
      entityStorage.getGoals(),
      entityStorage.getVendorTasks(),
    ]);
    setGoals(goalData.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt)));
    setTasks(taskData.sort((a, b) => b.generatedAt - a.generatedAt));
  }, []);

  useEffect(() => {
    load();
    const unsubscribe = subscribeToEntityUpdates('goal', load);
    return unsubscribe;
  }, [load]);

  const filteredGoals = useMemo(() => {
    let filtered = goals;
    if (filterGoalType !== 'all') {
      filtered = filtered.filter(g => g.goalType === filterGoalType);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(g =>
        g.title.toLowerCase().includes(query) ||
        g.description.toLowerCase().includes(query) ||
        g.metrics.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [goals, filterGoalType, searchQuery]);

  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    if (selectedGoal) {
      filtered = filtered.filter(t => t.goalId === selectedGoal.id);
    }
    if (filterStatus) {
      filtered = filtered.filter(t => t.status === filterStatus);
    }
    if (filterEffort) {
      filtered = filtered.filter(t => t.estimatedEffort === filterEffort);
    }
    if (filterImpact) {
      filtered = filtered.filter(t => t.estimatedImpact === filterImpact);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.rationale?.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [tasks, selectedGoal, filterStatus, filterEffort, filterImpact, searchQuery]);

  const stats = useMemo(() => {
    const smallGoals = goals.filter(g => g.goalType === 'small').length;
    const bigGoals = goals.filter(g => g.goalType === 'big').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
    const skippedTasks = tasks.filter(t => t.status === 'skipped').length;
    const failedTasks = tasks.filter(t => t.status === 'failed').length;
    
    const tasksWithFeedback = tasks.filter(t => t.feedback);
    const avgFeedback = tasksWithFeedback.reduce((sum, t) => {
      const f = t.feedback!;
      return sum + (f.taskQuality + f.effortAccuracy + f.impactAccuracy + f.clarity + f.helpfulness) / 5;
    }, 0);
    const avgFeedbackScore = tasksWithFeedback.length > 0
      ? (avgFeedback / tasksWithFeedback.length).toFixed(1)
      : '—';

    // High-impact tasks (high or very-high impact)
    const highImpactTasks = tasks.filter(t => 
      t.estimatedImpact === 'high' || t.estimatedImpact === 'very-high'
    ).length;

    // Low-effort tasks (very-low or low effort)
    const lowEffortTasks = tasks.filter(t => 
      t.estimatedEffort === 'very-low' || t.estimatedEffort === 'low'
    ).length;

    // Completion rate
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 
      ? ((completedTasks / totalTasks) * 100).toFixed(1)
      : '0';

    return {
      smallGoals,
      bigGoals,
      pendingTasks,
      completedTasks,
      inProgressTasks,
      skippedTasks,
      failedTasks,
      avgFeedbackScore,
      highImpactTasks,
      lowEffortTasks,
      completionRate,
      totalTasks,
    };
  }, [goals, tasks]);

  const startEditGoal = (goal: GoalRecord) => {
    setEditingGoal(goal);
    setGoalEditForm({
      title: goal.title,
      description: goal.description,
      goalType: goal.goalType,
      scope: goal.scope,
      priority: goal.priority,
      metrics: goal.metrics,
    });
  };

  const saveGoalEdit = async () => {
    if (!editingGoal) return;
    await entityStorage.saveGoal({
      ...editingGoal,
      ...goalEditForm,
      updatedAt: Date.now(),
    });
    setEditingGoal(null);
    load();
  };

  const deleteGoal = async (goalId: string) => {
    // Delete associated tasks
    const goalTasks = tasks.filter(t => t.goalId === goalId);
    for (const task of goalTasks) {
      await entityStorage.deleteVendorTask(task.id);
    }
    await entityStorage.deleteGoal(goalId);
    load();
  };

  const generateTasks = async () => {
    if (!selectedGoal) return;
    setGeneratingTasks(true);
    try {
      // Get API settings
      const apiKey = await getSetting('apiKey', '');
      const secondaryApiKey = await getSetting('secondaryApiKey', '');
      const mainModel = await getSetting('mainModel', 'openrouter/polaris-alpha');
      const systemInstruction = await getSetting('systemInstruction', '');
      const weightedPrompts = await getSetting('weightedPrompts', []);
      const temperature = await getSetting('temperature', 0.7);
      const maxTokens = await getSetting('maxTokens', 128000);

      // Get all context for Sylvia
      const [people, brand, calendar, journal, agenda, concepts] = await Promise.all([
        entityStorage.getPeopleRecords(),
        entityStorage.getBrandRecords(),
        entityStorage.getCalendarEvents(),
        entityStorage.getJournalEntries(),
        entityStorage.getAgendaItems(),
        entityStorage.getConceptRecords(),
      ]);

      const contextPrompt = `You are generating high-impact, low-effort tasks for a Polaris goal. Analyze the goal and available context, then generate 10-12 specific, actionable tasks.

GOAL DETAILS:
Title: ${selectedGoal.title}
Description: ${selectedGoal.description}
Type: ${selectedGoal.goalType === 'small' ? 'Small Goal (Quick wins, short-term)' : 'Big Goal (Long-term, strategic)'}
Scope: ${selectedGoal.scope}
Priority: ${selectedGoal.priority}
Success Metrics: ${selectedGoal.metrics || 'Not specified'}

AVAILABLE CONTEXT:
- ${people.length} people in network (with connections, attributes, profiles)
- ${brand.length} brand elements (voice, positioning, messaging)
- ${calendar.length} calendar events (meetings, deadlines, commitments)
- ${journal.length} journal entries (insights, reflections, learnings)
- ${agenda.length} agenda items (tasks, deliverables)
- ${concepts.length} concepts (ideas, applications, technologies)

TASK GENERATION CRITERIA:
1. HIGH IMPACT: Tasks must move the needle significantly toward achieving this goal
2. LOW EFFORT: Tasks should be quick wins that leverage existing resources and context
3. SPECIFIC & ACTIONABLE: Each task must be concrete and executable, not vague
4. CONTEXT-AWARE: Leverage the available context (people, brand, calendar, journal, agenda, concepts)
5. SEQUENCED: Consider task dependencies and logical order

For each task, you MUST respond with exactly this format:
[ACTION:polaris.task|${selectedGoal.id}|title|description|rationale|estimatedEffort|estimatedImpact]

Where:
- title: Short, clear task title (3-8 words)
- description: Detailed description of what needs to be done (1-3 sentences)
- rationale: Why this task helps achieve the goal (1-2 sentences explaining the connection)
- estimatedEffort: very-low, low, medium, or high
- estimatedImpact: very-low, low, medium, high, or very-high

Generate 10-12 tasks now. Focus on tasks that are HIGH IMPACT and LOW EFFORT. Use ACTION markers only - no other text.`;

      // Call API directly (not through chat)
      const response = await sendMessage(
        [
          {
            role: 'system',
            content: systemInstruction || 'You are Sylvia, an AI assistant that generates high-impact, low-effort tasks for goals.',
          },
          {
            role: 'user',
            content: contextPrompt,
          },
        ],
        {
          apiKey: apiKey || secondaryApiKey,
          mainModel,
          weightedPrompts,
          temperature: 0.7, // Lower temperature for more focused task generation
          maxTokens: 4000,
        }
      );

      // Parse and execute ACTION markers
      console.log('API Response:', response); // Debug log
      const actionMatches = response.match(/\[ACTION:([^\]]+)\]/g);
      console.log('Found ACTION markers:', actionMatches?.length || 0);
      
      await postProcessMessage(response);
      
      // Reload to show new tasks
      await load();
    } catch (error) {
      console.error('Failed to generate tasks:', error);
      alert(`Failed to generate tasks: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setGeneratingTasks(false);
    }
  };

  const startTaskFeedback = (task: VendorTask) => {
    setEditingTask(task);
    setShowTaskFeedback(task.id);
    setFeedbackForm({
      completionNotes: task.completionNotes || '',
      outcome: task.outcome || 'met',
      outcomeDetails: task.outcomeDetails || '',
      taskQuality: task.feedback?.taskQuality || 50,
      effortAccuracy: task.feedback?.effortAccuracy || 50,
      impactAccuracy: task.feedback?.impactAccuracy || 50,
      clarity: task.feedback?.clarity || 50,
      helpfulness: task.feedback?.helpfulness || 50,
      feedbackNotes: task.feedback?.notes || '',
      whatWorked: task.learningData?.whatWorked || [],
      whatDidntWork: task.learningData?.whatDidntWork || [],
      suggestions: task.learningData?.suggestions || '',
    });
  };

  const saveTaskFeedback = async () => {
    if (!editingTask) return;
    await entityStorage.saveVendorTask({
      ...editingTask,
      status: 'completed',
      completedAt: Date.now(),
      completionNotes: feedbackForm.completionNotes,
      outcome: feedbackForm.outcome,
      outcomeDetails: feedbackForm.outcomeDetails,
      feedback: {
        taskQuality: feedbackForm.taskQuality,
        effortAccuracy: feedbackForm.effortAccuracy,
        impactAccuracy: feedbackForm.impactAccuracy,
        clarity: feedbackForm.clarity,
        helpfulness: feedbackForm.helpfulness,
        notes: feedbackForm.feedbackNotes,
      },
      learningData: {
        whatWorked: feedbackForm.whatWorked,
        whatDidntWork: feedbackForm.whatDidntWork,
        suggestions: feedbackForm.suggestions,
      },
      updatedAt: Date.now(),
    });
    setShowTaskFeedback(null);
    setEditingTask(null);
    load();
  };

  const updateTaskStatus = async (task: VendorTask, status: VendorTask['status']) => {
    await entityStorage.saveVendorTask({
      ...task,
      status,
      updatedAt: Date.now(),
    });
    load();
  };

  const deleteTask = async (taskId: string) => {
    await entityStorage.deleteVendorTask(taskId);
    load();
  };

  const getGoalById = (id: string) => goals.find(g => g.id === id);

  const getEffortColor = (effort: VendorTask['estimatedEffort']) => {
    const colors = {
      'very-low': 'text-green-700 bg-green-100 border-green-200',
      'low': 'text-green-600 bg-green-50 border-green-100',
      'medium': 'text-yellow-600 bg-yellow-50 border-yellow-100',
      'high': 'text-red-600 bg-red-50 border-red-100',
    };
    return colors[effort] || colors.medium;
  };

  const getImpactColor = (impact: VendorTask['estimatedImpact']) => {
    const colors = {
      'very-low': 'text-gray-600 bg-gray-50 border-gray-100',
      'low': 'text-gray-600 bg-gray-50 border-gray-100',
      'medium': 'text-blue-600 bg-blue-50 border-blue-100',
      'high': 'text-purple-600 bg-purple-50 border-purple-100',
      'very-high': 'text-purple-700 bg-purple-100 border-purple-200',
    };
    return colors[impact] || colors.medium;
  };

  const getStatusColor = (status: VendorTask['status']) => {
    const colors = {
      'pending': 'text-gray-600 bg-gray-50 border-gray-100',
      'in-progress': 'text-blue-600 bg-blue-50 border-blue-100',
      'completed': 'text-green-600 bg-green-50 border-green-100',
      'skipped': 'text-yellow-600 bg-yellow-50 border-yellow-100',
      'failed': 'text-red-600 bg-red-50 border-red-100',
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status: VendorTask['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'in-progress':
        return <Play className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'skipped':
        return <XCircle className="w-4 h-4" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <PageShell
      title="Polaris"
      subtitle="North Star goals meet high-impact, low-effort tasks. Sylvia learns from every outcome to get better."
    >
      {/* Enhanced Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-blue-50 to-blue-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-6 h-6 text-blue-600" />
            <span className="text-2xl font-bold text-black">{stats.smallGoals}</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">Small Goals</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-purple-50 to-purple-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-6 h-6 text-purple-600" />
            <span className="text-2xl font-bold text-black">{stats.bigGoals}</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">Big Goals</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-yellow-50 to-yellow-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-6 h-6 text-yellow-600" />
            <span className="text-2xl font-bold text-black">{stats.pendingTasks}</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">Pending</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-green-50 to-green-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <span className="text-2xl font-bold text-black">{stats.completedTasks}</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">Completed</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-orange-50 to-orange-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <Zap className="w-6 h-6 text-orange-600" />
            <span className="text-2xl font-bold text-black">{stats.inProgressTasks}</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">In Progress</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-pink-50 to-pink-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-6 h-6 text-pink-600" />
            <span className="text-2xl font-bold text-black">{stats.avgFeedbackScore}</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">Avg Score</p>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-indigo-50 to-indigo-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            <span className="text-2xl font-bold text-black">{stats.highImpactTasks}</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">High Impact</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-emerald-50 to-emerald-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <Gauge className="w-6 h-6 text-emerald-600" />
            <span className="text-2xl font-bold text-black">{stats.lowEffortTasks}</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">Low Effort</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-cyan-50 to-cyan-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-6 h-6 text-cyan-600" />
            <span className="text-2xl font-bold text-black">{stats.completionRate}%</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">Complete Rate</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-rose-50 to-rose-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-6 h-6 text-rose-600" />
            <span className="text-2xl font-bold text-black">{stats.totalTasks}</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">Total Tasks</p>
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
              placeholder="Search goals or tasks..."
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
            Filter Goals:
          </span>
          <button
            onClick={() => setFilterGoalType('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              filterGoalType === 'all'
                ? 'bg-black text-white'
                : 'bg-white/80 border border-white/70 hover:bg-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterGoalType('small')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              filterGoalType === 'small'
                ? 'bg-black text-white'
                : 'bg-white/80 border border-white/70 hover:bg-white'
            }`}
          >
            Small Goals
          </button>
          <button
            onClick={() => setFilterGoalType('big')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              filterGoalType === 'big'
                ? 'bg-black text-white'
                : 'bg-white/80 border border-white/70 hover:bg-white'
            }`}
          >
            Big Goals
          </button>
          {selectedGoal && (
            <>
              <span className="text-xs text-secondary-light mx-2">|</span>
              <span className="text-xs text-secondary-light">Task Filters:</span>
              <button
                onClick={() => {
                  setFilterStatus(null);
                  setFilterEffort(null);
                  setFilterImpact(null);
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  filterStatus === null && filterEffort === null && filterImpact === null
                    ? 'bg-black text-white'
                    : 'bg-white/80 border border-white/70'
                }`}
              >
                All Tasks
              </button>
              {['pending', 'in-progress', 'completed', 'skipped', 'failed'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(filterStatus === status ? null : status)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition capitalize ${
                    filterStatus === status
                      ? 'bg-black text-white'
                      : 'bg-white/80 border border-white/70'
                  }`}
                >
                  {status.replace('-', ' ')}
                </button>
              ))}
              <span className="text-xs text-secondary-light mx-2">|</span>
              <span className="text-xs text-secondary-light">Effort:</span>
              {['very-low', 'low', 'medium', 'high'].map(effort => (
                <button
                  key={effort}
                  onClick={() => setFilterEffort(filterEffort === effort ? null : effort)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition capitalize ${
                    filterEffort === effort
                      ? 'bg-black text-white'
                      : 'bg-white/80 border border-white/70'
                  }`}
                >
                  {effort.replace('-', ' ')}
                </button>
              ))}
              <span className="text-xs text-secondary-light mx-2">|</span>
              <span className="text-xs text-secondary-light">Impact:</span>
              {['very-low', 'low', 'medium', 'high', 'very-high'].map(impact => (
                <button
                  key={impact}
                  onClick={() => setFilterImpact(filterImpact === impact ? null : impact)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition capitalize ${
                    filterImpact === impact
                      ? 'bg-black text-white'
                      : 'bg-white/80 border border-white/70'
                  }`}
                >
                  {impact.replace('-', ' ')}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Goals Section - NO MANUAL FORMS */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Target className="w-6 h-6" />
              Goals
            </h2>
            <p className="text-sm text-secondary-light mt-1">
              Goals are created through conversation with Sylvia. Talk to her about your goals and she'll add them here.
            </p>
          </div>
        </div>

        {/* Goals Grid */}
        {filteredGoals.length === 0 ? (
          <div className="glass-panel rounded-3xl border border-white/70 p-12 text-center">
            <div className="flex justify-center mb-4">
              <Target className="w-16 h-16 text-secondary-light" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {goals.length === 0 ? 'No goals yet' : 'No matches found'}
            </h3>
            <p className="text-secondary-light">
              {goals.length === 0
                ? "Tell Sylvia about your goals in the chat. She'll automatically add them here, then you can generate high-impact, low-effort tasks."
                : 'Try adjusting your search or filters.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredGoals.map(goal => {
              const goalTasks = tasks.filter(t => t.goalId === goal.id);
              const isEditing = editingGoal?.id === goal.id;
              const isSelected = selectedGoal?.id === goal.id;
              const completedGoalTasks = goalTasks.filter(t => t.status === 'completed').length;
              const totalGoalTasks = goalTasks.length;
              const goalProgress = totalGoalTasks > 0 ? (completedGoalTasks / totalGoalTasks) * 100 : 0;

              return (
                <div
                  key={goal.id}
                  className={`rounded-3xl border p-6 transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50 shadow-lg'
                      : isEditing
                      ? 'border-black bg-black text-white shadow-xl'
                      : 'border-white/70 bg-white/90 hover:shadow-lg hover:border-white'
                  }`}
                  onClick={() => {
                    if (!isEditing) {
                      const newSelected = isSelected ? null : goal;
                      setSelectedGoal(newSelected);
                      if (newSelected) {
                        setActiveEntity({ type: 'goal', id: newSelected.id, data: newSelected });
                      } else {
                        setActiveEntity({ type: null, id: '' });
                      }
                    }
                  }}
                >
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                          Title *
                        </label>
                        <input
                          value={goalEditForm.title}
                          onChange={(e) => setGoalEditForm({ ...goalEditForm, title: e.target.value })}
                          className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                          Goal Type
                        </label>
                        <select
                          value={goalEditForm.goalType}
                          onChange={(e) => setGoalEditForm({ ...goalEditForm, goalType: e.target.value as 'small' | 'big' })}
                          className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                        >
                          <option value="small">Small Goal</option>
                          <option value="big">Big Goal</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                          Description *
                        </label>
                        <textarea
                          value={goalEditForm.description}
                          onChange={(e) => setGoalEditForm({ ...goalEditForm, description: e.target.value })}
                          rows={4}
                          className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                          Metrics
                        </label>
                        <input
                          value={goalEditForm.metrics}
                          onChange={(e) => setGoalEditForm({ ...goalEditForm, metrics: e.target.value })}
                          className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                            Scope
                          </label>
                          <select
                            value={goalEditForm.scope}
                            onChange={(e) => setGoalEditForm({ ...goalEditForm, scope: e.target.value as 'personal' | 'professional' })}
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
                            value={goalEditForm.priority}
                            onChange={(e) => setGoalEditForm({ ...goalEditForm, priority: e.target.value as 'low' | 'medium' | 'high' })}
                            className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={saveGoalEdit}
                          className="flex-1 px-4 py-2 rounded-2xl bg-white text-black font-semibold hover:bg-gray-100 transition"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingGoal(null);
                            setGoalEditForm({
                              title: '',
                              description: '',
                              goalType: 'small',
                              scope: 'professional',
                              priority: 'medium',
                              metrics: '',
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
                                goal.goalType === 'big'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {goal.goalType === 'big' ? 'Big Goal' : 'Small Goal'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">
                              {goal.scope}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs ${
                                goal.priority === 'high'
                                  ? 'bg-red-100 text-red-700'
                                  : goal.priority === 'medium'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {goal.priority}
                            </span>
                            {totalGoalTasks > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                                {completedGoalTasks}/{totalGoalTasks} tasks
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl font-bold mb-2">{goal.title}</h3>
                        </div>
                      </div>
                      <MarkdownBlock content={goal.description} className="text-sm mb-3" />
                      {goal.metrics && (
                        <p className="text-xs text-secondary-light mb-3">
                          <strong>Metrics:</strong> {goal.metrics}
                        </p>
                      )}
                      {totalGoalTasks > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-secondary-light">Progress</span>
                            <span className="text-xs font-semibold">{goalProgress.toFixed(0)}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all"
                              style={{ width: `${goalProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2 pt-4 border-t border-white/20">
                        <div className="flex items-center gap-2 text-xs text-secondary-light">
                          <Lightbulb className="w-4 h-4" />
                          <span>{totalGoalTasks} tasks</span>
                        </div>
                        <div className="flex gap-2 ml-auto">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditGoal(goal);
                            }}
                            className="px-3 py-1.5 rounded-full bg-white/80 border border-white/70 text-xs font-medium hover:bg-white transition flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteGoal(goal.id);
                            }}
                            className="px-3 py-1.5 rounded-full bg-white/80 border border-white/70 text-xs font-medium hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
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
      </div>

      {/* Tasks Section - Only show when a goal is selected */}
      {selectedGoal && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Sparkles className="w-6 h-6" />
                Tasks for: {selectedGoal.title}
              </h2>
              <p className="text-sm text-secondary-light mt-1">
                High-impact, low-effort tasks generated by Sylvia. Track progress and provide feedback to help her learn.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedGoal(null)}
                className="px-3 py-1.5 rounded-full bg-white/80 border border-white/70 text-xs font-medium hover:bg-white transition"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={generateTasks}
                disabled={generatingTasks}
                className="px-4 py-2 rounded-full bg-black text-white text-sm font-medium hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
              >
                {generatingTasks ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Tasks
                  </>
                )}
              </button>
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="glass-panel rounded-3xl border border-white/70 p-12 text-center">
              <div className="flex justify-center mb-4">
                <Lightbulb className="w-16 h-16 text-secondary-light" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No tasks yet</h3>
              <p className="text-secondary-light mb-4">
                Click "Generate Tasks" to have Sylvia analyze your goal and create 10-12 high-impact, low-effort tasks.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map(task => {
                const isEditing = editingTask?.id === task.id;
                const showFeedback = showTaskFeedback === task.id;
                const goal = getGoalById(task.goalId);

                return (
                  <div
                    key={task.id}
                    className={`rounded-3xl border p-6 transition-all ${
                      isEditing || showFeedback
                        ? 'border-black bg-black text-white shadow-xl'
                        : 'border-white/70 bg-white/90 hover:shadow-lg hover:border-white'
                    }`}
                  >
                    {isEditing || showFeedback ? (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold mb-4">Task Feedback & Learning</h3>

                        {/* Completion Notes */}
                        <div>
                          <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                            What happened? (Completion Notes)
                          </label>
                          <textarea
                            value={feedbackForm.completionNotes}
                            onChange={(e) => setFeedbackForm({ ...feedbackForm, completionNotes: e.target.value })}
                            rows={3}
                            placeholder="Describe what you did, what happened, any challenges..."
                            className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
                          />
                        </div>

                        {/* Outcome */}
                        <div>
                          <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                            Outcome
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {(['exceeded', 'met', 'below', 'missed'] as const).map(outcome => (
                              <button
                                key={outcome}
                                onClick={() => setFeedbackForm({ ...feedbackForm, outcome })}
                                className={`px-3 py-2 rounded-2xl text-sm font-medium transition ${
                                  feedbackForm.outcome === outcome
                                    ? 'bg-white text-black'
                                    : 'bg-white/10 text-white border border-white/30'
                                }`}
                              >
                                {outcome.charAt(0).toUpperCase() + outcome.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Outcome Details */}
                        <div>
                          <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                            Outcome Details
                          </label>
                          <textarea
                            value={feedbackForm.outcomeDetails}
                            onChange={(e) => setFeedbackForm({ ...feedbackForm, outcomeDetails: e.target.value })}
                            rows={2}
                            placeholder="Explain the outcome in detail..."
                            className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
                          />
                        </div>

                        {/* Feedback Ratings */}
                        <div>
                          <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-3 block">
                            Rate This Task (1-100)
                          </label>
                          <div className="space-y-3">
                            {[
                              { key: 'taskQuality', label: 'Task Quality', desc: 'Was this a good task?' },
                              { key: 'effortAccuracy', label: 'Effort Accuracy', desc: 'Was effort estimate accurate?' },
                              { key: 'impactAccuracy', label: 'Impact Accuracy', desc: 'Was impact estimate accurate?' },
                              { key: 'clarity', label: 'Clarity', desc: 'Was the task clear?' },
                              { key: 'helpfulness', label: 'Helpfulness', desc: 'How helpful was this task?' },
                            ].map(({ key, label, desc }) => (
                              <div key={key}>
                                <div className="flex items-center justify-between mb-1">
                                  <div>
                                    <span className="text-sm font-medium">{label}</span>
                                    <span className="text-xs text-white/60 ml-2">{desc}</span>
                                  </div>
                                  <span className="text-sm font-semibold">
                                    {feedbackForm[key as keyof typeof feedbackForm] as number}
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min="1"
                                  max="100"
                                  value={feedbackForm[key as keyof typeof feedbackForm] as number}
                                  onChange={(e) =>
                                    setFeedbackForm({
                                      ...feedbackForm,
                                      [key]: parseInt(e.target.value),
                                    })
                                  }
                                  className="w-full"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Additional Feedback */}
                        <div>
                          <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                            Additional Feedback Notes
                          </label>
                          <textarea
                            value={feedbackForm.feedbackNotes}
                            onChange={(e) => setFeedbackForm({ ...feedbackForm, feedbackNotes: e.target.value })}
                            rows={2}
                            placeholder="Any other feedback for Sylvia..."
                            className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
                          />
                        </div>

                        {/* Learning Data */}
                        <div>
                          <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                            What Worked? (comma-separated)
                          </label>
                          <input
                            value={feedbackForm.whatWorked.join(', ')}
                            onChange={(e) =>
                              setFeedbackForm({
                                ...feedbackForm,
                                whatWorked: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                              })
                            }
                            placeholder="e.g., Clear instructions, right timing, leveraged existing resources"
                            className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                          />
                        </div>

                        <div>
                          <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                            What Didn't Work? (comma-separated)
                          </label>
                          <input
                            value={feedbackForm.whatDidntWork.join(', ')}
                            onChange={(e) =>
                              setFeedbackForm({
                                ...feedbackForm,
                                whatDidntWork: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                              })
                            }
                            placeholder="e.g., Too vague, wrong approach, missing context"
                            className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                          />
                        </div>

                        <div>
                          <label className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2 block">
                            Suggestions for Better Tasks
                          </label>
                          <textarea
                            value={feedbackForm.suggestions}
                            onChange={(e) => setFeedbackForm({ ...feedbackForm, suggestions: e.target.value })}
                            rows={2}
                            placeholder="How could Sylvia generate better tasks next time?"
                            className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={saveTaskFeedback}
                            className="flex-1 px-4 py-2 rounded-2xl bg-white text-black font-semibold hover:bg-gray-100 transition"
                          >
                            Save Feedback
                          </button>
                          <button
                            onClick={() => {
                              setShowTaskFeedback(null);
                              setEditingTask(null);
                            }}
                            className="px-4 py-2 rounded-2xl bg-white/20 text-white border border-white/30 hover:bg-white/30 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Task View */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1 ${getStatusColor(task.status)}`}>
                                {getStatusIcon(task.status)}
                                {task.status.replace('-', ' ')}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getEffortColor(task.estimatedEffort)}`}>
                                Effort: {task.estimatedEffort.replace('-', ' ')}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getImpactColor(task.estimatedImpact)}`}>
                                Impact: {task.estimatedImpact.replace('-', ' ')}
                              </span>
                              {task.completedAt && (
                                <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs border border-green-100 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(task.completedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <h4 className="text-xl font-bold mb-2">{task.title}</h4>
                          </div>
                        </div>

                        <MarkdownBlock content={task.description} className="text-sm mb-3" />

                        {task.rationale && (
                          <div className="mb-3 p-3 rounded-2xl bg-blue-50 border border-blue-100">
                            <div className="flex items-center gap-2 mb-1">
                              <Lightbulb className="w-4 h-4 text-blue-600" />
                              <span className="text-xs font-semibold text-blue-900 uppercase tracking-[0.1em]">
                                Why This Task?
                              </span>
                            </div>
                            <p className="text-xs text-blue-700">{task.rationale}</p>
                          </div>
                        )}

                        {task.completionNotes && (
                          <div className="mb-3 p-3 rounded-2xl bg-green-50 border border-green-100">
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              <span className="text-xs font-semibold text-green-900 uppercase tracking-[0.1em]">
                                Completion Notes
                              </span>
                            </div>
                            <p className="text-xs text-green-700">{task.completionNotes}</p>
                            {task.outcome && (
                              <div className="mt-2">
                                <span className="text-xs font-semibold text-green-900">Outcome: </span>
                                <span className="text-xs text-green-700 capitalize">{task.outcome}</span>
                              </div>
                            )}
                            {task.outcomeDetails && (
                              <p className="text-xs text-green-700 mt-1">{task.outcomeDetails}</p>
                            )}
                          </div>
                        )}

                        {task.feedback && (
                          <div className="mb-3 p-3 rounded-2xl bg-purple-50 border border-purple-100">
                            <div className="flex items-center gap-2 mb-2">
                              <Award className="w-4 h-4 text-purple-600" />
                              <span className="text-xs font-semibold text-purple-900 uppercase tracking-[0.1em]">
                                Feedback Scores
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-purple-700">Quality: </span>
                                <span className="font-semibold text-purple-900">{task.feedback.taskQuality}/100</span>
                              </div>
                              <div>
                                <span className="text-purple-700">Effort Accuracy: </span>
                                <span className="font-semibold text-purple-900">{task.feedback.effortAccuracy}/100</span>
                              </div>
                              <div>
                                <span className="text-purple-700">Impact Accuracy: </span>
                                <span className="font-semibold text-purple-900">{task.feedback.impactAccuracy}/100</span>
                              </div>
                              <div>
                                <span className="text-purple-700">Clarity: </span>
                                <span className="font-semibold text-purple-900">{task.feedback.clarity}/100</span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-purple-700">Helpfulness: </span>
                                <span className="font-semibold text-purple-900">{task.feedback.helpfulness}/100</span>
                              </div>
                            </div>
                            {task.feedback.notes && (
                              <p className="text-xs text-purple-700 mt-2">{task.feedback.notes}</p>
                            )}
                          </div>
                        )}

                        {task.learningData && (
                          <div className="mb-3 p-3 rounded-2xl bg-indigo-50 border border-indigo-100">
                            <div className="flex items-center gap-2 mb-2">
                              <BookOpen className="w-4 h-4 text-indigo-600" />
                              <span className="text-xs font-semibold text-indigo-900 uppercase tracking-[0.1em]">
                                Learning Data
                              </span>
                            </div>
                            {task.learningData.whatWorked && task.learningData.whatWorked.length > 0 && (
                              <div className="mb-2">
                                <span className="text-xs font-semibold text-indigo-900">What Worked: </span>
                                <span className="text-xs text-indigo-700">{task.learningData.whatWorked.join(', ')}</span>
                              </div>
                            )}
                            {task.learningData.whatDidntWork && task.learningData.whatDidntWork.length > 0 && (
                              <div className="mb-2">
                                <span className="text-xs font-semibold text-indigo-900">What Didn't Work: </span>
                                <span className="text-xs text-indigo-700">{task.learningData.whatDidntWork.join(', ')}</span>
                              </div>
                            )}
                            {task.learningData.suggestions && (
                              <div>
                                <span className="text-xs font-semibold text-indigo-900">Suggestions: </span>
                                <span className="text-xs text-indigo-700">{task.learningData.suggestions}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-4 border-t border-white/20">
                          {task.status !== 'completed' && (
                            <>
                              {task.status === 'pending' && (
                                <button
                                  onClick={() => updateTaskStatus(task, 'in-progress')}
                                  className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition flex items-center gap-1 border border-blue-100"
                                >
                                  <Play className="w-3 h-3" />
                                  Start
                                </button>
                              )}
                              {task.status === 'in-progress' && (
                                <button
                                  onClick={() => startTaskFeedback(task)}
                                  className="px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition flex items-center gap-1 border border-green-100"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  Complete & Feedback
                                </button>
                              )}
                              <button
                                onClick={() => updateTaskStatus(task, 'skipped')}
                                className="px-3 py-1.5 rounded-full bg-yellow-50 text-yellow-700 text-xs font-medium hover:bg-yellow-100 transition border border-yellow-100"
                              >
                                Skip
                              </button>
                              <button
                                onClick={() => updateTaskStatus(task, 'failed')}
                                className="px-3 py-1.5 rounded-full bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100 transition border border-red-100"
                              >
                                Failed
                              </button>
                            </>
                          )}
                          {task.status === 'completed' && !task.feedback && (
                            <button
                              onClick={() => startTaskFeedback(task)}
                              className="px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 text-xs font-medium hover:bg-purple-100 transition flex items-center gap-1 border border-purple-100"
                            >
                              <MessageSquare className="w-3 h-3" />
                              Add Feedback
                            </button>
                          )}
                          {task.status === 'completed' && task.feedback && (
                            <button
                              onClick={() => startTaskFeedback(task)}
                              className="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium hover:bg-indigo-100 transition flex items-center gap-1 border border-indigo-100"
                            >
                              <Edit2 className="w-3 h-3" />
                              Edit Feedback
                            </button>
                          )}
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="px-3 py-1.5 rounded-full bg-white/80 border border-white/70 text-xs font-medium hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition flex items-center gap-1 ml-auto"
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
      )}
    </PageShell>
  );
};

export default PolarisPage;
