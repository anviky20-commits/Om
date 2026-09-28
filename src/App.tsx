import React, { useState, useEffect, useCallback } from 'react';
import {
  NavModule, AppState, Task, Goal, Milestone, Strategy, KPI, Mission,
  Routine, Habit, HabitLog, FinanceAccount, FinanceTransaction, Loan,
  LoanPayment, Investment, SavingsPlan, Asset, Liability, FinancialGoal,
  Note, JournalEntry, FocusSession, SleepRecord, WaterRecord, NutritionRecord,
  HealthMeasurement, HealthAppointment, HealthNote, WorkProject, LearningItem,
  Meeting, Person, Interaction, ValueItem, SpiritualPractice, Commitment,
  ThingItem, DocumentItem, WarrantyItem, ReceiptItem, CertificateItem,
  ImportantRecordItem, ReminderItem, NotificationItem, AchievementItem,
  CalcHistoryItem, Skill, Course, WorkResponsibility
} from './types';
import { storage, seedInitialDataIfEmpty, verifyProfilePassword, verifyProfileRecoveryAnswer, getProfileSecurityInfo, setProfileCredentials, resetProfilePassword, createLocalProfile, generateUUID } from './lib/storage';

// Components
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { QuickCaptureModal } from './components/QuickCaptureModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { BsDateModal } from './components/BsDateModal';
import { MultiUserModal } from './components/MultiUserModal';
import { ComputerFolderBackupModal } from './components/ComputerFolderBackupModal';
import { AlarmTriggerModal } from './components/AlarmTriggerModal';
import { VoiceStudioWidget } from './components/VoiceStudioWidget';
import { alarmService, TriggeredAlarmData } from './lib/alarmService';

// Views
import { DashboardView } from './views/DashboardView';
import { TasksView } from './views/TasksView';
import { RoutineView } from './views/RoutineView';
import { GoalsView } from './views/GoalsView';
import { FocusView } from './views/FocusView';
import { NotesView } from './views/NotesView';
import { JournalView } from './views/JournalView';
import { CalculatorView } from './views/CalculatorView';
import { FinanceView } from './views/FinanceView';
import { HealthView } from './views/HealthView';
import { WorkView } from './views/WorkView';
import { PeopleView } from './views/PeopleView';
import { SpiritualView } from './views/SpiritualView';
import { ThingsView } from './views/ThingsView';
import { SettingsView } from './views/SettingsView';


function AppLockScreen({
  settings,
  onUnlocked
}: {
  settings: AppState;
  onUnlocked: (profileId: string) => void;
}) {
  const profiles = settings.profiles || [];
  const initialProfile = profiles.find(p => p.id === settings.profileId) || profiles[0];
  const [profileId, setProfileId] = useState(initialProfile?.id || '');
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'setup' | 'recovery' | 'reset'>('login');
  const [hint, setHint] = useState('');
  const [question, setQuestion] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [recoveryIdentity, setRecoveryIdentity] = useState('');
  const [recoveryProfileId, setRecoveryProfileId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [newHint, setNewHint] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newRecoveryAnswer, setNewRecoveryAnswer] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [helpMode, setHelpMode] = useState<'choose' | 'username' | 'password'>('choose');
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createPasswordConfirm, setCreatePasswordConfirm] = useState('');
  const [createHint, setCreateHint] = useState('');
  const [createQuestion, setCreateQuestion] = useState('');
  const [createRecoveryAnswer, setCreateRecoveryAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const resolveProfile = (value: string) => {
    const needle = value.trim().toLowerCase();
    return profiles.find(p => p.name.trim().toLowerCase() === needle || (p.email || '').trim().toLowerCase() === needle);
  };

  const loadProfileSecurity = async (id: string) => {
    const info = await getProfileSecurityInfo(id);
    setHint(info?.passwordHint || '');
    setQuestion(info?.recoveryQuestion || '');
    return info;
  };

  useEffect(() => {
    let cancelled = false;
    const loadInitial = async () => {
      if (!profileId) return;
      const info = await getProfileSecurityInfo(profileId);
      if (cancelled) return;
      setHint(info?.passwordHint || '');
      setQuestion(info?.recoveryQuestion || '');
      // Existing profiles with complete credentials always land on the normal login.
      // Only a genuinely credential-less profile enters one-time setup.
      if (!info?.credentialsReady) {
        setIdentity((profiles.find(p => p.id === profileId) || initialProfile)?.name || '');
        setMode('setup');
      } else {
        setMode('login');
      }
    };
    loadInitial().catch(err => { if (!cancelled) setError(err?.message || 'Unable to load profile security settings.'); });
    return () => { cancelled = true; };
  }, [profileId]);

  const resetTransient = () => {
    setPassword('');
    setRecoveryAnswer('');
    setNewPassword('');
    setNewPasswordConfirm('');
    setNewHint('');
    setNewQuestion('');
    setNewRecoveryAnswer('');
    setError('');
  };

  const login = async () => {
    const profile = resolveProfile(identity);
    if (!profile) throw new Error('Username / Profile not found.');
    const info = await loadProfileSecurity(profile.id);
    setProfileId(profile.id);
    if (!info?.credentialsReady) {
      setMode('setup');
      throw new Error('This profile needs its one-time password setup first.');
    }
    const ok = await verifyProfilePassword(profile.id, password);
    if (!ok) throw new Error('Incorrect password.');
    onUnlocked(profile.id);
  };

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      if (mode === 'login') {
        await login();
        return;
      }
      if (mode === 'setup') {
        const profile = profiles.find(p => p.id === profileId) || resolveProfile(identity);
        if (!profile) throw new Error('Profile not found.');
        if (newPassword.length < 6) throw new Error('Password must be at least 6 characters.');
        if (newPassword !== newPasswordConfirm) throw new Error('Password and Confirm Password do not match.');
        if (!newHint.trim() || !newQuestion.trim() || !newRecoveryAnswer.trim()) throw new Error('Password hint, recovery question, and recovery answer are required.');
        await setProfileCredentials(profile.id, newPassword, newHint, newQuestion, newRecoveryAnswer);
        onUnlocked(profile.id);
        return;
      }
      if (mode === 'recovery') {
        const profile = profiles.find(p => p.id === recoveryProfileId);
        if (!profile) throw new Error('Profile not found.');
        const ok = await verifyProfileRecoveryAnswer(profile.id, recoveryAnswer);
        if (!ok) throw new Error('Recovery answer is incorrect.');
        setMode('reset');
        setRecoveryAnswer('');
        return;
      }
      if (mode === 'reset') {
        const profile = profiles.find(p => p.id === recoveryProfileId);
        if (!profile) throw new Error('Profile not found.');
        if (newPassword.length < 6) throw new Error('Password must be at least 6 characters.');
        if (newPassword !== newPasswordConfirm) throw new Error('Password and Confirm Password do not match.');
        if (!newHint.trim()) throw new Error('Password hint is required.');
        await resetProfilePassword(profile.id, newPassword, newHint);
        onUnlocked(profile.id);
      }
    } catch (e: any) {
      setError(e?.message || 'Unable to continue.');
    } finally {
      setBusy(false);
    }
  };

  const startForgotPassword = () => {
    resetTransient();
    setShowHelp(true);
    setHelpMode('password');
    setMode('login');
  };

  const continueForgotPassword = async () => {
    setBusy(true);
    setError('');
    try {
      const profile = resolveProfile(recoveryIdentity);
      if (!profile) throw new Error('Username / Profile not found.');
      const info = await loadProfileSecurity(profile.id);
      if (!info?.credentialsReady) throw new Error('This profile has not completed password setup yet.');
      setRecoveryProfileId(profile.id);
      setMode('recovery');
    } catch (e: any) {
      setError(e?.message || 'Unable to start password recovery.');
    } finally {
      setBusy(false);
    }
  };

  const startCreate = () => {
    resetTransient();
    setShowCreate(true);
    setShowHelp(false);
    setMode('login');
  };

  const createProfile = async () => {
    setBusy(true);
    setError('');
    try {
      if (!createName.trim()) throw new Error('Profile name is required.');
      if (createPassword.length < 6) throw new Error('Password must be at least 6 characters.');
      if (createPassword !== createPasswordConfirm) throw new Error('Password and Confirm Password do not match.');
      if (!createHint.trim() || !createQuestion.trim() || !createRecoveryAnswer.trim()) throw new Error('Password hint, recovery question, and recovery answer are required.');
      const current = (await storage.getSingleton<AppState>('appSettings')) || settings;
      const id = generateUUID();
      const slug = createName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
      const newProfile = {
        id,
        name: createName.trim(),
        role: 'Local Profile',
        email: `${slug}-${id.slice(0, 8)}@omlifeos.local`,
        authType: 'local' as const,
        avatarChar: createName.trim().charAt(0).toUpperCase(),
        avatarColor: '#5d57c9',
        isCurrent: false,
        createdAt: Date.now()
      };
      await createLocalProfile(current, newProfile, createPassword, createHint, createQuestion, createRecoveryAnswer);
      setCreateName(''); setCreatePassword(''); setCreatePasswordConfirm(''); setCreateHint(''); setCreateQuestion(''); setCreateRecoveryAnswer('');
      setShowCreate(false);
      setIdentity(newProfile.name);
      onUnlocked(newProfile.id);
    } catch (e: any) {
      setError(e?.message || 'Unable to create local profile.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white text-xl font-black">OM</div>
          <h1 className="text-xl font-bold text-white">User Login</h1>
          <p className="mt-1 text-xs text-slate-400">Local profile access</p>
        </div>

        {mode === 'login' && !showCreate && (
          <>
            <div className="space-y-3">
              <input autoFocus type="text" value={identity} onChange={e => setIdentity(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="Username / Email Id" className="h-11 w-full rounded-full border border-slate-700 bg-slate-800 px-5 text-sm text-white outline-none focus:border-indigo-500" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="Password" className="h-11 w-full rounded-full border border-slate-700 bg-slate-800 px-5 text-sm text-white outline-none focus:border-indigo-500" />
              <button type="button" onClick={submit} disabled={busy} className="w-full rounded-full bg-indigo-600 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Checking…' : 'Login'}</button>
            </div>

            <button type="button" onClick={() => { setShowHelp(v => !v); setHelpMode('choose'); setError(''); }} className="mt-4 w-full text-xs font-semibold text-slate-400 hover:text-white hover:underline">
              Forgot Username / Password?
            </button>
            {showHelp && (
              <div className="mt-3 rounded-2xl border border-slate-700 bg-slate-800/70 p-3 space-y-2">
                {helpMode === 'choose' && (
                  <div className="grid grid-cols-1 gap-2">
                    <button type="button" onClick={() => setHelpMode('username')} className="rounded-xl border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-200">Forgot Username</button>
                    <button type="button" onClick={startForgotPassword} className="rounded-xl border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-200">Forgot Password</button>
                    <button type="button" onClick={startCreate} className="rounded-xl border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-200">Create Local Profile</button>
                  </div>
                )}
                {helpMode === 'username' && (
                  <div>
                    <div className="mb-2 text-xs text-slate-300">Your local profiles:</div>
                    <div className="space-y-1">
                      {profiles.map(p => <div key={p.id} className="rounded-lg bg-slate-900 px-3 py-2 text-xs text-white">{p.name}</div>)}
                    </div>
                  </div>
                )}
                {helpMode === 'password' && (
                  <div className="space-y-2">
                    <input type="text" value={recoveryIdentity} onChange={e => setRecoveryIdentity(e.target.value)} placeholder="Username / Email Id" className="h-10 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-xs text-white" />
                    <button type="button" onClick={continueForgotPassword} disabled={busy} className="w-full rounded-xl bg-indigo-600 py-2 text-xs font-bold text-white">Continue</button>
                  </div>
                )}
              </div>
            )}

          </>
        )}

        {mode === 'setup' && (
          <>
            <div className="mb-3 text-sm font-semibold text-white">Create password for {profiles.find(p => p.id === profileId)?.name || identity}</div>
            <div className="space-y-2">
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Create Password (min 6)" className="h-11 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 text-sm text-white" />
              <input type="password" value={newPasswordConfirm} onChange={e => setNewPasswordConfirm(e.target.value)} placeholder="Confirm Password" className="h-11 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 text-sm text-white" />
              <input type="text" value={newHint} onChange={e => setNewHint(e.target.value)} placeholder="Password Hint / Clue" className="h-11 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 text-sm text-white" />
              <input type="text" value={newQuestion} onChange={e => setNewQuestion(e.target.value)} placeholder="Recovery Question" className="h-11 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 text-sm text-white" />
              <input type="text" value={newRecoveryAnswer} onChange={e => setNewRecoveryAnswer(e.target.value)} placeholder="Recovery Answer" className="h-11 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 text-sm text-white" />
            </div>
            <button type="button" onClick={submit} disabled={busy} className="mt-3 w-full rounded-full bg-indigo-600 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Create Password & Open App'}</button>
          </>
        )}

        {mode === 'recovery' && (
          <>
            <div className="mb-2 text-sm font-semibold text-white">Password Recovery</div>
            <div className="mb-3 rounded-xl bg-slate-800 p-3 text-xs text-slate-300"><span className="font-bold text-slate-200">Hint:</span> {hint || 'No hint was saved.'}</div>
            <div className="mb-2 text-xs font-semibold text-slate-300">{question || 'Recovery question not configured.'}</div>
            <input autoFocus type="text" value={recoveryAnswer} onChange={e => setRecoveryAnswer(e.target.value)} placeholder="Recovery Answer" className="mb-3 h-11 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 text-sm text-white" />
            <button type="button" onClick={submit} disabled={busy} className="w-full rounded-full bg-indigo-600 py-3 text-sm font-bold text-white">Verify Recovery Answer</button>
            <button type="button" onClick={() => { setMode('login'); setShowHelp(true); setHelpMode('password'); resetTransient(); }} className="mt-3 w-full text-xs text-slate-400 hover:text-white">Back to login</button>
          </>
        )}

        {mode === 'reset' && (
          <>
            <div className="mb-3 text-sm font-semibold text-white">Set a New Password</div>
            <div className="space-y-2">
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New Password (min 6)" className="h-11 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 text-sm text-white" />
              <input type="password" value={newPasswordConfirm} onChange={e => setNewPasswordConfirm(e.target.value)} placeholder="Confirm New Password" className="h-11 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 text-sm text-white" />
              <input type="text" value={newHint} onChange={e => setNewHint(e.target.value)} placeholder="New Password Hint" className="h-11 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 text-sm text-white" />
            </div>
            <button type="button" onClick={submit} disabled={busy} className="mt-3 w-full rounded-full bg-indigo-600 py-3 text-sm font-bold text-white">Reset Password & Open App</button>
          </>
        )}

        {showCreate && (
          <div className="space-y-2">
            <div className="mb-2 text-sm font-semibold text-white">Create Local Profile</div>
            <input type="text" value={createName} onChange={e => setCreateName(e.target.value)} placeholder="Profile Name" className="h-11 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 text-sm text-white" />
            <input type="password" value={createPassword} onChange={e => setCreatePassword(e.target.value)} placeholder="Password (min 6)" className="h-11 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 text-sm text-white" />
            <input type="password" value={createPasswordConfirm} onChange={e => setCreatePasswordConfirm(e.target.value)} placeholder="Confirm Password" className="h-11 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 text-sm text-white" />
            <input type="text" value={createHint} onChange={e => setCreateHint(e.target.value)} placeholder="Password Hint / Clue" className="h-11 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 text-sm text-white" />
            <input type="text" value={createQuestion} onChange={e => setCreateQuestion(e.target.value)} placeholder="Recovery Question" className="h-11 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 text-sm text-white" />
            <input type="text" value={createRecoveryAnswer} onChange={e => setCreateRecoveryAnswer(e.target.value)} placeholder="Recovery Answer" className="h-11 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 text-sm text-white" />
            <button type="button" onClick={createProfile} disabled={busy} className="mt-2 w-full rounded-full bg-indigo-600 py-3 text-sm font-bold text-white">{busy ? 'Creating…' : 'Create Profile & Open App'}</button>
            <button type="button" onClick={() => { setShowCreate(false); setError(''); }} className="w-full py-2 text-xs text-slate-400 hover:text-white">Back to login</button>
          </div>
        )}

        {error && <div className="mt-4 rounded-xl border border-red-900/60 bg-red-950/40 p-3 text-xs text-red-300">{error}</div>}
      </div>
    </div>
  );
}

export default function App() {
  const [activeModule, setActiveModule] = useState<NavModule>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [quickCaptureType, setQuickCaptureType] = useState<string>('task');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isBsModalOpen, setIsBsModalOpen] = useState(false);
  const [isMultiUserOpen, setIsMultiUserOpen] = useState(false);
  const [isComputerBackupModalOpen, setIsComputerBackupModalOpen] = useState(false);
  const [activeTriggeredAlarm, setActiveTriggeredAlarm] = useState<TriggeredAlarmData | null>(null);
  const [isTransparent, setIsTransparent] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('om_clear_transparent') === 'true';
  });
  const [transparency, setTransparency] = useState<number>(() => {
    if (typeof window === 'undefined') return 45;
    const saved = Number(localStorage.getItem('om_transparency'));
    return Number.isFinite(saved) ? Math.min(100, Math.max(0, saved)) : 45;
  });

  // Entities state
  const [appSettings, setAppSettings] = useState<AppState | undefined>();
  const [unlockedProfileId, setUnlockedProfileId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);

  const [financeAccounts, setFinanceAccounts] = useState<FinanceAccount[]>([]);
  const [financeTransactions, setFinanceTransactions] = useState<FinanceTransaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanPayments, setLoanPayments] = useState<LoanPayment[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [savingsPlans, setSavingsPlans] = useState<SavingsPlan[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [financialGoals, setFinancialGoals] = useState<FinancialGoal[]>([]);

  const [notes, setNotes] = useState<Note[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);

  const [healthMeasurements, setHealthMeasurements] = useState<HealthMeasurement[]>([]);
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([]);
  const [waterRecords, setWaterRecords] = useState<WaterRecord[]>([]);
  const [nutritionRecords, setNutritionRecords] = useState<NutritionRecord[]>([]);
  const [appointments, setAppointments] = useState<HealthAppointment[]>([]);
  const [healthNotes, setHealthNotes] = useState<HealthNote[]>([]);

  const [workProjects, setWorkProjects] = useState<WorkProject[]>([]);
  const [workResponsibilities, setWorkResponsibilities] = useState<WorkResponsibility[]>([]);
  const [learningItems, setLearningItems] = useState<LearningItem[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const [people, setPeople] = useState<Person[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);

  const [values, setValues] = useState<ValueItem[]>([]);
  const [practices, setPractices] = useState<SpiritualPractice[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);

  const [things, setThings] = useState<ThingItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [warranties, setWarranties] = useState<WarrantyItem[]>([]);
  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [importantRecords, setImportantRecords] = useState<ImportantRecordItem[]>([]);

  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [calcHistory, setCalcHistory] = useState<CalcHistoryItem[]>([]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 2500);
  }, []);

  const loadAllData = useCallback(async () => {
    try {
      const settingsData = await storage.getSingleton<AppState>('appSettings');
      if (!settingsData?.profileId) return;
      setAppSettings(settingsData);
      if (settingsData.themeMode) setTheme(settingsData.themeMode);
      if (unlockedProfileId && settingsData.profileId !== unlockedProfileId) {
        storage.setActiveProfile(null);
        return;
      }
      if (!unlockedProfileId) return;
      storage.setActiveProfile(settingsData.profileId);
      await storage.ensureProfileOwnership(settingsData.profileId);
      const [
        tasksData,
        goalsData,
        milestonesData,
        strategiesData,
        kpisData,
        missionsData,
        routinesData,
        habitsData,
        habitLogsData,
        acctsData,
        txData,
        loansData,
        loanPaymentsData,
        investmentsData,
        savingsData,
        assetsData,
        liabilitiesData,
        fgData,
        notesData,
        journalData,
        focusData,
        measData,
        sleepData,
        waterData,
        nutriData,
        apptsData,
        hNotesData,
        projData,
        respData,
        learnData,
        skillsData,
        coursesData,
        meetData,
        peopleData,
        interData,
        valData,
        pracData,
        commData,
        thingData,
        docData,
        warData,
        recData,
        certData,
        irData,
        remData,
        notifData,
        achData,
        calcData
      ] = await Promise.all([
        storage.getAll<Task>('tasks'),
        storage.getAll<Goal>('goals'),
        storage.getAll<Milestone>('milestones'),
        storage.getAll<Strategy>('strategies'),
        storage.getAll<KPI>('kpis'),
        storage.getAll<Mission>('missions'),
        storage.getAll<Routine>('routines'),
        storage.getAll<Habit>('habits'),
        storage.getAll<HabitLog>('habitLogs'),
        storage.getAll<FinanceAccount>('financeAccounts'),
        storage.getAll<FinanceTransaction>('finance'),
        storage.getAll<Loan>('loans'),
        storage.getAll<LoanPayment>('loanPayments'),
        storage.getAll<Investment>('investments'),
        storage.getAll<SavingsPlan>('savingsPlans'),
        storage.getAll<Asset>('assets'),
        storage.getAll<Liability>('liabilities'),
        storage.getAll<FinancialGoal>('financialGoals'),
        storage.getAll<Note>('notes'),
        storage.getAll<JournalEntry>('journal'),
        storage.getAll<FocusSession>('focus'),
        storage.getAll<HealthMeasurement>('healthMeasurements'),
        storage.getAll<SleepRecord>('sleepRecords'),
        storage.getAll<WaterRecord>('waterRecords'),
        storage.getAll<NutritionRecord>('nutritionRecords'),
        storage.getAll<HealthAppointment>('healthAppointments'),
        storage.getAll<HealthNote>('healthNotes'),
        storage.getAll<WorkProject>('workProjects'),
        storage.getAll<WorkResponsibility>('workResponsibilities'),
        storage.getAll<LearningItem>('learningItems'),
        storage.getAll<Skill>('skills'),
        storage.getAll<Course>('courses'),
        storage.getAll<Meeting>('meetings'),
        storage.getAll<Person>('people'),
        storage.getAll<Interaction>('interactions'),
        storage.getAll<ValueItem>('values'),
        storage.getAll<SpiritualPractice>('spiritualPractices'),
        storage.getAll<Commitment>('commitments'),
        storage.getAll<ThingItem>('things'),
        storage.getAll<DocumentItem>('documents'),
        storage.getAll<WarrantyItem>('warranties'),
        storage.getAll<ReceiptItem>('receipts'),
        storage.getAll<CertificateItem>('certificates'),
        storage.getAll<ImportantRecordItem>('importantRecords'),
        storage.getAll<ReminderItem>('reminders'),
        storage.getAll<NotificationItem>('notifications'),
        storage.getAll<AchievementItem>('achievements'),
        storage.getAll<CalcHistoryItem>('calcHistory')
      ]);

      if (settingsData) {
        setAppSettings(settingsData);
        if (settingsData.themeMode) {
          setTheme(settingsData.themeMode);
        }
      }

      setTasks([...tasksData]);
      setGoals([...goalsData]);
      setMilestones([...milestonesData]);
      setStrategies([...strategiesData]);
      setKpis([...kpisData]);
      setMissions([...missionsData]);
      setRoutines([...routinesData]);
      setHabits([...habitsData]);
      setHabitLogs([...habitLogsData]);
      setFinanceAccounts([...acctsData]);
      setFinanceTransactions([...txData]);
      setLoans([...loansData]);
      setLoanPayments([...loanPaymentsData]);
      setInvestments([...investmentsData]);
      setSavingsPlans([...savingsData]);
      setAssets([...assetsData]);
      setLiabilities([...liabilitiesData]);
      setFinancialGoals([...fgData]);
      setNotes([...notesData]);
      setJournal([...journalData]);
      setFocusSessions([...focusData]);
      setHealthMeasurements([...measData]);
      setSleepRecords([...sleepData]);
      setWaterRecords([...waterData]);
      setNutritionRecords([...nutriData]);
      setAppointments([...apptsData]);
      setHealthNotes([...hNotesData]);
      setWorkProjects([...projData]);
      setWorkResponsibilities([...respData]);
      setLearningItems([...learnData]);
      setSkills([...skillsData]);
      setCourses([...coursesData]);
      setMeetings([...meetData]);
      setPeople([...peopleData]);
      setInteractions([...interData]);
      setValues([...valData]);
      setPractices([...pracData]);
      setCommitments([...commData]);
      setThings([...thingData]);
      setDocuments([...docData]);
      setWarranties([...warData]);
      setReceipts([...recData]);
      setCertificates([...certData]);
      setImportantRecords([...irData]);
      setReminders([...remData]);
      setNotifications([...notifData]);
      setAchievements([...achData]);
      setCalcHistory([...calcData]);
    } catch (err) {
      console.error('Failed to load initial data', err);
    }
  }, [unlockedProfileId]);

  // First turn initialization: load only settings before the app is unlocked.
  useEffect(() => {
    seedInitialDataIfEmpty().then(async () => {
      const settingsData = await storage.getSingleton<AppState>('appSettings');
      if (settingsData) {
        setAppSettings(settingsData);
        if (settingsData.themeMode) setTheme(settingsData.themeMode);
      }
    }).catch(err => console.error('Failed to initialize Om-LifeOS', err));

    // Subscribe to scheduled alarms & reminder triggers
    alarmService.onAlarmTrigger((alarmData) => {
      setActiveTriggeredAlarm(alarmData);
    });
  }, [loadAllData]);

  // Sync theme with HTML root class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-lifeos-mode', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-lifeos-mode', 'light');
    }
    const brandColor = appSettings?.accentColor || '#6366f1';
    document.documentElement.style.setProperty('--color-brand', brandColor);
  }, [theme, appSettings?.accentColor]);

  // Sync clear transparency mode with HTML root
  useEffect(() => {
    if (isTransparent) {
      document.documentElement.setAttribute('data-transparent', 'true');
    } else {
      document.documentElement.removeAttribute('data-transparent');
    }
  }, [isTransparent]);

  // Keep 45% as the current glass look, while allowing the same glass to become
  // more solid toward 0% or more clear toward 100%. Text/icons are unaffected.
  useEffect(() => {
    const value = Math.min(100, Math.max(0, transparency));
    const headerAlpha = value <= 45
      ? 1 - (1 - 0.35) * (value / 45)
      : 0.35 * (1 - (value - 45) / 55);
    const cardAlpha = value <= 45
      ? 1 - (1 - 0.30) * (value / 45)
      : 0.30 * (1 - (value - 45) / 55);
    document.documentElement.style.setProperty('--glass-header-alpha', headerAlpha.toFixed(3));
    document.documentElement.style.setProperty('--glass-card-alpha', cardAlpha.toFixed(3));
    localStorage.setItem('om_transparency', String(value));
  }, [transparency]);

  const updateTransparency = (value: number) => {
    setTransparency(Math.min(100, Math.max(0, value)));
  };

  const toggleTransparent = () => {
    setIsTransparent(prev => {
      const next = !prev;
      localStorage.setItem('om_clear_transparent', String(next));
      showToast(next ? '👁️ Transparent Mode: ON' : 'Solid Mode: ON');
      return next;
    });
  };

  // Keyboard Shortcuts (⌘K for search, Alt+T for transparent)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
      if ((e.altKey && e.key.toLowerCase() === 't') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 't')) {
        e.preventDefault();
        toggleTransparent();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Multi-tab cross-device broadcast listener
  useEffect(() => {
    const channel = storage.getChannel();
    if (!channel) return;

    const handleMessage = (e: MessageEvent) => {
      if (e.data?.sourceDevice !== storage.deviceId && unlockedProfileId) {
        loadAllData();
      }
    };
    channel.addEventListener('message', handleMessage);
    return () => channel.removeEventListener('message', handleMessage);
  }, [loadAllData, unlockedProfileId]);

  const handleProfileUnlocked = useCallback(async (profileId: string) => {
    const settings = (await storage.getSingleton<AppState>('appSettings')) || ({} as AppState);
    const profile = settings.profiles?.find(p => p.id === profileId);
    if (!profile) return;
    settings.profileId = profileId;
    settings.profiles = (settings.profiles || []).map(p => ({ ...p, isCurrent: p.id === profileId }));
    settings.currentUser = { name: profile.name, email: profile.email, provider: 'local' };
    await storage.setSingleton('appSettings', settings);
    storage.setActiveProfile(profileId);
    await storage.ensureProfileOwnership(profileId);
    setUnlockedProfileId(profileId);
    setAppSettings(settings);
    await loadAllData();
  }, [loadAllData]);

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    const settingsObj = (await storage.getSingleton<AppState>('appSettings')) || {
      profileId: 'default',
      profiles: [],
      themeMode: newTheme,
      accentColor: '#5d57c9',
      notificationsEnabled: true,
      noteCategories: ['General'],
      calcFavorites: []
    };
    settingsObj.themeMode = newTheme;
    await storage.setSingleton('appSettings', settingsObj);
  };

  const handleToggleTask = async (id: string) => {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    const updated: Task = {
      ...t,
      done: !t.done,
      status: !t.done ? 'done' : 'open',
      updatedAt: Date.now()
    };
    await storage.put('tasks', updated);
    loadAllData();
  };

  const handleLogHabit = async (habitId: string, occurrence = 0) => {
    const today = new Date().toISOString().slice(0, 10);
    const key = `${habitId}|${today}|${occurrence}`;
    const existing = habitLogs.find(l => l.key === key);

    if (existing) {
      await storage.delete('habitLogs', existing.id);
    } else {
      const newLog: HabitLog = {
        id: (await import('./lib/storage')).generateUUID(),
        key,
        habitId,
        date: today,
        occurrence,
        createdAt: Date.now()
      };
      await storage.put('habitLogs', newLog);
    }
    loadAllData();
  };

  const openTasksCount = tasks.filter(t => !t.done).length;
  const categoriesList = appSettings?.noteCategories || ['General', 'Strategy', 'Projects', 'Finance', 'Ideas'];

  if (!appSettings) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">Loading Om-LifeOS…</div>;
  }

  if (!unlockedProfileId || unlockedProfileId !== appSettings.profileId) {
    return <AppLockScreen settings={appSettings} onUnlocked={handleProfileUnlocked} />;
  }

  return (
    <div
      data-app-root="true"
      className={`flex min-h-screen flex-col font-sans text-slate-900 selection:bg-indigo-500 selection:text-white dark:text-slate-100 ${
        isTransparent ? 'bg-transparent' : 'bg-slate-50 dark:bg-slate-950'
      }`}
    >
      {/* Top Bar */}
      <Header
        activeModule={activeModule}
        onNavigate={setActiveModule}
        onOpenQuickCapture={(type = 'task') => {
          setQuickCaptureType(type);
          setIsQuickCaptureOpen(true);
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenBsModal={() => setIsBsModalOpen(true)}
        onOpenMultiUser={() => setIsMultiUserOpen(true)}
        onOpenComputerBackup={() => setIsComputerBackupModalOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        profiles={appSettings?.profiles || [{ id: 'default', name: 'Primary Workspace', createdAt: Date.now() }]}
        currentProfileId={appSettings?.profileId || 'default'}
        onSelectProfile={async id => {
          const s = (await storage.getSingleton<AppState>('appSettings')) || ({} as AppState);
          s.profileId = id;
          s.profiles = (s.profiles || []).map(p => ({ ...p, isCurrent: p.id === id }));
          await storage.setSingleton('appSettings', s);
          setAppSettings(s);
          setUnlockedProfileId(null);
          showToast('Profile selected — password required');
        }}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
      />

      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar
          activeModule={activeModule}
          onNavigate={setActiveModule}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          openTasksCount={openTasksCount}
          remindersCount={reminders.filter(r => r.status !== 'done').length}
          onOpenComputerBackup={() => setIsComputerBackupModalOpen(true)}
        />

        {/* Main Content Viewport - Responsive across Mobile, Tablet, Laptop, and Desktop */}
        <main className="flex-1 overflow-y-auto px-3.5 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 pb-24 md:pb-10 transition-colors">
          <div className="mx-auto w-full max-w-7xl space-y-6">
            {activeModule === 'dashboard' && (
              <DashboardView
                tasks={tasks}
                goals={goals}
                routines={routines}
                habits={habits}
                habitLogs={habitLogs}
                finance={financeTransactions}
                accounts={financeAccounts}
                notes={notes}
                journal={journal}
                dailyPlanner={appSettings?.dailyPlanner}
                reminders={reminders}
                achievements={achievements}
                onNavigate={setActiveModule}
                onToggleTask={handleToggleTask}
                onLogHabit={handleLogHabit}
                onOpenQuickCapture={type => {
                  setQuickCaptureType(type || 'task');
                  setIsQuickCaptureOpen(true);
                }}
              />
            )}

            {activeModule === 'tasks' && (
              <TasksView
                tasks={tasks}
                goals={goals}
                dailyPlanner={appSettings?.dailyPlanner}
                onRefresh={loadAllData}
                onSuccess={showToast}
              />
            )}

            {activeModule === 'routine' && (
              <RoutineView
                routines={routines}
                habits={habits}
                habitLogs={habitLogs}
                onRefresh={loadAllData}
                onSuccess={showToast}
              />
            )}

            {activeModule === 'goals' && (
              <GoalsView
                goals={goals}
                milestones={milestones}
                strategies={strategies}
                kpis={kpis}
                missions={missions}
                mentor={appSettings?.mentor}
                accounts={financeAccounts}
                onRefresh={loadAllData}
                onSuccess={showToast}
              />
            )}

            {activeModule === 'focus' && (
              <FocusView
                sessions={focusSessions}
                tasks={tasks}
                goals={goals}
                onRefresh={loadAllData}
                onSuccess={showToast}
              />
            )}

            {activeModule === 'notes' && (
              <NotesView
                notes={notes}
                categories={categoriesList}
                onRefresh={loadAllData}
                onSuccess={showToast}
              />
            )}

            {activeModule === 'journal' && (
              <JournalView
                journal={journal}
                onRefresh={loadAllData}
                onSuccess={showToast}
              />
            )}

            {activeModule === 'calculator' && (
              <CalculatorView
                history={calcHistory}
                favorites={appSettings?.calcFavorites || []}
                onRefresh={loadAllData}
                onSuccess={showToast}
              />
            )}

            {activeModule === 'finance' && (
              <FinanceView
                accounts={financeAccounts}
                transactions={financeTransactions}
                loans={loans}
                loanPayments={loanPayments}
                investments={investments}
                savingsPlans={savingsPlans}
                assets={assets}
                liabilities={liabilities}
                financialGoals={financialGoals}
                receipts={receipts}
                onNavigate={setActiveModule}
                onRefresh={loadAllData}
                onSuccess={showToast}
              />
            )}

            {activeModule === 'health' && (
              <HealthView
                profile={undefined}
                measurements={healthMeasurements}
                sleepRecords={sleepRecords}
                waterRecords={waterRecords}
                nutritionRecords={nutritionRecords}
                appointments={appointments}
                healthNotes={healthNotes}
                onRefresh={loadAllData}
                onSuccess={showToast}
              />
            )}

            {activeModule === 'work' && (
              <WorkView
                projects={workProjects}
                responsibilities={workResponsibilities}
                learningItems={learningItems}
                skills={skills}
                courses={courses}
                meetings={meetings}
                onRefresh={loadAllData}
                onSuccess={showToast}
              />
            )}

            {activeModule === 'people' && (
              <PeopleView
                people={people}
                interactions={interactions}
                onRefresh={loadAllData}
                onSuccess={showToast}
              />
            )}

            {activeModule === 'spiritual' && (
              <SpiritualView
                values={values}
                practices={practices}
                commitments={commitments}
                onNavigate={setActiveModule}
                onRefresh={loadAllData}
                onSuccess={showToast}
              />
            )}

            {activeModule === 'things' && (
              <ThingsView
                things={things}
                documents={documents}
                warranties={warranties}
                receipts={receipts}
                financeAccounts={financeAccounts}
                financeTransactions={financeTransactions}
                onNavigate={setActiveModule}
                certificates={certificates}
                importantRecords={importantRecords}
                onRefresh={loadAllData}
                onSuccess={showToast}
              />
            )}

            {activeModule === 'settings' && (
              <SettingsView
                settings={appSettings}
                onRefresh={loadAllData}
                onSuccess={showToast}
                onError={msg => showToast(`⚠️ ${msg}`)}
                theme={theme}
                onToggleTheme={toggleTheme}
                isTransparent={isTransparent}
                onToggleTransparent={toggleTransparent}
                transparency={transparency}
                onTransparencyChange={updateTransparency}
              />
            )}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Thumb Navigation */}
      <MobileBottomNav activeModule={activeModule} onNavigate={setActiveModule} />

      {/* Quick Capture Dialog */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        initialType={quickCaptureType}
        onSuccess={showToast}
        reloadAll={loadAllData}
      />

      {/* Global Search Dialog */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={setActiveModule}
      />

      {/* Nepali Bikram Sambat Date Modal */}
      <BsDateModal
        isOpen={isBsModalOpen}
        onClose={() => setIsBsModalOpen(false)}
      />

      <MultiUserModal
        isOpen={isMultiUserOpen}
        onClose={() => setIsMultiUserOpen(false)}
        appSettings={appSettings}
        onRefresh={loadAllData}
        onSuccess={showToast}
        onError={msg => showToast(`⚠️ ${msg}`)}
      />

      {/* Direct Computer Folder Backup Modal */}
      <ComputerFolderBackupModal
        isOpen={isComputerBackupModalOpen}
        onClose={() => setIsComputerBackupModalOpen(false)}
        onSuccess={showToast}
        onError={msg => showToast(`⚠️ ${msg}`)}
      />

      {/* Real-time Global Alarm Trigger Modal */}
      <AlarmTriggerModal
        alarm={activeTriggeredAlarm}
        onDismiss={async () => {
          await alarmService.dismissAlarm();
          setActiveTriggeredAlarm(null);
          loadAllData();
        }}
        onSnooze={async (mins = 5) => {
          await alarmService.snoozeAlarm(mins);
          setActiveTriggeredAlarm(null);
          showToast(`⏰ Alarm snoozed for ${mins} minutes`);
          loadAllData();
        }}
      />

      {/* Global High-Accuracy Voice-to-Text & Text Reading Studio (Hindi & English) */}
      <VoiceStudioWidget
        onSuccess={showToast}
        onRefreshNotes={loadAllData}
        onRefreshJournal={loadAllData}
        onRefreshTasks={loadAllData}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-16 right-4 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-2xl dark:bg-white dark:text-slate-900 animate-in fade-in slide-in-from-bottom-2 sm:bottom-6 sm:right-6">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
