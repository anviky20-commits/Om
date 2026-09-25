import React, { useState, useEffect } from 'react';
import {
  Target, Plus, TrendingUp, ShieldCheck, Flame, Trash2,
  Flag, Award, Zap, Compass, Quote, FileText, CheckCircle2,
  Circle, Clock, ChevronRight, Edit3, Check
} from 'lucide-react';
import {
  Goal, Milestone, Strategy, KPI, Mission, MentorRule,
  MentorQuote, CapitalStrategy, MentorProfile, FinanceAccount
} from '../types';
import { storage, generateUUID } from '../lib/storage';
import { ConfirmModal } from '../components/ConfirmModal';

interface GoalsViewProps {
  goals: Goal[];
  milestones?: Milestone[];
  strategies?: Strategy[];
  kpis?: KPI[];
  missions?: Mission[];
  mentorRules?: MentorRule[];
  mentorQuotes?: MentorQuote[];
  capitalStrategies?: CapitalStrategy[];
  mentor?: MentorProfile;
  accounts: FinanceAccount[];
  onRefresh: () => void;
  onSuccess: (msg: string) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  milestones = [],
  strategies = [],
  kpis = [],
  missions = [],
  mentorRules = [],
  mentorQuotes = [],
  capitalStrategies = [],
  mentor,
  accounts,
  onRefresh,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'goals' | 'strategies' | 'milestones' | 'kpis' | 'missions' | 'mentor'>('goals');

  // New Goal form
  const [goalTitle, setGoalTitle] = useState('');
  const [goalCategory, setGoalCategory] = useState('Career');
  const [targetDate, setTargetDate] = useState('');
  const [goalProgress, setGoalProgress] = useState(0);

  // New Strategy form (Previously Missing!)
  const [stratTitle, setStratTitle] = useState('');
  const [stratGoalId, setStratGoalId] = useState(goals[0]?.id || '');
  const [stratAction, setStratAction] = useState('');
  const [stratStatus, setStratStatus] = useState<'active' | 'in-progress' | 'executed'>('active');

  // New Milestone form
  const [msTitle, setMsTitle] = useState('');
  const [msGoalId, setMsGoalId] = useState(goals[0]?.id || '');
  const [msDueDate, setMsDueDate] = useState('');

  // New KPI form
  const [kpiName, setKpiName] = useState('');
  const [kpiGoalId, setKpiGoalId] = useState(goals[0]?.id || '');
  const [kpiTarget, setKpiTarget] = useState('');
  const [kpiCurrent, setKpiCurrent] = useState('');
  const [kpiUnit, setKpiUnit] = useState('');

  // New Mission form
  const [missionTitle, setMissionTitle] = useState('');
  const [missionPeriod, setMissionPeriod] = useState('Q4 Focus');
  const [missionTarget, setMissionTarget] = useState('');
  const [missionAction, setMissionAction] = useState('Daily core routine execution');

  // Mentor Strategy state
  const [mentorMission, setMentorMission] = useState(mentor?.mission || '');
  const [survivalReserve, setSurvivalReserve] = useState(mentor?.survivalReserve || 100000);
  const [emergencyReserve, setEmergencyReserve] = useState(mentor?.emergencyReserve || 50000);
  const [dailyBurn, setDailyBurn] = useState(mentor?.dailyBurn || 800);
  const [savingGoal, setSavingGoal] = useState(mentor?.savingGoalAmount || 500000);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<{ store: string; id: string; name: string } | null>(null);

  // Auto-sync dropdowns when goals asynchronously load
  useEffect(() => {
    if (goals.length > 0) {
      if (!stratGoalId || !goals.some(g => g.id === stratGoalId)) {
        setStratGoalId(goals[0].id);
      }
      if (!msGoalId || !goals.some(g => g.id === msGoalId)) {
        setMsGoalId(goals[0].id);
      }
      if (!kpiGoalId || !goals.some(g => g.id === kpiGoalId)) {
        setKpiGoalId(goals[0].id);
      }
    }
  }, [goals, stratGoalId, msGoalId, kpiGoalId]);

  // Keep mentor state synced with prop
  useEffect(() => {
    if (mentor) {
      if (mentor.mission !== undefined) setMentorMission(mentor.mission);
      if (mentor.survivalReserve !== undefined) setSurvivalReserve(mentor.survivalReserve);
      if (mentor.emergencyReserve !== undefined) setEmergencyReserve(mentor.emergencyReserve);
      if (mentor.dailyBurn !== undefined) setDailyBurn(mentor.dailyBurn);
      if (mentor.savingGoalAmount !== undefined) setSavingGoal(mentor.savingGoalAmount);
    }
  }, [mentor]);

  const liquidCash = accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
  const totalReserves = Number(survivalReserve) + Number(emergencyReserve);
  const runwayDays = dailyBurn > 0 ? Math.floor(liquidCash / dailyBurn) : 0;
  const runwayMonths = (runwayDays / 30).toFixed(1);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;

    const now = Date.now();
    const newGoal: Goal = {
      id: generateUUID(),
      title: goalTitle.trim(),
      category: goalCategory,
      targetDate: targetDate || undefined,
      progress: goalProgress,
      status: goalProgress >= 100 ? 'completed' : 'active',
      createdAt: now,
      updatedAt: now
    };

    await storage.put('goals', newGoal);
    onSuccess('🎯 Strategic Goal registered');
    setGoalTitle('');
    setGoalProgress(0);
    onRefresh();
  };

  const handleAddStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stratTitle.trim()) return;

    const targetGoal = stratGoalId || goals[0]?.id || '';
    const newStrategy: Strategy = {
      id: generateUUID(),
      goalId: targetGoal,
      title: stratTitle.trim(),
      action: stratAction.trim() || 'Execute tactical roadmap',
      status: stratStatus,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await storage.put('strategies', newStrategy);
    onSuccess('⚡ Strategy initiative created');
    setStratTitle('');
    setStratAction('');
    onRefresh();
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msTitle.trim()) return;

    const targetGoal = msGoalId || goals[0]?.id || '';
    const ms: Milestone = {
      id: generateUUID(),
      goalId: targetGoal,
      title: msTitle.trim(),
      dueDate: msDueDate || undefined,
      progress: 0,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await storage.put('milestones', ms);
    onSuccess('Milestone added');
    setMsTitle('');
    setMsDueDate('');
    onRefresh();
  };

  const handleAddKPI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kpiName.trim()) return;

    const targetGoal = kpiGoalId || goals[0]?.id || '';
    const k: KPI = {
      id: generateUUID(),
      goalId: targetGoal || undefined,
      name: kpiName.trim(),
      target: Number(kpiTarget) || 0,
      current: Number(kpiCurrent) || 0,
      unit: kpiUnit.trim() || 'units',
      status: 'tracking',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await storage.put('kpis', k);
    onSuccess('KPI metric registered');
    setKpiName('');
    setKpiTarget('');
    setKpiCurrent('');
    setKpiUnit('');
    onRefresh();
  };

  const handleAddMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!missionTitle.trim()) return;

    const m: Mission = {
      id: generateUUID(),
      title: missionTitle.trim(),
      period: missionPeriod,
      target: missionTarget.trim(),
      action: missionAction.trim() || 'Execute daily core routine',
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await storage.put('missions', m);
    onSuccess('Mission declared');
    setMissionTitle('');
    setMissionTarget('');
    onRefresh();
  };

  const handleProgressChange = async (goal: Goal, delta: number) => {
    const newProgress = Math.max(0, Math.min(100, goal.progress + delta));
    const updated: Goal = {
      ...goal,
      progress: newProgress,
      status: newProgress >= 100 ? 'completed' : 'active',
      updatedAt: Date.now()
    };
    await storage.put('goals', updated);
    onRefresh();
  };

  const handleToggleMilestoneStatus = async (m: Milestone) => {
    const nextStatus = m.status === 'completed' ? 'pending' : 'completed';
    const updated: Milestone = {
      ...m,
      status: nextStatus,
      progress: nextStatus === 'completed' ? 100 : 0,
      updatedAt: Date.now()
    };
    await storage.put('milestones', updated);
    onSuccess(nextStatus === 'completed' ? '✓ Milestone reached!' : 'Milestone marked pending');
    onRefresh();
  };

  const handleToggleStrategyStatus = async (s: Strategy) => {
    const nextStatus = s.status === 'executed' ? 'active' : s.status === 'active' ? 'in-progress' : 'executed';
    const updated: Strategy = {
      ...s,
      status: nextStatus,
      updatedAt: Date.now()
    };
    await storage.put('strategies', updated);
    onSuccess(`Strategy status: ${nextStatus}`);
    onRefresh();
  };

  const handleAdjustKPI = async (k: KPI, delta: number) => {
    const updated: KPI = {
      ...k,
      current: Math.max(0, Number(k.current || 0) + delta),
      updatedAt: Date.now()
    };
    await storage.put('kpis', updated);
    onRefresh();
  };

  const handleSaveMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    const appSettings = (await storage.getSingleton<any>('appSettings')) || {};
    const updatedMentor: MentorProfile = {
      mission: mentorMission,
      survivalReserve: Number(survivalReserve),
      emergencyReserve: Number(emergencyReserve),
      dailyBurn: Number(dailyBurn),
      monthlyBurn: Number(dailyBurn) * 30,
      savingGoalAmount: Number(savingGoal),
      updatedAt: Date.now()
    };
    appSettings.mentor = updatedMentor;
    await storage.setSingleton('appSettings', appSettings);
    onSuccess('Mentor strategy & capital allocation saved');
    onRefresh();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await storage.delete(deleteTarget.store, deleteTarget.id);
    onSuccess(`✓ Removed "${deleteTarget.name}"`);
    setDeleteTarget(null);
    onRefresh();
  };

  const getGoalTitleById = (id?: string) => {
    if (!id) return 'Independent';
    const g = goals.find(goal => goal.id === id);
    return g ? g.title : 'Strategic Objective';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
          Goals & Strategy
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Hierarchical execution: Life Purpose → Strategic Goals → Tactical Strategies → Milestones → KPIs → Mentor Capital.
        </p>
      </div>

      {/* Capital Position Dashboard */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Liquid Capital</span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-3 font-mono text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
            ₹{liquidCash.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-slate-400">Across {accounts.length} liquid accounts</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Survival Runway</span>
            <Flame className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-3 font-mono text-2xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
            {runwayDays} Days
          </div>
          <div className="mt-1 text-xs text-slate-400">~{runwayMonths} months at current burn</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Reserves Goal</span>
            <ShieldCheck className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-3 font-mono text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
            ₹{totalReserves.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-slate-400">Survival + Emergency fund</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Daily Burn Rate</span>
            <TrendingUp className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-3 font-mono text-2xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
            ₹{Number(dailyBurn).toLocaleString('en-IN')}/d
          </div>
          <div className="mt-1 text-xs text-slate-400">₹{(Number(dailyBurn) * 30).toLocaleString('en-IN')}/mo</div>
        </div>
      </div>

      {/* Tabs navigation for Goals sub-features */}
      <div className="flex overflow-x-auto pb-2 gap-1.5 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'goals', label: `Strategic Goals (${goals.length})` },
          { id: 'strategies', label: `Strategies & Tactics (${strategies.length})` },
          { id: 'milestones', label: `Milestones (${milestones.length})` },
          { id: 'kpis', label: `KPIs & Metrics (${kpis.length})` },
          { id: 'missions', label: `Missions (${missions.length})` },
          { id: 'mentor', label: 'Mentor & Reserves' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Strategic Goals */}
      {activeTab === 'goals' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Goals List (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
                Active Strategic Goals ({goals.length})
              </h2>

              <div className="mt-4 space-y-4">
                {goals.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No strategic goals created yet. Register your first major life objective.
                  </div>
                ) : (
                  goals.map(g => (
                    <div
                      key={g.id}
                      className="rounded-2xl border border-slate-100 p-4 transition-all hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{g.title}</div>
                          <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{g.category || 'General'}</span>
                            {g.targetDate && (
                              <>
                                <span>·</span>
                                <span>Target: {g.targetDate}</span>
                              </>
                            )}
                            <span className={`px-1.5 py-0.2 rounded-md font-semibold capitalize ${
                              g.progress >= 100
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                            }`}>
                              {g.progress >= 100 ? 'Completed' : 'Active'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleProgressChange(g, -10)}
                            className="h-6 w-6 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
                            title="Decrease 10%"
                          >
                            -
                          </button>
                          <span className="font-mono text-xs font-bold w-12 text-center tabular-nums">{g.progress}%</span>
                          <button
                            type="button"
                            onClick={() => handleProgressChange(g, 10)}
                            className="h-6 w-6 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
                            title="Increase 10%"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ store: 'goals', id: g.id, name: g.title })}
                            className="ml-2 p-1 text-slate-300 hover:text-rose-500 cursor-pointer"
                            title="Delete goal"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${g.progress >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                          style={{ width: `${g.progress}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Add Goal Form (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                <Plus className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Add Strategic Goal</h2>
              </div>

              <form onSubmit={handleAddGoal} className="mt-4 space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Goal Title
                  </label>
                  <input
                    type="text"
                    required
                    value={goalTitle}
                    onChange={e => setGoalTitle(e.target.value)}
                    placeholder="e.g. Build ₹1M Liquid Runway, Launch SaaS Product"
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      Category
                    </label>
                    <select
                      value={goalCategory}
                      onChange={e => setGoalCategory(e.target.value)}
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="Career">Career & Work</option>
                      <option value="Finance">Finance & Net Worth</option>
                      <option value="Health">Health & Fitness</option>
                      <option value="Learning">Learning & Mastery</option>
                      <option value="Spiritual">Spiritual / Life Alignment</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      Target Date
                    </label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={e => setTargetDate(e.target.value)}
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span>Initial Progress</span>
                    <span className="font-mono font-bold">{goalProgress}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={goalProgress}
                    onChange={e => setGoalProgress(Number(e.target.value))}
                    className="mt-1.5 h-2 w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 active:scale-98 cursor-pointer"
                >
                  ＋ Save Strategic Goal
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Strategies & Tactics (New & Fully Implemented!) */}
      {activeTab === 'strategies' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Add Strategy Form (5 cols) */}
          <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <span>Declare Tactical Strategy</span>
            </h2>

            <form onSubmit={handleAddStrategy} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Strategy Initiative
                </label>
                <input
                  type="text"
                  required
                  value={stratTitle}
                  onChange={e => setStratTitle(e.target.value)}
                  placeholder="e.g. Daily Deep Work Blocks, Asymmetric Leverage"
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Linked Strategic Goal
                </label>
                <select
                  value={stratGoalId || (goals[0]?.id ?? '')}
                  onChange={e => setStratGoalId(e.target.value)}
                  disabled={goals.length === 0}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white disabled:opacity-50"
                >
                  {goals.length === 0 ? (
                    <option value="">No strategic goals created yet</option>
                  ) : (
                    goals.map(g => (
                      <option key={g.id} value={g.id}>{g.title}</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Tactical Action Steps
                </label>
                <textarea
                  rows={3}
                  value={stratAction}
                  onChange={e => setStratAction(e.target.value)}
                  placeholder="Specify the exact operating tactics and execution plan..."
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Initiative Status
                </label>
                <select
                  value={stratStatus}
                  onChange={e => setStratStatus(e.target.value as any)}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="active">Active Execution</option>
                  <option value="in-progress">In-Progress</option>
                  <option value="executed">Executed / Mastered</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 cursor-pointer"
              >
                + Commit Tactical Strategy
              </button>
            </form>
          </div>

          {/* Strategies List (7 cols) */}
          <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800 flex justify-between items-center">
              <span>Operational Strategies ({strategies.length})</span>
              <span className="text-[10px] text-slate-400 font-normal">Click status pill to cycle</span>
            </h2>

            <div className="mt-4 space-y-3">
              {strategies.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No strategies defined yet. Connect a tactic to your strategic goals.
                </div>
              ) : (
                strategies.map(s => (
                  <div key={s.id} className="rounded-2xl border border-slate-100 p-4 text-xs dark:border-slate-800 group transition-all hover:border-slate-200 dark:hover:border-slate-700">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{s.title}</div>
                        <div className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 mt-0.5">
                          Goal: {getGoalTitleById(s.goalId)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleStrategyStatus(s)}
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize cursor-pointer transition-colors ${
                            s.status === 'executed'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : s.status === 'in-progress'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                          }`}
                        >
                          {s.status}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ store: 'strategies', id: s.id, name: s.title })}
                          className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all p-1"
                          title="Delete strategy"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {s.action && (
                      <div className="mt-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        {s.action}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Milestones */}
      {activeTab === 'milestones' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
              Add Milestone to Strategic Goal
            </h2>
            <form onSubmit={handleAddMilestone} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Milestone Title</label>
                <input
                  type="text"
                  required
                  value={msTitle}
                  onChange={e => setMsTitle(e.target.value)}
                  placeholder="e.g. Complete Phase 1 MVP, Save First 20%"
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Strategic Goal</label>
                <select
                  value={msGoalId || (goals[0]?.id ?? '')}
                  onChange={e => setMsGoalId(e.target.value)}
                  disabled={goals.length === 0}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white disabled:opacity-50"
                >
                  {goals.length === 0 ? (
                    <option value="">No strategic goals created yet</option>
                  ) : (
                    goals.map(g => (
                      <option key={g.id} value={g.id}>{g.title}</option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Target Date</label>
                <input
                  type="date"
                  value={msDueDate}
                  onChange={e => setMsDueDate(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 cursor-pointer"
              >
                + Register Milestone
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
              Milestones Overview ({milestones.length})
            </h2>
            <div className="mt-4 space-y-2.5">
              {milestones.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">No milestones yet.</div>
              ) : (
                milestones.map(m => (
                  <div key={m.id} className="rounded-2xl border border-slate-100 p-3.5 text-xs dark:border-slate-800 flex justify-between items-center group">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggleMilestoneStatus(m)}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                          m.status === 'completed'
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500'
                        }`}
                      >
                        {m.status === 'completed' && <Check className="h-3.5 w-3.5" />}
                      </button>
                      <div>
                        <div className={`font-bold text-slate-900 dark:text-white ${m.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
                          {m.title}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{getGoalTitleById(m.goalId)}</span>
                          <span>·</span>
                          <span>Due: {m.dueDate || 'Ongoing'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold ${
                        m.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                      }`}>
                        {m.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ store: 'milestones', id: m.id, name: m.title })}
                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all p-1"
                        title="Delete milestone"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: KPIs */}
      {activeTab === 'kpis' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
              Register Quantitative KPI
            </h2>
            <form onSubmit={handleAddKPI} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">KPI Metric Name</label>
                <input
                  type="text"
                  required
                  value={kpiName}
                  onChange={e => setKpiName(e.target.value)}
                  placeholder="e.g. Monthly Recurring Revenue, Coding Hours"
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Associated Goal</label>
                <select
                  value={kpiGoalId || (goals[0]?.id ?? '')}
                  onChange={e => setKpiGoalId(e.target.value)}
                  disabled={goals.length === 0}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white disabled:opacity-50"
                >
                  <option value="">None (Global Metric)</option>
                  {goals.map(g => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-300">Target</label>
                  <input
                    type="number"
                    value={kpiTarget}
                    onChange={e => setKpiTarget(e.target.value)}
                    placeholder="10000"
                    className="mt-1 h-8 w-full rounded-lg border border-slate-200 px-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-300">Current</label>
                  <input
                    type="number"
                    value={kpiCurrent}
                    onChange={e => setKpiCurrent(e.target.value)}
                    placeholder="6500"
                    className="mt-1 h-8 w-full rounded-lg border border-slate-200 px-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-300">Unit</label>
                  <input
                    type="text"
                    value={kpiUnit}
                    onChange={e => setKpiUnit(e.target.value)}
                    placeholder="₹, reps, hrs"
                    className="mt-1 h-8 w-full rounded-lg border border-slate-200 px-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 cursor-pointer"
              >
                + Save Metric Tracking
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
              Tracked Metrics ({kpis.length})
            </h2>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {kpis.length === 0 ? (
                <div className="col-span-full py-12 text-center text-xs text-slate-400">No KPIs registered yet.</div>
              ) : (
                kpis.map(k => {
                  const target = Number(k.target) || 1;
                  const current = Number(k.current) || 0;
                  const pct = Math.min(100, (current / target) * 100);
                  return (
                    <div key={k.id} className="rounded-2xl border border-slate-100 p-4 text-xs dark:border-slate-800 group">
                      <div className="flex justify-between items-start">
                        <div className="font-bold text-slate-900 dark:text-white">{k.name}</div>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ store: 'kpis', id: k.id, name: k.name })}
                          className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="mt-2 flex items-baseline justify-between">
                        <div className="flex items-baseline gap-1">
                          <span className="font-mono text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                            {k.current}
                          </span>
                          <span className="text-[11px] text-slate-400">/ {k.target} {k.unit}</span>
                        </div>

                        {/* Quick adjustments */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleAdjustKPI(k, -1)}
                            className="h-5 w-5 rounded bg-slate-100 text-[10px] font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustKPI(k, 1)}
                            className="h-5 w-5 rounded bg-slate-100 text-[10px] font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Missions */}
      {activeTab === 'missions' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
              Declare Mission / Monthly Focus
            </h2>
            <form onSubmit={handleAddMission} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Mission Title</label>
                <input
                  type="text"
                  required
                  value={missionTitle}
                  onChange={e => setMissionTitle(e.target.value)}
                  placeholder="e.g. Launch AI Studio Applet to Production"
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-300">Period</label>
                  <input
                    type="text"
                    value={missionPeriod}
                    onChange={e => setMissionPeriod(e.target.value)}
                    placeholder="e.g. October 2026"
                    className="mt-1 h-8 w-full rounded-lg border border-slate-200 px-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-300">Key Target</label>
                  <input
                    type="text"
                    value={missionTarget}
                    onChange={e => setMissionTarget(e.target.value)}
                    placeholder="100% test coverage"
                    className="mt-1 h-8 w-full rounded-lg border border-slate-200 px-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Action Plan</label>
                <input
                  type="text"
                  value={missionAction}
                  onChange={e => setMissionAction(e.target.value)}
                  placeholder="Daily core routine execution"
                  className="mt-1 h-8 w-full rounded-lg border border-slate-200 px-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 cursor-pointer"
              >
                + Launch Mission
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
              Active Missions ({missions.length})
            </h2>
            <div className="mt-4 space-y-3">
              {missions.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">No active missions declared.</div>
              ) : (
                missions.map(m => (
                  <div key={m.id} className="rounded-2xl border border-slate-100 p-4 text-xs dark:border-slate-800 group">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{m.title}</div>
                        <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">{m.period}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ store: 'missions', id: m.id, name: m.title })}
                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {m.target && (
                      <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        Objective: {m.target}
                      </div>
                    )}
                    {m.action && (
                      <div className="mt-1 text-[10px] text-slate-400">
                        Action: {m.action}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Mentor & Reserves */}
      {activeTab === 'mentor' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 max-w-2xl">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
            Mentor Strategy & Capital Preservation
          </h2>

          <form onSubmit={handleSaveMentor} className="mt-4 space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Core Life Mission / Principle
              </label>
              <textarea
                rows={2}
                value={mentorMission}
                onChange={e => setMentorMission(e.target.value)}
                placeholder="Uncompromising discipline, strategic focus, and financial independence."
                className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Survival Reserve (₹)
                </label>
                <input
                  type="number"
                  value={survivalReserve}
                  onChange={e => setSurvivalReserve(Number(e.target.value))}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Daily Burn Rate (₹)
                </label>
                <input
                  type="number"
                  value={dailyBurn}
                  onChange={e => setDailyBurn(Number(e.target.value))}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Emergency Fund (₹)
                </label>
                <input
                  type="number"
                  value={emergencyReserve}
                  onChange={e => setEmergencyReserve(Number(e.target.value))}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Annual Savings Goal (₹)
                </label>
                <input
                  type="number"
                  value={savingGoal}
                  onChange={e => setSavingGoal(Number(e.target.value))}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 cursor-pointer"
            >
              Save Strategy & Allocation
            </button>
          </form>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Confirm Removal"
        message={deleteTarget ? `Are you sure you want to remove "${deleteTarget.name}"?` : ''}
        confirmText="Remove"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
