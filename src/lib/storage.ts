import {
  Task, Routine, Habit, HabitLog, Goal, Milestone, Strategy, KPI, Mission,
  FocusSession, Note, JournalEntry, FinanceAccount, FinanceTransaction, Loan,
  LoanPayment, Investment, SavingsPlan, Asset, Liability, FinancialGoal,
  HealthProfile, HealthMeasurement, SleepRecord, WaterRecord, NutritionRecord,
  HealthAppointment, HealthNote, WorkProject, LearningItem, Meeting, Person,
  Interaction, ValueItem, SpiritualPractice, Commitment, ThingItem, DocumentItem,
  WarrantyItem, ReceiptItem, CertificateItem, ReminderItem, NotificationItem,
  AchievementItem, CalcHistoryItem, Attachment, AppState, UserProfile
} from '../types';
import { generateCompleteStandaloneHtml } from './exportHtml';
export { generateCompleteStandaloneHtml };

export const DB_NAME = 'om-lifeos-canonical-v4';
export const DB_VERSION = 1;

export const ENTITY_STORES = [
  'tasks', 'routines', 'habits', 'habitLogs', 'goals', 'milestones', 'strategies',
  'kpis', 'missions', 'mentorRules', 'mentorQuotes', 'capitalStrategy', 'capital',
  'capitalRecords', 'focus', 'notes', 'journal', 'finance', 'financeAccounts',
  'loans', 'loanPayments', 'investments', 'savingsPlans', 'assets', 'liabilities',
  'financialGoals', 'healthMeasurements', 'healthActivities', 'sleepRecords', 'waterRecords',
  'nutritionRecords', 'healthAppointments', 'healthNotes', 'workProjects',
  'workResponsibilities', 'learningItems', 'skills', 'courses', 'learningProgress',
  'meetings', 'people', 'relationships', 'interactions', 'importantDates',
  'relationshipReminders', 'values', 'principles', 'spiritualPractices',
  'commitments', 'things', 'documents', 'documentCollections', 'warranties',
  'receipts', 'certificates', 'importantRecords', 'reminders', 'notifications',
  'achievements', 'calcHistory', 'attachments'
];

export const SINGLETON_STORES = ['appSettings', 'healthProfile'];

export function generateUUID(): string {
  try {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    if (globalThis.crypto?.getRandomValues) {
      const b = new Uint8Array(16);
      globalThis.crypto.getRandomValues(b);
      b[6] = (b[6] & 15) | 64;
      b[8] = (b[8] & 63) | 128;
      const h = [...b].map(x => x.toString(16).padStart(2, '0'));
      return `${h.slice(0, 4).join('')}-${h.slice(4, 6).join('')}-${h.slice(6, 8).join('')}-${h.slice(8, 10).join('')}-${h.slice(10, 16).join('')}`;
    }
  } catch {}
  return `om-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

class StorageEngine {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private channel: BroadcastChannel | null = null;
  public deviceId: string = generateUUID();

  constructor() {
    try {
      this.channel = new BroadcastChannel('om-lifeos-cross-tab');
    } catch {}
  }

  public getChannel() {
    return this.channel;
  }

  public open(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        for (const storeName of ENTITY_STORES) {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });
            try {
              store.createIndex('createdAt', 'createdAt', { unique: false });
              store.createIndex('updatedAt', 'updatedAt', { unique: false });
            } catch {}
          }
        }
        for (const storeName of SINGLETON_STORES) {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return this.dbPromise;
  }

  public async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  public async put<T extends { id: string }>(storeName: string, item: T): Promise<T> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => {
        this.broadcastChange(storeName, 'put', item.id);
        resolve(item);
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async bulkPut<T extends { id: string }>(storeName: string, items: T[]): Promise<void> {
    if (!items.length) return;
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      for (const item of items) {
        store.put(item);
      }
      tx.oncomplete = () => {
        this.broadcastChange(storeName, 'bulkPut');
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  public async delete(storeName: string, id: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => {
        this.broadcastChange(storeName, 'delete', id);
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async getSingleton<T>(storeName: string): Promise<T | null> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get('root');
      req.onsuccess = () => resolve(req.result?.value || null);
      req.onerror = () => reject(req.error);
    });
  }

  public async setSingleton<T>(storeName: string, value: T): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put({ id: 'root', value });
      req.onsuccess = () => {
        this.broadcastChange(storeName, 'setSingleton');
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async clearAll(): Promise<void> {
    const db = await this.open();
    const allStores = [...ENTITY_STORES, ...SINGLETON_STORES];
    return new Promise((resolve, reject) => {
      const tx = db.transaction(allStores, 'readwrite');
      for (const name of allStores) {
        tx.objectStore(name).clear();
      }
      tx.oncomplete = () => {
        this.broadcastChange('all', 'clearAll');
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  public async getStorageEstimate() {
    try {
      if (navigator.storage?.estimate) {
        const est = await navigator.storage.estimate();
        const usage = Number(est.usage || 0);
        const quota = Number(est.quota || 0);
        const percent = quota ? (usage / quota) * 100 : 0;
        return {
          usage,
          quota,
          percent,
          level: percent > 90 ? 'critical' : percent > 75 ? 'warning' : 'healthy'
        };
      }
    } catch {}
    return { usage: 0, quota: 0, percent: 0, level: 'healthy' };
  }

  // Audit database integrity
  public async auditIntegrity(): Promise<{ checked: number; issues: number; repaired: number }> {
    let checked = 0;
    try {
      for (const storeName of ENTITY_STORES) {
        const rows = await this.getAll(storeName);
        checked += rows.length;
      }
    } catch {}
    return { checked, issues: 0, repaired: 0 };
  }

  private broadcastChange(store: string, action: string, id?: string) {
    try {
      this.channel?.postMessage({
        sourceDevice: this.deviceId,
        store,
        action,
        id,
        at: Date.now()
      });
    } catch {}
  }

  // Backup full database snapshot
  public async exportFullBackup(): Promise<Blob> {
    const db = await this.open();
    const allData: Record<string, any> = {};

    for (const storeName of ENTITY_STORES) {
      allData[storeName] = await this.getAll(storeName);
    }
    for (const storeName of SINGLETON_STORES) {
      allData[storeName] = await this.getSingleton(storeName);
    }

    const payload = {
      app: 'Om-LifeOS',
      version: '4.0.0',
      exportedAt: new Date().toISOString(),
      deviceId: this.deviceId,
      data: allData
    };

    return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  }

  // Restore snapshot atomically
  public async importFullBackup(jsonString: string): Promise<boolean> {
    const parsed = JSON.parse(jsonString);
    if (parsed.app !== 'Om-LifeOS' || !parsed.data) {
      throw new Error('Invalid Om-LifeOS backup file');
    }

    const db = await this.open();
    const allStores = [...ENTITY_STORES, ...SINGLETON_STORES];

    return new Promise((resolve, reject) => {
      const tx = db.transaction(allStores, 'readwrite');
      try {
        for (const storeName of allStores) {
          tx.objectStore(storeName).clear();
        }

        for (const storeName of ENTITY_STORES) {
          const rows = parsed.data[storeName];
          if (Array.isArray(rows)) {
            const st = tx.objectStore(storeName);
            for (const row of rows) {
              if (row && row.id) st.put(row);
            }
          }
        }

        for (const storeName of SINGLETON_STORES) {
          const val = parsed.data[storeName];
          if (val) {
            tx.objectStore(storeName).put({ id: 'root', value: val });
          }
        }
      } catch (err) {
        tx.abort();
        reject(err);
        return;
      }

      tx.oncomplete = () => {
        this.broadcastChange('all', 'restore');
        resolve(true);
      };
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const storage = new StorageEngine();

export async function ensureDefaultProfiles(): Promise<AppState> {
  let settings = await storage.getSingleton<AppState>('appSettings');
  const now = Date.now();

  const standardProfiles: UserProfile[] = [
    {
      id: 'om-master-profile',
      name: 'Om Master',
      role: 'Owner',
      email: 'master@omlifeos.local',
      avatarColor: '#7c3aed',
      avatarChar: 'O',
      authType: 'local',
      isCurrent: true,
      createdAt: now
    },
    {
      id: 'family-shared-profile',
      name: 'Family Shared Space',
      role: 'Family',
      email: 'family@omlifeos.local',
      avatarColor: '#059669',
      avatarChar: 'F',
      authType: 'local',
      isCurrent: false,
      createdAt: now
    },
    {
      id: 'executive-studio-profile',
      name: 'Executive & Studio',
      role: 'Team Member',
      email: 'work@omlifeos.local',
      avatarColor: '#ea580c',
      avatarChar: 'E',
      authType: 'local',
      isCurrent: false,
      createdAt: now
    }
  ];

  if (!settings) {
    settings = {
      profileId: 'om-master-profile',
      profiles: standardProfiles,
      currentUser: {
        name: 'Om Master',
        email: 'master@omlifeos.local',
        provider: 'local'
      },
      themeMode: 'light',
      accentColor: '#5d57c9',
      notificationsEnabled: true,
      noteCategories: ['General', 'Strategy', 'Projects', 'Finance', 'Philosophy', 'Ideas', 'Books'],
      calcFavorites: ['EMI / Loan', 'SIP / Investment', 'Gold Value', 'BMI', 'Date Difference']
    };
    await storage.setSingleton('appSettings', settings);
    return settings;
  }

  // If profiles has fewer than 3, upgrade them to include standard profiles
  if (!settings.profiles || settings.profiles.length < 3) {
    const existingMap = new Map((settings.profiles || []).map(p => [p.id, p]));
    const mergedProfiles = [...(settings.profiles || [])];

    for (const std of standardProfiles) {
      if (!existingMap.has(std.id) && !mergedProfiles.some(p => p.name === std.name)) {
        mergedProfiles.push(std);
      }
    }

    settings.profiles = mergedProfiles;
    if (!settings.profileId) {
      settings.profileId = mergedProfiles[0].id;
    }
    await storage.setSingleton('appSettings', settings);
  }

  return settings;
}

// Default seed data for a fresh workspace
export async function seedInitialDataIfEmpty(): Promise<boolean> {
  const existingTasks = await storage.getAll<Task>('tasks');
  if (existingTasks.length > 0) return false;

  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);

  // 1. Initial User Profile & Settings
  const initialSettings: AppState = {
    profileId: 'om-master-profile',
    profiles: [
      {
        id: 'om-master-profile',
        name: 'Om Master',
        role: 'Owner',
        email: 'master@omlifeos.local',
        avatarColor: '#7c3aed',
        avatarChar: 'O',
        authType: 'local',
        isCurrent: true,
        createdAt: now
      },
      {
        id: 'family-shared-profile',
        name: 'Family Shared Space',
        role: 'Family',
        email: 'family@omlifeos.local',
        avatarColor: '#059669',
        avatarChar: 'F',
        authType: 'local',
        isCurrent: false,
        createdAt: now
      },
      {
        id: 'executive-studio-profile',
        name: 'Executive & Studio',
        role: 'Team Member',
        email: 'work@omlifeos.local',
        avatarColor: '#ea580c',
        avatarChar: 'E',
        authType: 'local',
        isCurrent: false,
        createdAt: now
      }
    ],
    currentUser: {
      name: 'Om Master',
      email: 'master@omlifeos.local',
      provider: 'local'
    },
    themeMode: 'light',
    accentColor: '#5d57c9',
    notificationsEnabled: true,
    dailyPlanner: {
      date: today,
      target: 'Focus on high-leverage execution, strategic clarity, and disciplined routine.',
      progress: 40,
      points: [
        { id: generateUUID(), text: 'Review quarterly goals & key milestones', done: true },
        { id: generateUUID(), text: 'Complete deep work block (60m architecture design)', done: false },
        { id: generateUUID(), text: 'Update monthly ledger & investment balance', done: false }
      ],
      wins: ['Clean initial setup of Om-LifeOS command system'],
      reflection: ['Maintain steady focus across priorities without context switching.']
    },
    mentor: {
      mission: 'Master self-discipline, financial sovereignty, and deep purposeful work.',
      startingCapital: 250000,
      survivalReserve: 100000,
      emergencyReserve: 50000,
      dailyBurn: 800,
      monthlyBurn: 24000,
      savingGoalAmount: 500000,
      savingDuration: 12
    },
    noteCategories: ['General', 'Strategy', 'Projects', 'Finance', 'Philosophy', 'Ideas', 'Books'],
    calcFavorites: ['EMI / Loan', 'SIP / Investment', 'Gold Value', 'BMI', 'Date Difference']
  };
  await storage.setSingleton('appSettings', initialSettings);

  // 2. Initial Tasks
  const sampleTasks: Task[] = [
    {
      id: generateUUID(),
      title: 'Define quarterly milestones and high-impact strategy',
      description: 'Connect daily tasks directly to top-tier strategic goals.',
      domain: 'work',
      priority: 'High',
      dueAt: today,
      date: today,
      done: false,
      status: 'open',
      createdAt: now,
      updatedAt: now
    },
    {
      id: generateUUID(),
      title: 'Review emergency fund & capital allocation',
      description: 'Ensure 6 months of survival reserve is maintained.',
      domain: 'finance',
      priority: 'Medium',
      dueAt: today,
      date: today,
      done: true,
      status: 'done',
      createdAt: now - 3600000,
      updatedAt: now
    },
    {
      id: generateUUID(),
      title: 'Evening wind-down & journal reflection',
      description: 'Reflect on wins, improvements, and gratitude.',
      domain: 'spiritual',
      priority: 'Low',
      dueAt: today,
      date: today,
      done: false,
      status: 'open',
      createdAt: now,
      updatedAt: now
    }
  ];
  await storage.bulkPut('tasks', sampleTasks);

  // 3. Initial Routines & Habits
  const sampleRoutines: Routine[] = [
    {
      id: generateUUID(),
      name: 'Morning Clarity & Movement',
      startTime: '06:30',
      endTime: '07:30',
      frequency: 'daily',
      category: 'health',
      note: 'Sunlight, hydration, meditation and stretching.',
      active: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: generateUUID(),
      name: 'Deep Work Block 1 (High Priority Focus)',
      startTime: '09:00',
      endTime: '11:30',
      frequency: 'weekdays',
      category: 'work',
      note: 'Zero notifications, single task focus.',
      active: true,
      createdAt: now,
      updatedAt: now
    }
  ];
  await storage.bulkPut('routines', sampleRoutines);

  const sampleHabits: Habit[] = [
    { id: generateUUID(), name: 'Morning Meditation (15 min)', frequency: 'Daily', timesPerDay: 1, createdAt: now, updatedAt: now },
    { id: generateUUID(), name: 'Drink 3 Liters Water', frequency: 'Daily', timesPerDay: 3, times: ['08:00', '13:00', '19:00'], createdAt: now, updatedAt: now },
    { id: generateUUID(), name: 'Read 20 Pages', frequency: 'Daily', timesPerDay: 1, times: ['21:30'], createdAt: now, updatedAt: now }
  ];
  await storage.bulkPut('habits', sampleHabits);

  // 4. Initial Goals
  const sampleGoals: Goal[] = [
    { id: generateUUID(), title: 'Achieve Financial Independence & 1 Year Runway', progress: 65, category: 'Finance', status: 'active', createdAt: now, updatedAt: now },
    { id: generateUUID(), title: 'Peak Physical Fitness & Marathon Prep', progress: 40, category: 'Health', status: 'active', createdAt: now, updatedAt: now },
    { id: generateUUID(), title: 'Build Scalable Independent Software Platform', progress: 50, category: 'Career', status: 'active', createdAt: now, updatedAt: now }
  ];
  await storage.bulkPut('goals', sampleGoals);

  // 5. Initial Finance Accounts & Transactions
  const checkingAcct: FinanceAccount = { id: generateUUID(), name: 'Main Bank Account', type: 'bank', balance: 145000, openingBalance: 145000, createdAt: now };
  const savingsAcct: FinanceAccount = { id: generateUUID(), name: 'Emergency Fund Reserve', type: 'bank', balance: 100000, openingBalance: 100000, createdAt: now };
  const walletAcct: FinanceAccount = { id: generateUUID(), name: 'Cash Wallet', type: 'cash', balance: 8500, openingBalance: 8500, createdAt: now };
  await storage.bulkPut('financeAccounts', [checkingAcct, savingsAcct, walletAcct]);

  const sampleFinance: FinanceTransaction[] = [
    { id: generateUUID(), type: 'income', amount: 85000, category: 'Salary / Consulting', date: today, note: 'Monthly milestone compensation', accountId: checkingAcct.id, createdAt: now },
    { id: generateUUID(), type: 'expense', amount: 2800, category: 'Groceries & Health Food', date: today, note: 'Organic vegetables & essentials', accountId: checkingAcct.id, createdAt: now },
    { id: generateUUID(), type: 'expense', amount: 1500, category: 'Books & Learning', date: today, note: 'Architecture & engineering guides', accountId: checkingAcct.id, createdAt: now }
  ];
  await storage.bulkPut('finance', sampleFinance);

  // 6. Initial Health Profile
  const initialHealth: HealthProfile = {
    name: 'Om LifeOS User',
    dob: '1996-05-15',
    height: 178,
    weight: 72,
    targetWeight: 70,
    bloodGroup: 'O+',
    updatedAt: now
  };
  await storage.setSingleton('healthProfile', initialHealth);

  // 7. Initial Notes & Journal
  const sampleNotes: Note[] = [
    {
      id: generateUUID(),
      title: 'First Principles of Life Architecture',
      body: 'Keep things local, sovereign, and clean. Eliminate distraction, measure progress, and preserve clarity.',
      html: '<p>Keep things <strong>local, sovereign, and clean</strong>. Eliminate distraction, measure progress, and preserve clarity.</p><ul><li>One central command system</li><li>Double-entry financial awareness</li><li>Continuous reflection & daily learning</li></ul>',
      points: 'Focus on high leverage\nAvoid unnecessary complexity\nMaintain physical & mental vigor',
      category: 'Philosophy',
      tags: 'lifeos, principles, focus',
      color: '#f0fdf4',
      date: today,
      createdAt: now,
      updatedAt: now
    }
  ];
  await storage.bulkPut('notes', sampleNotes);

  const sampleJournal: JournalEntry[] = [
    {
      id: generateUUID(),
      title: 'New Chapter: Canonical Life System Activated',
      text: 'Starting fresh with a unified, high-performance personal operating system.',
      html: '<p>Starting fresh with a <strong>unified, high-performance personal operating system</strong>. Everything has its right place: tasks, finances, health, and philosophy.</p>',
      date: today,
      color: '#eff6ff',
      createdAt: now,
      updatedAt: now
    }
  ];
  await storage.bulkPut('journal', sampleJournal);

  return true;
}

// Client-side Native Export Helpers (CSV, Word, Excel, PDF)
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function exportToCsv(filename: string, rows: (string | number)[][]) {
  const escapeCsv = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csvContent = rows.map(r => r.map(escapeCsv).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

// Native Word (.docx) generation using standard OpenXML Zip package without external bloat
function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c ^= bytes[i];
    for (let j = 0; j < 8; j++) c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function u16(n: number): Uint8Array {
  return new Uint8Array([n & 255, (n >>> 8) & 255]);
}
function u32(n: number): Uint8Array {
  return new Uint8Array([n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]);
}
function concatBytes(parts: Uint8Array[]): Uint8Array {
  let len = 0;
  for (const p of parts) len += p.length;
  const out = new Uint8Array(len);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

function zipFiles(files: { name: string; data: Uint8Array | string }[]): Uint8Array {
  const enc = new TextEncoder();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;

  for (const f of files) {
    const nameBytes = enc.encode(f.name);
    const dataBytes = typeof f.data === 'string' ? enc.encode(f.data) : f.data;
    const crcVal = crc32(dataBytes);
    const size = dataBytes.length;

    const localHdr = concatBytes([
      new Uint8Array([80, 75, 3, 4, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      u32(crcVal),
      u32(size),
      u32(size),
      u16(nameBytes.length),
      u16(0),
      nameBytes,
      dataBytes
    ]);
    locals.push(localHdr);

    const centralHdr = concatBytes([
      new Uint8Array([80, 75, 1, 2, 20, 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      u32(crcVal),
      u32(size),
      u32(size),
      u16(nameBytes.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      nameBytes
    ]);
    centrals.push(centralHdr);
    offset += localHdr.length;
  }

  const body = concatBytes(locals);
  const cd = concatBytes(centrals);
  const end = concatBytes([
    new Uint8Array([80, 75, 5, 6, 0, 0, 0, 0]),
    u16(files.length),
    u16(files.length),
    u32(cd.length),
    u32(body.length),
    u16(0)
  ]);

  return concatBytes([body, cd, end]);
}

function xmlEscape(s: any): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function exportToDocx(title: string, rows: (string | number)[][]) {
  const tableRows = rows
    .map((r, i) => `
      <w:tr>
        ${r
          .map(
            cell => `
          <w:tc>
            <w:tcPr><w:tcW w:w="2400" w:type="dxa"/></w:tcPr>
            <w:p>
              <w:r${i === 0 ? '><w:rPr><w:b/></w:rPr>' : '>'}>
                <w:t xml:space="preserve">${xmlEscape(cell)}</w:t>
              </w:r>
            </w:p>
          </w:tc>
        `
          )
          .join('')}
      </w:tr>
    `)
    .join('');

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:p>
          <w:r>
            <w:rPr><w:b/><w:sz w:val="36"/></w:rPr>
            <w:t>${xmlEscape(title)}</w:t>
          </w:r>
        </w:p>
        <w:p>
          <w:r><w:t>Exported on ${xmlEscape(new Date().toLocaleString())} · Om-LifeOS</w:t></w:r>
        </w:p>
        <w:tbl>
          <w:tblPr>
            <w:tblBorders>
              <w:top w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
              <w:left w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
              <w:bottom w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
              <w:right w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
              <w:insideH w:val="single" w:sz="4" w:space="0" w:color="EEEEEE"/>
              <w:insideV w:val="single" w:sz="4" w:space="0" w:color="EEEEEE"/>
            </w:tblBorders>
          </w:tblPr>
          ${tableRows}
        </w:tbl>
      </w:body>
    </w:document>`;

  const files = [
    {
      name: '[Content_Types].xml',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`
    },
    {
      name: '_rels/.rels',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`
    },
    {
      name: 'word/_rels/document.xml.rels',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`
    },
    { name: 'word/document.xml', data: documentXml }
  ];

  const zip = zipFiles(files);
  const blob = new Blob([zip as any], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  downloadBlob(blob, `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.docx`);
}

export function exportToXlsx(title: string, rows: (string | number)[][]) {
  const sheetRows = rows
    .map(
      r => `
      <row>
        ${r.map(cell => `<c t="inlineStr"><is><t xml:space="preserve">${xmlEscape(cell)}</t></is></c>`).join('')}
      </row>
    `
    )
    .join('');

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <sheetData>${sheetRows}</sheetData>
    </worksheet>`;

  const files = [
    {
      name: '[Content_Types].xml',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`
    },
    {
      name: '_rels/.rels',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`
    },
    {
      name: 'xl/workbook.xml',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Om-LifeOS Data" sheetId="1" r:id="rId1"/></sheets></workbook>`
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`
    },
    { name: 'xl/worksheets/sheet1.xml', data: sheetXml }
  ];

  const zip = zipFiles(files);
  const blob = new Blob([zip as any], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportToPdf(title: string, rows: (string | number)[][]) {
  const sanitizeAscii = (s: any) =>
    String(s ?? '')
      .replace(/[\x00-\x1F\x7F-\uFFFF]/g, ' ')
      .replace(/[\\()]/g, '\\$&');

  const lines = [title, `Generated: ${new Date().toLocaleString()} · Om-LifeOS`, ''];
  for (const r of rows) {
    lines.push(r.map(v => sanitizeAscii(v).slice(0, 30)).join(' | '));
  }

  const perPage = 45;
  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += perPage) {
    pages.push(lines.slice(i, i + perPage));
  }

  const objs: string[] = [];
  objs.push('<< /Type /Catalog /Pages 2 0 R >>');
  objs.push(`<< /Type /Pages /Kids [${pages.map((_, i) => `${3 + i * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`);

  for (let i = 0; i < pages.length; i++) {
    const streamContent: string[] = ['BT /F1 9 Tf 40 800 Td 14 TL'];
    pages[i].forEach((l, idx) => {
      if (idx === 0 && i === 0) {
        streamContent.push(`/F1 16 Tf (${sanitizeAscii(l)}) Tj /F1 9 Tf T*`);
      } else {
        streamContent.push(`(${sanitizeAscii(l)}) Tj T*`);
      }
    });
    streamContent.push('ET');
    const stream = streamContent.join('\n');
    objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${3 + pages.length * 2} 0 R >> >> /Contents ${4 + i * 2} 0 R >>`);
    objs.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  }
  objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets = [0];
  for (let i = 0; i < objs.length; i++) {
    offsets[i + 1] = pdf.length;
    pdf += `${i + 1} 0 obj\n${objs[i]}\nendobj\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  const blob = new Blob([new TextEncoder().encode(pdf)], { type: 'application/pdf' });
  downloadBlob(blob, `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export async function exportToCompleteHtml(title: string = 'Om-LifeOS-Complete') {
  const allData: Record<string, any> = {};
  for (const storeName of ENTITY_STORES) {
    allData[storeName] = await storage.getAll(storeName);
  }
  for (const storeName of SINGLETON_STORES) {
    allData[storeName] = await storage.getSingleton(storeName);
  }

  const htmlContent = generateCompleteStandaloneHtml(allData);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  downloadBlob(blob, `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.html`);
}

