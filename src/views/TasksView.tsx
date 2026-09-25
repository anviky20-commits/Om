import React, { useState, useRef, useEffect } from 'react';
import {
  Plus, CheckSquare, Trash2, Calendar, Target, CheckCircle2,
  Circle, Edit3, Search, Filter, Check, Clock, AlertCircle,
  Download, FileText, Save, History, Layers, ArrowRight, Sparkles
} from 'lucide-react';
import { Task, TaskDomain, TaskPriority, DailyPlanner, Goal } from '../types';
import { storage, generateUUID } from '../lib/storage';
import { ConfirmModal } from '../components/ConfirmModal';

interface TasksViewProps {
  tasks: Task[];
  goals: Goal[];
  dailyPlanner?: DailyPlanner;
  onRefresh: () => void;
  onSuccess: (msg: string) => void;
}

interface SavedTargetRecord {
  id: string;
  date: string;
  target: string;
  progress: number;
  pointsCount: number;
  pointsDone: number;
  savedAt: number;
  raw: DailyPlanner;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  goals,
  dailyPlanner,
  onRefresh,
  onSuccess
}) => {
  const today = new Date().toISOString().slice(0, 10);
  const [activeSubMenu, setActiveSubMenu] = useState<'roster' | 'dailyCommand' | 'timeline' | 'kanban'>('roster');

  // Task Roster filters
  const [filterTab, setFilterTab] = useState<'all' | 'today' | 'high' | 'work' | 'personal' | 'done'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // New/Edit task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState<TaskDomain>('work');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [dueAt, setDueAt] = useState(today);
  const [goalId, setGoalId] = useState<string>('');

  const formRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Daily Command Center state
  const [plannerTarget, setPlannerTarget] = useState(dailyPlanner?.target || '');
  const [plannerProgress, setPlannerProgress] = useState(dailyPlanner?.progress ?? 0);
  const [pointText, setPointText] = useState('');
  const [dailyWins, setDailyWins] = useState(dailyPlanner?.wins?.join('\n') || '');
  const [eveningReview, setEveningReview] = useState(dailyPlanner?.reflection?.join('\n') || '');
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string | null>(null);
  const [savedTargetsArchive, setSavedTargetsArchive] = useState<SavedTargetRecord[]>([]);

  // Synchronize Daily Planner state whenever dailyPlanner prop updates from storage
  useEffect(() => {
    if (dailyPlanner) {
      if (dailyPlanner.target !== undefined) setPlannerTarget(dailyPlanner.target);
      if (dailyPlanner.progress !== undefined) setPlannerProgress(dailyPlanner.progress);
      if (dailyPlanner.wins) setDailyWins(dailyPlanner.wins.join('\n'));
      if (dailyPlanner.reflection) setEveningReview(dailyPlanner.reflection.join('\n'));
    }
  }, [dailyPlanner]);

  // Load Saved Target Files & Records from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('om-saved-command-targets');
      if (stored) {
        setSavedTargetsArchive(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const handleCreateOrUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const now = Date.now();
    if (editingTaskId) {
      const existing = tasks.find(t => t.id === editingTaskId);
      if (existing) {
        const updated: Task = {
          ...existing,
          title: title.trim(),
          description: description.trim() || undefined,
          domain,
          priority,
          dueAt,
          date: dueAt,
          goalId: goalId || null,
          updatedAt: now
        };
        await storage.put('tasks', updated);
        onSuccess('✓ Task updated');
      }
      setEditingTaskId(null);
    } else {
      const newTask: Task = {
        id: generateUUID(),
        title: title.trim(),
        description: description.trim() || undefined,
        domain,
        priority,
        dueAt,
        date: dueAt,
        goalId: goalId || null,
        done: false,
        status: 'open',
        createdAt: now,
        updatedAt: now
      };
      await storage.put('tasks', newTask);
      onSuccess('✓ Task added to planner');
    }

    setTitle('');
    setDescription('');
    onRefresh();
  };

  const handleEditClick = (task: Task) => {
    setActiveSubMenu('roster');
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description || '');
    setDomain(task.domain || 'work');
    setPriority(task.priority || 'Medium');
    setDueAt(task.dueAt || today);
    setGoalId(task.goalId || '');

    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 150);
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setTitle('');
    setDescription('');
  };

  const handleToggleTask = async (task: Task) => {
    const updated: Task = {
      ...task,
      done: !task.done,
      status: !task.done ? 'done' : 'open',
      updatedAt: Date.now()
    };
    await storage.put('tasks', updated);
    onRefresh();
  };

  const handleUpdateTaskStatus = async (task: Task, status: 'open' | 'in-progress' | 'done') => {
    const updated: Task = {
      ...task,
      status,
      done: status === 'done',
      updatedAt: Date.now()
    };
    await storage.put('tasks', updated);
    onSuccess(`Task moved to ${status}`);
    onRefresh();
  };

  const handleDeleteTask = (task: Task) => {
    setTaskToDelete(task);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      await storage.delete('tasks', taskToDelete.id);
      onSuccess('✓ Task deleted');
      setTaskToDelete(null);
      if (editingTaskId === taskToDelete.id) {
        handleCancelEdit();
      }
      onRefresh();
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  };

  // Save Daily Command Target
  const handleSavePlannerTarget = async () => {
    const appSettings = (await storage.getSingleton<any>('appSettings')) || {};
    const winsArray = dailyWins.split('\n').map(s => s.trim()).filter(Boolean);
    const reflArray = eveningReview.split('\n').map(s => s.trim()).filter(Boolean);

    const updatedPlanner: DailyPlanner = {
      date: today,
      target: plannerTarget,
      progress: plannerProgress,
      points: dailyPlanner?.points || [],
      wins: winsArray,
      reflection: reflArray
    };

    appSettings.dailyPlanner = updatedPlanner;
    await storage.setSingleton('appSettings', appSettings);

    // Save to Persistent History Archive
    const pointsList = updatedPlanner.points || [];
    const newRecord: SavedTargetRecord = {
      id: generateUUID(),
      date: today,
      target: plannerTarget || 'Daily Command Target',
      progress: plannerProgress,
      pointsCount: pointsList.length,
      pointsDone: pointsList.filter(p => p.done).length,
      savedAt: Date.now(),
      raw: updatedPlanner
    };

    const updatedArchive = [newRecord, ...savedTargetsArchive.filter(r => r.date !== today || r.target !== plannerTarget)].slice(0, 30);
    setSavedTargetsArchive(updatedArchive);
    try {
      localStorage.setItem('om-saved-command-targets', JSON.stringify(updatedArchive));
    } catch {}

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastSavedTimestamp(timeStr);
    onSuccess(`✓ Command Target saved successfully at ${timeStr}`);
    onRefresh();
  };

  // Export & Download Daily Command Target as a file (.md)
  const handleSaveToFile = () => {
    const pointsList = dailyPlanner?.points || [];
    const openTasks = tasks.filter(t => !t.done && (t.dueAt === today || !t.dueAt));

    let content = `# 🎯 Daily Command Target - ${today}\n`;
    content += `Generated by Om-LifeOS · Sovereign Operating System\n\n`;
    content += `## Core Decisive Victory\n`;
    content += `${plannerTarget || 'None specified'}\n\n`;
    content += `**Execution Progress:** ${plannerProgress}%\n\n`;

    content += `## Action Checkpoints\n`;
    if (pointsList.length === 0) {
      content += `*(No checkpoints defined)*\n`;
    } else {
      pointsList.forEach(p => {
        content += `- [${p.done ? 'x' : ' '}] ${p.text}\n`;
      });
    }
    content += `\n`;

    if (dailyWins.trim()) {
      content += `## Daily Victories & Wins\n${dailyWins}\n\n`;
    }

    if (eveningReview.trim()) {
      content += `## Evening Reflection & Learnings\n${eveningReview}\n\n`;
    }

    content += `## Today's Linked Active Tasks\n`;
    if (openTasks.length === 0) {
      content += `*(No open tasks due today)*\n`;
    } else {
      openTasks.forEach(t => {
        content += `- [ ] [${t.priority}] ${t.title} (${t.domain})\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `daily-command-target-${today}.md`;
    link.click();
    URL.revokeObjectURL(url);
    onSuccess('💾 Command Target file exported and downloaded (.md)');
  };

  // Load a saved record from archive
  const handleLoadSavedRecord = (record: SavedTargetRecord) => {
    setPlannerTarget(record.target);
    setPlannerProgress(record.progress);
    if (record.raw?.wins) setDailyWins(record.raw.wins.join('\n'));
    if (record.raw?.reflection) setEveningReview(record.raw.reflection.join('\n'));
    onSuccess(`Loaded saved target from ${record.date}`);
  };

  const handleAddPlannerPoint = async (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || !pointText.trim()) return;
    e.preventDefault();

    const appSettings = (await storage.getSingleton<any>('appSettings')) || {};
    const currentPoints = dailyPlanner?.points || [];
    const newPoints = [...currentPoints, { id: generateUUID(), text: pointText.trim(), done: false }];

    const updatedPlanner: DailyPlanner = {
      date: today,
      target: plannerTarget,
      progress: plannerProgress,
      points: newPoints,
      wins: dailyPlanner?.wins || [],
      reflection: dailyPlanner?.reflection || []
    };

    appSettings.dailyPlanner = updatedPlanner;
    await storage.setSingleton('appSettings', appSettings);
    setPointText('');
    onRefresh();
  };

  const handleTogglePoint = async (pointId: string) => {
    const appSettings = (await storage.getSingleton<any>('appSettings')) || {};
    const currentPoints = dailyPlanner?.points || [];
    const newPoints = currentPoints.map(p => (p.id === pointId ? { ...p, done: !p.done } : p));

    const updatedPlanner: DailyPlanner = {
      date: today,
      target: plannerTarget,
      progress: plannerProgress,
      points: newPoints,
      wins: dailyPlanner?.wins || [],
      reflection: dailyPlanner?.reflection || []
    };

    appSettings.dailyPlanner = updatedPlanner;
    await storage.setSingleton('appSettings', appSettings);
    onRefresh();
  };

  const handleDeletePoint = async (pointId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const appSettings = (await storage.getSingleton<any>('appSettings')) || {};
    const currentPoints = dailyPlanner?.points || [];
    const newPoints = currentPoints.filter(p => p.id !== pointId);

    const updatedPlanner: DailyPlanner = {
      date: today,
      target: plannerTarget,
      progress: plannerProgress,
      points: newPoints,
      wins: dailyPlanner?.wins || [],
      reflection: dailyPlanner?.reflection || []
    };

    appSettings.dailyPlanner = updatedPlanner;
    await storage.setSingleton('appSettings', appSettings);
    onRefresh();
  };

  const filteredTasks = tasks.filter(t => {
    if (filterTab === 'today' && (t.dueAt !== today || t.done)) return false;
    if (filterTab === 'high' && (t.priority !== 'High' || t.done)) return false;
    if (filterTab === 'work' && (t.domain !== 'work' || t.done)) return false;
    if (filterTab === 'personal' && (t.domain !== 'personal' || t.done)) return false;
    if (filterTab === 'done' && !t.done) return false;
    if (filterTab === 'all' && t.done) return true;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return `${t.title} ${t.description || ''} ${t.domain || ''}`.toLowerCase().includes(q);
    }
    return true;
  });

  const openCount = tasks.filter(t => !t.done).length;
  const todayCount = tasks.filter(t => t.dueAt === today && !t.done).length;
  const highCount = tasks.filter(t => t.priority === 'High' && !t.done).length;

  // Timeline classification
  const overdueTasks = tasks.filter(t => !t.done && t.dueAt && t.dueAt < today);
  const todayTasks = tasks.filter(t => !t.done && t.dueAt === today);
  const upcomingTasks = tasks.filter(t => !t.done && t.dueAt && t.dueAt > today);
  const unscheduledTasks = tasks.filter(t => !t.done && !t.dueAt);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Tasks & Planner
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            A cohesive execution system unifying tasks, priorities, daily command targets, timeline schedules, and status boards.
          </p>
        </div>
      </div>

      {/* Submenu Navigation Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-1.5 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'roster', label: `Task Roster (${openCount})`, icon: <CheckSquare className="h-3.5 w-3.5" /> },
          { id: 'dailyCommand', label: 'Daily Command Target', icon: <Target className="h-3.5 w-3.5" /> },
          { id: 'timeline', label: `Timeline & Schedule (${tasks.length})`, icon: <Calendar className="h-3.5 w-3.5" /> },
          { id: 'kanban', label: 'Status Board (Kanban)', icon: <Layers className="h-3.5 w-3.5" /> }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubMenu(tab.id as any)}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeSubMenu === tab.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* SUBMENU 1: TASK ROSTER & INLINE PLANNER */}
      {activeSubMenu === 'roster' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Add/Edit Task Box (5 cols) */}
          <div
            ref={formRef}
            className={`lg:col-span-5 rounded-3xl border transition-all ${
              editingTaskId
                ? 'border-indigo-400 bg-indigo-50/20 dark:border-indigo-500/50 dark:bg-indigo-950/20 ring-2 ring-indigo-500/20'
                : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
            } p-5 sm:p-6 shadow-sm`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 text-xs font-bold">
                  ✓
                </span>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingTaskId ? 'Edit Task' : 'Create New Task'}
                </h2>
              </div>
              {editingTaskId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleCreateOrUpdateTask} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Task Title
                </label>
                <input
                  ref={titleInputRef}
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="What needs to be accomplished?"
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Domain
                  </label>
                  <select
                    value={domain}
                    onChange={e => setDomain(e.target.value as any)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="work">Work</option>
                    <option value="personal">Personal</option>
                    <option value="health">Health</option>
                    <option value="finance">Finance</option>
                    <option value="spiritual">Spiritual</option>
                    <option value="social">Social</option>
                    <option value="learning">Learning</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueAt}
                    onChange={e => setDueAt(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 font-mono text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Strategic Goal
                  </label>
                  <select
                    value={goalId}
                    onChange={e => setGoalId(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">None (Independent)</option>
                    {goals.map(g => (
                      <option key={g.id} value={g.id}>{g.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Description / Context
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Key deliverables, context, or links..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 active:scale-98 transition-transform cursor-pointer"
              >
                {editingTaskId ? 'Update Task' : '＋ Add Task to Planner'}
              </button>
            </form>
          </div>

          {/* Task Filter Tabs & All Tasks List (7 cols) */}
          <section className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Task Roster ({filteredTasks.length})
                </h2>
              </div>

              {/* Quick Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search tasks..."
                  className="h-8 w-full rounded-xl border border-slate-200 pl-8 pr-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Tab Filter Chips */}
            <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'all', label: `All Tasks (${tasks.length})` },
                { id: 'today', label: `Due Today (${todayCount})` },
                { id: 'high', label: `High Priority (${highCount})` },
                { id: 'work', label: 'Work' },
                { id: 'personal', label: 'Personal' },
                { id: 'done', label: `Completed (${tasks.filter(t => t.done).length})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterTab(tab.id as any)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    filterTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tasks List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[550px] overflow-y-auto">
              {filteredTasks.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  No tasks found in this view.
                </div>
              ) : (
                filteredTasks.map(task => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between py-3 px-2 rounded-xl transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <button
                        type="button"
                        onClick={() => handleToggleTask(task)}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-all cursor-pointer ${
                          task.done
                            ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                            : 'border-slate-300 hover:border-indigo-500 dark:border-slate-600'
                        }`}
                      >
                        {task.done && <Check className="h-3.5 w-3.5" />}
                      </button>

                      <div className="min-w-0">
                        <div className={`text-xs font-semibold truncate ${task.done ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xl">
                            {task.description}
                          </div>
                        )}
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                          <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 capitalize font-medium text-slate-600 dark:text-slate-300">
                            {task.domain}
                          </span>
                          <span className={`rounded-md px-1.5 py-0.5 font-bold ${
                            task.priority === 'High'
                              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                              : task.priority === 'Medium'
                              ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                          }`}>
                            {task.priority}
                          </span>
                          {task.dueAt && (
                            <span className="font-mono text-slate-500 flex items-center gap-1">
                              <Calendar className="h-2.5 w-2.5" />
                              <span>{task.dueAt}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditClick(task)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                        title="Edit task"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        title="Delete task"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      {/* SUBMENU 2: DAILY COMMAND TARGET (With File Save, Export, and History!) */}
      {activeSubMenu === 'dailyCommand' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Main Command Operations Form (7 cols) */}
            <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 text-sm font-bold">
                    🎯
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Daily Command Target ({today})
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      {lastSavedTimestamp ? `Last saved at ${lastSavedTimestamp}` : 'Changes auto-saved to sovereign state'}
                    </p>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveToFile}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                    title="Export and download command target as a file (.md)"
                  >
                    <Download className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Save to File</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSavePlannerTarget}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Target</span>
                  </button>
                </div>
              </div>

              {/* Decisive Victory Target */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Core Priority / Decisive Victory Outcome
                </label>
                <input
                  type="text"
                  value={plannerTarget}
                  onChange={e => setPlannerTarget(e.target.value)}
                  placeholder="What single outcome will make today a decisive victory?"
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                />
              </div>

              {/* Progress Slider */}
              <div className="rounded-2xl bg-amber-50/50 p-4 border border-amber-200/60 dark:bg-amber-950/20 dark:border-amber-800/40">
                <div className="flex justify-between text-xs font-semibold text-amber-900 dark:text-amber-200">
                  <span>Execution Progress</span>
                  <span className="font-mono text-sm font-extrabold">{plannerProgress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={plannerProgress}
                  onChange={e => setPlannerProgress(Number(e.target.value))}
                  className="mt-2 h-2.5 w-full accent-amber-500 rounded-lg cursor-pointer"
                />
              </div>

              {/* Action Checkpoints */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Action Checkpoints (Type and hit Enter to add)
                </label>
                <input
                  type="text"
                  value={pointText}
                  onChange={e => setPointText(e.target.value)}
                  onKeyDown={handleAddPlannerPoint}
                  placeholder="Type an actionable checkpoint and hit Enter..."
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />

                <div className="mt-3 space-y-1.5 max-h-56 overflow-y-auto">
                  {(dailyPlanner?.points || []).length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No checkpoints registered for today yet.
                    </div>
                  ) : (
                    (dailyPlanner?.points || []).map(pt => (
                      <div
                        key={pt.id}
                        onClick={() => handleTogglePoint(pt.id)}
                        className="flex items-center justify-between rounded-xl p-2.5 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          {pt.done ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          ) : (
                            <Circle className="h-4 w-4 text-slate-300 dark:text-slate-600 shrink-0" />
                          )}
                          <span className={pt.done ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200 font-medium'}>
                            {pt.text}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleDeletePoint(pt.id, e)}
                          className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 p-1"
                          title="Remove checkpoint"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Wins & Reflections */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Daily Victories & Wins (1 per line)
                  </label>
                  <textarea
                    rows={3}
                    value={dailyWins}
                    onChange={e => setDailyWins(e.target.value)}
                    placeholder="• Shipped feature on schedule&#10;• Hit daily calorie goal"
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Evening Reflection & Learnings
                  </label>
                  <textarea
                    rows={3}
                    value={eveningReview}
                    onChange={e => setEveningReview(e.target.value)}
                    placeholder="What worked well? What could be executed better tomorrow?"
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Saved Command Target Files & Historical Archive (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-indigo-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Saved Command Targets & Files
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {savedTargetsArchive.length} records
                  </span>
                </div>

                <div className="mt-4 space-y-3 max-h-[500px] overflow-y-auto">
                  {savedTargetsArchive.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      No saved files or target history yet.<br/>
                      Click "Save Target" or "Save to File" to save your first record.
                    </div>
                  ) : (
                    savedTargetsArchive.map(rec => (
                      <div
                        key={rec.id}
                        className="rounded-2xl border border-slate-100 p-3.5 text-xs dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all space-y-2 group"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-xs">
                              {rec.target}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Date: {rec.date} · {rec.pointsDone}/{rec.pointsCount} checkpoints
                            </div>
                          </div>
                          <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                            {rec.progress}%
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-50 dark:border-slate-800/40">
                          <button
                            type="button"
                            onClick={() => handleLoadSavedRecord(rec)}
                            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
                          >
                            Load Into Editor
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const updated = savedTargetsArchive.filter(r => r.id !== rec.id);
                              setSavedTargetsArchive(updated);
                              try {
                                localStorage.setItem('om-saved-command-targets', JSON.stringify(updated));
                              } catch {}
                            }}
                            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 p-1"
                            title="Remove record"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBMENU 3: TIMELINE & DUE DATE SCHEDULE */}
      {activeSubMenu === 'timeline' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Overdue */}
            <div className="rounded-3xl border border-rose-200/80 bg-rose-50/20 p-5 dark:border-rose-900/40 dark:bg-rose-950/10">
              <div className="flex items-center justify-between border-b border-rose-100 pb-3 dark:border-rose-900/30">
                <span className="text-xs font-bold text-rose-700 dark:text-rose-300">Overdue</span>
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-900/60 dark:text-rose-200">
                  {overdueTasks.length}
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {overdueTasks.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">All clear! No overdue tasks.</div>
                ) : (
                  overdueTasks.map(t => (
                    <div key={t.id} className="rounded-xl bg-white p-3 shadow-xs dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs">
                      <div className="font-semibold text-slate-900 dark:text-white">{t.title}</div>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-rose-500">
                        <span>Due {t.dueAt}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleTask(t)}
                          className="font-bold text-indigo-600 hover:underline"
                        >
                          Mark Done
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Today */}
            <div className="rounded-3xl border border-indigo-200/80 bg-indigo-50/20 p-5 dark:border-indigo-900/40 dark:bg-indigo-950/10">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-3 dark:border-indigo-900/30">
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Due Today</span>
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200">
                  {todayTasks.length}
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {todayTasks.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">No tasks due today.</div>
                ) : (
                  todayTasks.map(t => (
                    <div key={t.id} className="rounded-xl bg-white p-3 shadow-xs dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs">
                      <div className="font-semibold text-slate-900 dark:text-white">{t.title}</div>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="capitalize">{t.domain} · {t.priority}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleTask(t)}
                          className="font-bold text-indigo-600 hover:underline"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Upcoming */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Upcoming</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {upcomingTasks.length}
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {upcomingTasks.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">No upcoming tasks scheduled.</div>
                ) : (
                  upcomingTasks.map(t => (
                    <div key={t.id} className="rounded-xl bg-slate-50/60 p-3 dark:bg-slate-800/40 text-xs">
                      <div className="font-semibold text-slate-900 dark:text-white">{t.title}</div>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Due {t.dueAt}</span>
                        <span className="capitalize">{t.priority}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Unscheduled / Backlog */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-white">No Due Date</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {unscheduledTasks.length}
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {unscheduledTasks.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">All tasks have due dates!</div>
                ) : (
                  unscheduledTasks.map(t => (
                    <div key={t.id} className="rounded-xl bg-slate-50/60 p-3 dark:bg-slate-800/40 text-xs">
                      <div className="font-semibold text-slate-900 dark:text-white">{t.title}</div>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="capitalize">{t.domain}</span>
                        <button
                          type="button"
                          onClick={() => handleEditClick(t)}
                          className="text-indigo-600 hover:underline"
                        >
                          Schedule
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBMENU 4: KANBAN STATUS BOARD */}
      {activeSubMenu === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Open / Backlog */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col h-[650px]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-900 dark:text-white">To Do / Open</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {tasks.filter(t => !t.done && (t.status === 'open' || !t.status)).length}
              </span>
            </div>
            <div className="mt-3 flex-1 overflow-y-auto space-y-2.5 pr-1">
              {tasks.filter(t => !t.done && (t.status === 'open' || !t.status)).map(t => (
                <div key={t.id} className="rounded-2xl border border-slate-100 p-3.5 shadow-xs dark:border-slate-800 bg-white dark:bg-slate-800/60 text-xs space-y-2">
                  <div className="font-semibold text-slate-900 dark:text-white">{t.title}</div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="capitalize">{t.domain}</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateTaskStatus(t, 'in-progress')}
                      className="flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                    >
                      <span>Start</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div className="rounded-3xl border border-amber-200 bg-amber-50/30 p-5 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/10 flex flex-col h-[650px]">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3 dark:border-amber-900/30">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200">In Progress</span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                {tasks.filter(t => !t.done && t.status === 'in-progress').length}
              </span>
            </div>
            <div className="mt-3 flex-1 overflow-y-auto space-y-2.5 pr-1">
              {tasks.filter(t => !t.done && t.status === 'in-progress').map(t => (
                <div key={t.id} className="rounded-2xl border border-amber-100 p-3.5 shadow-xs dark:border-slate-800 bg-white dark:bg-slate-800/60 text-xs space-y-2">
                  <div className="font-semibold text-slate-900 dark:text-white">{t.title}</div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <button
                      type="button"
                      onClick={() => handleUpdateTaskStatus(t, 'open')}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateTaskStatus(t, 'done')}
                      className="flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      <span>Complete</span>
                      <Check className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Completed */}
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/30 p-5 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/10 flex flex-col h-[650px]">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3 dark:border-emerald-900/30">
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Completed</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                {tasks.filter(t => t.done).length}
              </span>
            </div>
            <div className="mt-3 flex-1 overflow-y-auto space-y-2.5 pr-1">
              {tasks.filter(t => t.done).map(t => (
                <div key={t.id} className="rounded-2xl border border-emerald-100 p-3.5 shadow-xs dark:border-slate-800 bg-white dark:bg-slate-800/60 text-xs space-y-2">
                  <div className="font-semibold line-through text-slate-400">{t.title}</div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="text-emerald-600 font-medium">✓ Done</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateTaskStatus(t, 'open')}
                      className="text-slate-400 hover:text-indigo-600"
                    >
                      Reopen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE TASK MODAL */}
      <ConfirmModal
        isOpen={Boolean(taskToDelete)}
        title="Delete Task?"
        message={
          taskToDelete
            ? `Are you sure you want to delete "${taskToDelete.title}"? This task will be permanently removed.`
            : ''
        }
        confirmText="Delete Task"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  );
};
