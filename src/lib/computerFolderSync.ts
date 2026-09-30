import JSZip from 'jszip';
import { storage, ENTITY_STORES, SINGLETON_STORES } from './storage';
import { generateCompleteStandaloneHtml } from './exportHtml';

export interface FolderSyncMeta {
  isConnected: boolean;
  folderName: string | null;
  connectedAt: number | null;
  lastBackupAt: number | null;
  lastFileCount: number | null;
  autoSync: boolean;
  hasPermission: boolean;
}

const DB_NAME = 'om-lifeos-folder-sync-v1';
const STORE_NAME = 'folder_handles';
const HANDLE_KEY = 'primary_backup_directory';

// Open IndexedDB dedicated to storing FileSystemDirectoryHandle (which is structured-cloneable)
function openHandleDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveHandleRecord(record: {
  id: string;
  handle: FileSystemDirectoryHandle;
  folderName: string;
  connectedAt: number;
  lastBackupAt?: number;
  lastFileCount?: number;
  autoSync?: boolean;
}): Promise<void> {
  const db = await openHandleDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function getHandleRecord(): Promise<{
  id: string;
  handle: FileSystemDirectoryHandle;
  folderName: string;
  connectedAt: number;
  lastBackupAt?: number;
  lastFileCount?: number;
  autoSync?: boolean;
} | null> {
  try {
    const db = await openHandleDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(HANDLE_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function deleteHandleRecord(): Promise<void> {
  try {
    const db = await openHandleDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(HANDLE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {}
}

/** Check if current browser supports Native File System Access API */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/** Query the currently connected folder info */
export async function getConnectedFolderInfo(): Promise<FolderSyncMeta> {
  const record = await getHandleRecord();
  if (!record || !record.handle) {
    return {
      isConnected: false,
      folderName: null,
      connectedAt: null,
      lastBackupAt: null,
      lastFileCount: null,
      autoSync: false,
      hasPermission: false
    };
  }

  let hasPerm = false;
  try {
    if (typeof (record.handle as any).queryPermission === 'function') {
      const state = await (record.handle as any).queryPermission({ mode: 'readwrite' });
      hasPerm = state === 'granted';
    }
  } catch {}

  return {
    isConnected: true,
    folderName: record.folderName || record.handle.name || 'Selected Folder',
    connectedAt: record.connectedAt || null,
    lastBackupAt: record.lastBackupAt || null,
    lastFileCount: record.lastFileCount || null,
    autoSync: Boolean(record.autoSync),
    hasPermission: hasPerm
  };
}

/**
 * Connect Computer Folder:
 * Prompts user with native folder dialog (First time selection).
 * Stores the directory handle in IndexedDB so subsequent backups don't ask again!
 */
export async function connectComputerFolder(): Promise<{
  success: boolean;
  folderName: string;
  error?: string;
}> {
  if (!isFileSystemAccessSupported()) {
    return {
      success: false,
      folderName: '',
      error: 'Your current browser does not support the File System Access API. Please use Google Chrome, Microsoft Edge, Opera, or Brave on desktop.'
    };
  }

  try {
    const handle: FileSystemDirectoryHandle = await (window as any).showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'documents'
    });

    if (!handle) {
      return { success: false, folderName: '', error: 'No folder was selected.' };
    }

    // Verify / request readwrite permission
    if (typeof (handle as any).requestPermission === 'function') {
      const perm = await (handle as any).requestPermission({ mode: 'readwrite' });
      if (perm !== 'granted') {
        return { success: false, folderName: '', error: 'Write permission was not granted to the folder.' };
      }
    }

    const folderName = handle.name || 'Local Computer Backup Folder';
    await saveHandleRecord({
      id: HANDLE_KEY,
      handle,
      folderName,
      connectedAt: Date.now(),
      autoSync: true
    });

    return {
      success: true,
      folderName
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { success: false, folderName: '', error: 'Folder selection was cancelled.' };
    }
    return { success: false, folderName: '', error: err.message || 'Failed to select folder.' };
  }
}

/** Disconnect the current computer folder */
export async function disconnectComputerFolder(): Promise<void> {
  await deleteHandleRecord();
}

/** Toggle auto-sync setting */
export async function toggleFolderAutoSync(enabled: boolean): Promise<void> {
  const record = await getHandleRecord();
  if (record) {
    record.autoSync = enabled;
    await saveHandleRecord(record);
  }
}

/** Helper to write file into a FileSystemDirectoryHandle */
async function writeTextFile(
  dirHandle: FileSystemDirectoryHandle,
  fileName: string,
  content: string
): Promise<void> {
  const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
  const writable = await (fileHandle as any).createWritable();
  await writable.write(content);
  await writable.close();
}

/** Build full structured dataset dictionary from storage */
export async function gatherFullLifeOSDataset() {
  const allData: Record<string, any> = {};

  for (const storeName of ENTITY_STORES) {
    allData[storeName] = await storage.getAll(storeName);
  }
  for (const storeName of SINGLETON_STORES) {
    allData[storeName] = await storage.getSingleton(storeName);
  }

  return allData;
}

/**
 * Permanently remove ALL subfolders inside the computer directory handle.
 * Leaves ONLY the main root folder.
 */
export async function removeAllSubfoldersFromDirectory(
  dirHandle: FileSystemDirectoryHandle,
  onProgress?: (msg: string) => void
): Promise<{ removedCount: number; removedNames: string[] }> {
  const removedNames: string[] = [];

  // 1. Explicit list of all known domain subfolders previously used
  const knownOldSubfolders = [
    '00_Master_System_Backup',
    '01_Tasks_and_Planner',
    '02_Finance_and_Ledger',
    '03_Notes_and_Notebooks',
    '04_Goals_and_Strategy',
    '05_Health_and_Vitals',
    '06_Journal_and_Mind',
    '07_Routines_and_Habits',
    '08_Work_and_Learning',
    '09_People_and_Network',
    '10_Spiritual_and_Principles',
    '11_Things_and_Vault'
  ];

  for (const name of knownOldSubfolders) {
    try {
      await (dirHandle as any).removeEntry(name, { recursive: true });
      if (!removedNames.includes(name)) {
        removedNames.push(name);
        onProgress?.(`Permanently deleted subfolder: ${name}`);
      }
    } catch {
      // Not present or already removed
    }
  }

  // 2. Dynamically scan all directory entries and recursively delete any remaining subfolders
  try {
    if (typeof (dirHandle as any).values === 'function') {
      for await (const entry of (dirHandle as any).values()) {
        if (entry.kind === 'directory') {
          try {
            await (dirHandle as any).removeEntry(entry.name, { recursive: true });
            if (!removedNames.includes(entry.name)) {
              removedNames.push(entry.name);
              onProgress?.(`Permanently deleted subfolder: ${entry.name}`);
            }
          } catch (e) {
            console.warn(`Could not remove subfolder ${entry.name}:`, e);
          }
        }
      }
    } else if (typeof (dirHandle as any).entries === 'function') {
      for await (const [name, entry] of (dirHandle as any).entries()) {
        if (entry.kind === 'directory') {
          try {
            await (dirHandle as any).removeEntry(name, { recursive: true });
            if (!removedNames.includes(name)) {
              removedNames.push(name);
              onProgress?.(`Permanently deleted subfolder: ${name}`);
            }
          } catch {}
        }
      }
    }
  } catch (err) {
    console.warn('Dynamic folder scan error during subfolder cleanup:', err);
  }

  return { removedCount: removedNames.length, removedNames };
}

/**
 * Public trigger to permanently remove all subfolders from the currently connected computer folder.
 */
export async function cleanAllSubfoldersFromConnectedFolder(
  onProgress?: (msg: string) => void
): Promise<{ success: boolean; removedCount: number; removedNames: string[]; error?: string }> {
  const record = await getHandleRecord();
  if (!record || !record.handle) {
    return { success: false, removedCount: 0, removedNames: [], error: 'No computer folder is currently connected.' };
  }

  try {
    const dirHandle = record.handle;
    if (typeof (dirHandle as any).queryPermission === 'function') {
      const state = await (dirHandle as any).queryPermission({ mode: 'readwrite' });
      if (state !== 'granted') {
        const reqState = await (dirHandle as any).requestPermission({ mode: 'readwrite' });
        if (reqState !== 'granted') {
          return { success: false, removedCount: 0, removedNames: [], error: 'Write permission not granted.' };
        }
      }
    }

    const res = await removeAllSubfoldersFromDirectory(dirHandle, onProgress);
    return { success: true, removedCount: res.removedCount, removedNames: res.removedNames };
  } catch (err: any) {
    return { success: false, removedCount: 0, removedNames: [], error: err.message };
  }
}

/**
 * Sync & Save All Files DIRECTLY to the Connected Computer Folder (Main Folder ONLY, NO subfolders).
 * Permanently removes any subfolders if they exist.
 */
export async function syncAllFilesToComputerFolder(
  onProgress?: (msg: string, current: number, total: number) => void
): Promise<{
  success: boolean;
  fileCount: number;
  folderName: string;
  removedSubfoldersCount: number;
  error?: string;
}> {
  let record = await getHandleRecord();

  // If no folder selected yet, prompt user first time
  if (!record || !record.handle) {
    onProgress?.('Prompting to select computer folder...', 0, 100);
    const conn = await connectComputerFolder();
    if (!conn.success) {
      return { success: false, fileCount: 0, folderName: '', removedSubfoldersCount: 0, error: conn.error };
    }
    record = await getHandleRecord();
    if (!record || !record.handle) {
      return { success: false, fileCount: 0, folderName: '', removedSubfoldersCount: 0, error: 'Folder connection failed.' };
    }
  }

  const dirHandle = record.handle;

  // Verify write permission
  try {
    if (typeof (dirHandle as any).queryPermission === 'function') {
      const state = await (dirHandle as any).queryPermission({ mode: 'readwrite' });
      if (state !== 'granted') {
        const reqState = await (dirHandle as any).requestPermission({ mode: 'readwrite' });
        if (reqState !== 'granted') {
          return {
            success: false,
            fileCount: 0,
            folderName: record.folderName,
            removedSubfoldersCount: 0,
            error: 'Write permission to folder was declined by user.'
          };
        }
      }
    }
  } catch (err: any) {
    return {
      success: false,
      fileCount: 0,
      folderName: record.folderName,
      removedSubfoldersCount: 0,
      error: `Permission error: ${err.message}`
    };
  }

  // 1. Permanently remove all subfolders from the computer directory
  onProgress?.('Permanently removing all subfolders from computer folder...', 5, 100);
  const cleanup = await removeAllSubfoldersFromDirectory(dirHandle, (msg) => onProgress?.(msg, 10, 100));

  onProgress?.('Reading sovereign database records...', 15, 100);
  const data = await gatherFullLifeOSDataset();
  const timestamp = new Date().toISOString();
  const dateStr = timestamp.slice(0, 10);

  let totalFilesWritten = 0;

  try {
    // ----------------------------------------------------
    // Root Main Folder Files (Flat structure, NO subfolders)
    // ----------------------------------------------------
    onProgress?.('Writing master backups directly to main folder...', 20, 100);

    // 1. Full Master System JSON Backup
    const masterSnapshot = {
      app: 'Om-LifeOS',
      version: '4.8.0',
      exportedAt: timestamp,
      deviceId: storage.deviceId,
      totalStores: Object.keys(data).length,
      data
    };
    await writeTextFile(dirHandle, 'om_lifeos_master_backup.json', JSON.stringify(masterSnapshot, null, 2));
    totalFilesWritten++;

    // 2. Standalone Interactive Offline Dashboard HTML
    const standaloneHtml = generateCompleteStandaloneHtml(data);
    await writeTextFile(dirHandle, 'index.html', standaloneHtml);
    await writeTextFile(dirHandle, 'om_lifeos_offline_dashboard.html', standaloneHtml);
    totalFilesWritten += 2;

    // 3. Manifest JSON
    const manifest = {
      backupTimestamp: timestamp,
      structure: 'Flat main folder only (all subfolders permanently removed)',
      deviceId: storage.deviceId,
      recordCounts: {
        tasks: (data.tasks || []).length,
        notes: (data.notes || []).length,
        transactions: (data.finance || []).length,
        accounts: (data.financeAccounts || []).length,
        loans: (data.loans || []).length,
        investments: (data.investments || []).length,
        goals: (data.goals || []).length,
        habits: (data.habits || []).length,
        journal: (data.journal || []).length,
        healthMeasurements: (data.healthMeasurements || []).length,
        things: (data.things || []).length,
        people: (data.people || []).length
      }
    };
    await writeTextFile(dirHandle, 'backup_manifest.json', JSON.stringify(manifest, null, 2));
    totalFilesWritten++;

    // 4. README documentation
    const readme = `Om-LifeOS Sovereign Computer Folder Backup
=========================================
Generated: ${timestamp}
Device ID: ${storage.deviceId}
Mode: Flat Main Folder Only (Zero Subfolders)

This folder contains your entire sovereign personal operating system backup.
All files are saved directly in this main folder without any subfolders.

HOW TO USE THESE FILES:
1. Complete Offline Dashboard: Double-click 'index.html' or 'om_lifeos_offline_dashboard.html'
   in ANY desktop web browser to view, search, and navigate your data offline.
2. Complete System Restore: Use 'om_lifeos_master_backup.json' in
   Om-LifeOS -> Settings -> Restore Backup to instantly restore everything.
3. Human-Readable Summaries:
   - 'tasks_summary.md' (Complete checklist of open & completed tasks)
   - 'financial_overview.md' (Account balances, liquid cash & loan audit)
   - 'notes_catalog.md' (All your notes with content & tags)
   - 'goals_overview.md' (Strategic goals & progress)
   - 'journal_reflections.md' (Daily reflections & diary history)
4. Domain Datasets:
   - 'tasks.json'
   - 'finance_transactions.json', 'finance_accounts.json', 'loans.json', 'investments.json'
   - 'all_notes.json'
   - 'goals.json', 'strategies.json', 'milestones.json', 'kpis.json', 'missions.json'
   - 'health_measurements.json', 'sleep_records.json', 'water_records.json', 'nutrition_records.json'
   - 'journal_entries.json'
   - 'routines.json', 'habits.json', 'habit_logs.json'
   - 'work_projects.json', 'skills.json', 'learning_items.json', 'meetings.json'
   - 'people.json', 'interactions.json'
   - 'values.json', 'spiritual_practices.json', 'commitments.json'
   - 'things_inventory.json', 'documents.json', 'warranties.json', 'receipts.json'
`;
    await writeTextFile(dirHandle, 'README.txt', readme);
    totalFilesWritten++;

    // ----------------------------------------------------
    // Domain Files: Tasks & Planner
    // ----------------------------------------------------
    onProgress?.('Writing Tasks and Planner files...', 35, 100);
    const tasksList = data.tasks || [];
    await writeTextFile(dirHandle, 'tasks.json', JSON.stringify(tasksList, null, 2));
    totalFilesWritten++;

    let tasksMd = `# Tasks & Planner Roster\nDate: ${dateStr}\n\n`;
    tasksMd += `## Open Tasks (${tasksList.filter((t: any) => !t.done).length})\n`;
    tasksList.filter((t: any) => !t.done).forEach((t: any) => {
      tasksMd += `- [ ] **[${t.priority || 'Medium'}]** ${t.title} *(Domain: ${t.domain || 'general'} | Due: ${t.dueAt || 'none'})*\n`;
      if (t.description) tasksMd += `  > ${t.description}\n`;
    });
    tasksMd += `\n## Completed Tasks (${tasksList.filter((t: any) => t.done).length})\n`;
    tasksList.filter((t: any) => t.done).forEach((t: any) => {
      tasksMd += `- [x] ${t.title} *(Completed)*\n`;
    });
    await writeTextFile(dirHandle, 'tasks_summary.md', tasksMd);
    totalFilesWritten++;

    const dailyPlanner = data.appSettings?.dailyPlanner;
    if (dailyPlanner) {
      await writeTextFile(dirHandle, 'daily_command_targets.json', JSON.stringify(dailyPlanner, null, 2));
      totalFilesWritten++;
    }

    // ----------------------------------------------------
    // Domain Files: Finance & Ledger
    // ----------------------------------------------------
    onProgress?.('Writing Finance and Ledger files...', 48, 100);
    await writeTextFile(dirHandle, 'finance_accounts.json', JSON.stringify(data.financeAccounts || [], null, 2));
    await writeTextFile(dirHandle, 'finance_transactions.json', JSON.stringify(data.finance || [], null, 2));
    await writeTextFile(dirHandle, 'loans.json', JSON.stringify(data.loans || [], null, 2));
    await writeTextFile(dirHandle, 'loan_payments.json', JSON.stringify(data.loanPayments || [], null, 2));
    await writeTextFile(dirHandle, 'investments.json', JSON.stringify(data.investments || [], null, 2));
    await writeTextFile(dirHandle, 'savings_plans.json', JSON.stringify(data.savingsPlans || [], null, 2));
    await writeTextFile(dirHandle, 'assets.json', JSON.stringify(data.assets || [], null, 2));
    await writeTextFile(dirHandle, 'liabilities.json', JSON.stringify(data.liabilities || [], null, 2));
    await writeTextFile(dirHandle, 'financial_goals.json', JSON.stringify(data.financialGoals || [], null, 2));
    totalFilesWritten += 9;

    const accounts = data.financeAccounts || [];
    const liquid = accounts.reduce((sum: number, a: any) => sum + (Number(a.balance) || 0), 0);
    const loans = data.loans || [];
    const debt = loans.reduce((sum: number, l: any) => sum + (Number(l.outstanding) || 0), 0);
    let finMd = `# Financial Overview & Balance Sheet\nDate: ${dateStr}\n\n`;
    finMd += `## Summary Metrics\n`;
    finMd += `- **Total Liquid Cash:** ₹${liquid.toLocaleString('en-IN')}\n`;
    finMd += `- **Total Loan Debt:** ₹${debt.toLocaleString('en-IN')}\n\n`;
    finMd += `## Bank & Cash Accounts\n`;
    accounts.forEach((a: any) => {
      finMd += `- **${a.name}:** ₹${Number(a.balance).toLocaleString('en-IN')} *(${a.type})*\n`;
    });
    await writeTextFile(dirHandle, 'financial_overview.md', finMd);
    totalFilesWritten++;

    // ----------------------------------------------------
    // Domain Files: Notes & Notebooks
    // ----------------------------------------------------
    onProgress?.('Writing Notes catalog...', 60, 100);
    const notesList = data.notes || [];
    await writeTextFile(dirHandle, 'all_notes.json', JSON.stringify(notesList, null, 2));
    totalFilesWritten++;

    let notesCatalogMd = `# Notes Catalog\nGenerated: ${dateStr}\nTotal Notes: ${notesList.length}\n\n`;
    notesList.forEach((n: any) => {
      notesCatalogMd += `## ${n.title || 'Untitled Note'}\n`;
      notesCatalogMd += `*Notebook: ${n.category || 'General'} | Date: ${n.date || 'none'} | Tags: ${n.tags || 'none'}*\n\n`;
      notesCatalogMd += `${n.body || ''}\n\n`;
      if (n.points) {
        notesCatalogMd += `**Key Points:**\n${n.points}\n\n`;
      }
      notesCatalogMd += `---\n\n`;
    });
    await writeTextFile(dirHandle, 'notes_catalog.md', notesCatalogMd);
    totalFilesWritten++;

    // ----------------------------------------------------
    // Domain Files: Goals & Strategy
    // ----------------------------------------------------
    onProgress?.('Writing Goals and Strategy files...', 70, 100);
    await writeTextFile(dirHandle, 'goals.json', JSON.stringify(data.goals || [], null, 2));
    await writeTextFile(dirHandle, 'strategies.json', JSON.stringify(data.strategies || [], null, 2));
    await writeTextFile(dirHandle, 'milestones.json', JSON.stringify(data.milestones || [], null, 2));
    await writeTextFile(dirHandle, 'kpis.json', JSON.stringify(data.kpis || [], null, 2));
    await writeTextFile(dirHandle, 'missions.json', JSON.stringify(data.missions || [], null, 2));
    totalFilesWritten += 5;

    const goalsList = data.goals || [];
    let goalsMd = `# Strategic Goals & Objectives\nDate: ${dateStr}\n\n`;
    goalsList.forEach((g: any) => {
      goalsMd += `### ${g.title} (${g.progress || 0}% Complete)\n`;
      goalsMd += `- Category: ${g.category || 'General'}\n`;
      if (g.targetDate) goalsMd += `- Target Date: ${g.targetDate}\n`;
      goalsMd += `\n`;
    });
    await writeTextFile(dirHandle, 'goals_overview.md', goalsMd);
    totalFilesWritten++;

    // ----------------------------------------------------
    // Domain Files: Health & Vitals
    // ----------------------------------------------------
    onProgress?.('Writing Health and Vitals files...', 78, 100);
    await writeTextFile(dirHandle, 'health_measurements.json', JSON.stringify(data.healthMeasurements || [], null, 2));
    await writeTextFile(dirHandle, 'sleep_records.json', JSON.stringify(data.sleepRecords || [], null, 2));
    await writeTextFile(dirHandle, 'water_records.json', JSON.stringify(data.waterRecords || [], null, 2));
    await writeTextFile(dirHandle, 'nutrition_records.json', JSON.stringify(data.nutritionRecords || [], null, 2));
    await writeTextFile(dirHandle, 'health_appointments.json', JSON.stringify(data.healthAppointments || [], null, 2));
    await writeTextFile(dirHandle, 'health_notes.json', JSON.stringify(data.healthNotes || [], null, 2));
    totalFilesWritten += 6;

    // ----------------------------------------------------
    // Domain Files: Journal & Mind
    // ----------------------------------------------------
    onProgress?.('Writing Journal entries...', 85, 100);
    const journalList = data.journal || [];
    await writeTextFile(dirHandle, 'all_journal_entries.json', JSON.stringify(journalList, null, 2));
    totalFilesWritten++;

    let journalMd = `# Journal & Daily Reflections\nGenerated: ${dateStr}\nTotal Entries: ${journalList.length}\n\n`;
    journalList.forEach((j: any) => {
      journalMd += `## ${j.title || 'Reflection'} (${j.date || 'Undated'})\n`;
      if (j.mood) journalMd += `*Mood: ${j.mood} | Tags: ${j.tags || 'none'}*\n\n`;
      journalMd += `${j.body || j.content || ''}\n\n---\n\n`;
    });
    await writeTextFile(dirHandle, 'journal_reflections.md', journalMd);
    totalFilesWritten++;

    // ----------------------------------------------------
    // Domain Files: Routines, Habits, Work, People, Spiritual, Things
    // ----------------------------------------------------
    onProgress?.('Writing Routines, Habits, Work, People, and Vault files...', 92, 100);
    await writeTextFile(dirHandle, 'routines.json', JSON.stringify(data.routines || [], null, 2));
    await writeTextFile(dirHandle, 'habits.json', JSON.stringify(data.habits || [], null, 2));
    await writeTextFile(dirHandle, 'habit_logs.json', JSON.stringify(data.habitLogs || [], null, 2));

    await writeTextFile(dirHandle, 'work_projects.json', JSON.stringify(data.workProjects || [], null, 2));
    await writeTextFile(dirHandle, 'work_responsibilities.json', JSON.stringify(data.workResponsibilities || [], null, 2));
    await writeTextFile(dirHandle, 'learning_items.json', JSON.stringify(data.learningItems || [], null, 2));
    await writeTextFile(dirHandle, 'skills.json', JSON.stringify(data.skills || [], null, 2));
    await writeTextFile(dirHandle, 'courses.json', JSON.stringify(data.courses || [], null, 2));
    await writeTextFile(dirHandle, 'meetings.json', JSON.stringify(data.meetings || [], null, 2));

    await writeTextFile(dirHandle, 'people.json', JSON.stringify(data.people || [], null, 2));
    await writeTextFile(dirHandle, 'interactions.json', JSON.stringify(data.interactions || [], null, 2));

    await writeTextFile(dirHandle, 'values.json', JSON.stringify(data.values || [], null, 2));
    await writeTextFile(dirHandle, 'spiritual_practices.json', JSON.stringify(data.spiritualPractices || [], null, 2));
    await writeTextFile(dirHandle, 'commitments.json', JSON.stringify(data.commitments || [], null, 2));

    await writeTextFile(dirHandle, 'things_inventory.json', JSON.stringify(data.things || [], null, 2));
    await writeTextFile(dirHandle, 'documents.json', JSON.stringify(data.documents || [], null, 2));
    await writeTextFile(dirHandle, 'warranties.json', JSON.stringify(data.warranties || [], null, 2));
    await writeTextFile(dirHandle, 'receipts.json', JSON.stringify(data.receipts || [], null, 2));
    await writeTextFile(dirHandle, 'certificates.json', JSON.stringify(data.certificates || [], null, 2));
    await writeTextFile(dirHandle, 'important_records.json', JSON.stringify(data.importantRecords || [], null, 2));
    totalFilesWritten += 20;

    // Update metadata record with last backup stats
    record.lastBackupAt = Date.now();
    record.lastFileCount = totalFilesWritten;
    await saveHandleRecord(record);

    onProgress?.('✓ Complete! All files safely written directly in main folder (0 subfolders).', 100, 100);

    return {
      success: true,
      fileCount: totalFilesWritten,
      folderName: record.folderName,
      removedSubfoldersCount: cleanup.removedCount
    };
  } catch (err: any) {
    return {
      success: false,
      fileCount: totalFilesWritten,
      folderName: record.folderName,
      removedSubfoldersCount: cleanup.removedCount,
      error: `Failed writing files: ${err.message}`
    };
  }
}

/**
 * Universal Flat ZIP Generator (NO subfolders):
 * Generates all files flat directly inside the root of the ZIP archive.
 */
export async function exportAllFilesAsZip(
  onProgress?: (msg: string, current: number, total: number) => void
): Promise<Blob> {
  onProgress?.('Collecting data from sovereign database...', 10, 100);
  const data = await gatherFullLifeOSDataset();
  const timestamp = new Date().toISOString();
  const dateStr = timestamp.slice(0, 10);
  const zip = new JSZip();

  // Root Master Files
  const masterSnapshot = {
    app: 'Om-LifeOS',
    version: '4.8.0',
    exportedAt: timestamp,
    deviceId: storage.deviceId,
    data
  };
  zip.file('om_lifeos_master_backup.json', JSON.stringify(masterSnapshot, null, 2));

  const standaloneHtml = generateCompleteStandaloneHtml(data);
  zip.file('index.html', standaloneHtml);
  zip.file('om_lifeos_offline_dashboard.html', standaloneHtml);

  // Manifest & Readme
  const manifest = {
    backupTimestamp: timestamp,
    structure: 'Flat main folder archive (0 subfolders)',
    deviceId: storage.deviceId
  };
  zip.file('backup_manifest.json', JSON.stringify(manifest, null, 2));
  zip.file('README.txt', `Om-LifeOS Sovereign Backup (Flat Main Folder Archive)\nGenerated: ${timestamp}\nAll files are stored flat without subfolders.`);

  // Tasks
  const tasksList = data.tasks || [];
  zip.file('tasks.json', JSON.stringify(tasksList, null, 2));
  let tasksMd = `# Tasks & Planner Roster\nGenerated: ${dateStr}\n\n`;
  tasksList.filter((t: any) => !t.done).forEach((t: any) => {
    tasksMd += `- [ ] [${t.priority || 'Medium'}] ${t.title} (${t.domain || 'general'})\n`;
  });
  zip.file('tasks_summary.md', tasksMd);

  // Finance
  zip.file('finance_accounts.json', JSON.stringify(data.financeAccounts || [], null, 2));
  zip.file('finance_transactions.json', JSON.stringify(data.finance || [], null, 2));
  zip.file('loans.json', JSON.stringify(data.loans || [], null, 2));
  zip.file('investments.json', JSON.stringify(data.investments || [], null, 2));
  zip.file('savings_plans.json', JSON.stringify(data.savingsPlans || [], null, 2));
  zip.file('assets.json', JSON.stringify(data.assets || [], null, 2));
  zip.file('liabilities.json', JSON.stringify(data.liabilities || [], null, 2));

  // Notes
  const notesList = data.notes || [];
  zip.file('all_notes.json', JSON.stringify(notesList, null, 2));
  let notesCatalogMd = `# Notes Catalog\nGenerated: ${dateStr}\n\n`;
  notesList.forEach((n: any) => {
    notesCatalogMd += `## ${n.title || 'Untitled'}\n${n.body || ''}\n\n---\n\n`;
  });
  zip.file('notes_catalog.md', notesCatalogMd);

  // Goals
  zip.file('goals.json', JSON.stringify(data.goals || [], null, 2));
  zip.file('strategies.json', JSON.stringify(data.strategies || [], null, 2));
  zip.file('milestones.json', JSON.stringify(data.milestones || [], null, 2));
  zip.file('kpis.json', JSON.stringify(data.kpis || [], null, 2));

  // Health
  zip.file('health_measurements.json', JSON.stringify(data.healthMeasurements || [], null, 2));
  zip.file('sleep_records.json', JSON.stringify(data.sleepRecords || [], null, 2));
  zip.file('nutrition_records.json', JSON.stringify(data.nutritionRecords || [], null, 2));

  // Journal
  const journalList = data.journal || [];
  zip.file('all_journal_entries.json', JSON.stringify(journalList, null, 2));

  // Routines, Work, People, Spiritual, Things
  zip.file('routines.json', JSON.stringify(data.routines || [], null, 2));
  zip.file('habits.json', JSON.stringify(data.habits || [], null, 2));
  zip.file('habit_logs.json', JSON.stringify(data.habitLogs || [], null, 2));
  zip.file('work_projects.json', JSON.stringify(data.workProjects || [], null, 2));
  zip.file('learning_items.json', JSON.stringify(data.learningItems || [], null, 2));
  zip.file('people.json', JSON.stringify(data.people || [], null, 2));
  zip.file('values.json', JSON.stringify(data.values || [], null, 2));
  zip.file('things_inventory.json', JSON.stringify(data.things || [], null, 2));
  zip.file('documents.json', JSON.stringify(data.documents || [], null, 2));

  onProgress?.('Compiling ZIP archive...', 85, 100);
  return await zip.generateAsync({ type: 'blob' }, metadata => {
    onProgress?.(`Compressing: ${metadata.percent.toFixed(0)}%`, metadata.percent, 100);
  });
}
