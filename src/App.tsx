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
import { storage, seedInitialDataIfEmpty } from './lib/storage';

// Components
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { QuickCaptureModal } from './components/QuickCaptureModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { BsDateModal } from './components/BsDateModal';
import { MultiUserModal } from './components/MultiUserModal';
import { ComputerFolderBackupModal } from './components/ComputerFolderBackupModal';

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

  // Entities state
  const [appSettings, setAppSettings] = useState<AppState | undefined>();
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
      const [
        settingsData,
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
        storage.getSingleton<AppState>('appSettings'),
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
  }, []);

  // First turn initialization
  useEffect(() => {
    seedInitialDataIfEmpty().then(() => {
      loadAllData();
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

  // Keyboard Shortcuts (⌘K for search, ⌘C for quick capture)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
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
      if (e.data?.sourceDevice !== storage.deviceId) {
        loadAllData();
      }
    };
    channel.addEventListener('message', handleMessage);
    return () => channel.removeEventListener('message', handleMessage);
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

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900 selection:bg-indigo-500 selection:text-white dark:bg-slate-950 dark:text-slate-100">
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
          await storage.setSingleton('appSettings', s);
          loadAllData();
          showToast('Workspace switched');
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

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 pb-20 md:pb-8">
          <div className="mx-auto max-w-6xl">
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

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-16 right-4 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-2xl dark:bg-white dark:text-slate-900 animate-in fade-in slide-in-from-bottom-2 sm:bottom-6 sm:right-6">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
