import JSZip from 'jszip';
import { storage, ENTITY_STORES, SINGLETON_STORES } from './storage';
import { generateCompleteStandaloneHtml } from './htmlExport';

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

function sanitizeFileName(name: string): string {
  if (!name) return 'untitled';
  return name
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80) || 'untitled';
}

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
 * Sync & Save All Files to the Connected Computer Folder across Subfolders.
 * If user hasn't selected a folder yet, it will trigger the folder selection dialog first.
 */
export async function syncAllFilesToComputerFolder(
  onProgress?: (msg: string, current: number, total: number) => void
): Promise<{
  success: boolean;
  fileCount: number;
  folderName: string;
  subfolders: string[];
  error?: string;
}> {
  let record = await getHandleRecord();

  // If no folder selected yet, prompt user first time!
  if (!record || !record.handle) {
    onProgress?.('Prompting to select computer folder...', 0, 100);
    const conn = await connectComputerFolder();
    if (!conn.success) {
      return { success: false, fileCount: 0, folderName: '', subfolders: [], error: conn.error };
    }
    record = await getHandleRecord();
    if (!record || !record.handle) {
      return { success: false, fileCount: 0, folderName: '', subfolders: [], error: 'Folder connection failed.' };
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
            subfolders: [],
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
      subfolders: [],
      error: `Permission error: ${err.message}`
    };
  }

  onProgress?.('Reading sovereign database records...', 5, 100);
  const data = await gatherFullLifeOSDataset();
  const timestamp = new Date().toISOString();
  const dateStr = timestamp.slice(0, 10);

  let totalFilesWritten = 0;
  const createdSubfolders: string[] = [];

  try {
    // ----------------------------------------------------
    // Subfolder 00: Master Full System Backup
    // ----------------------------------------------------
    onProgress?.('Writing 00_Master_System_Backup...', 10, 100);
    const sub00 = await dirHandle.getDirectoryHandle('00_Master_System_Backup', { create: true });
    createdSubfolders.push('00_Master_System_Backup');

    const masterSnapshot = {
      app: 'Om-LifeOS',
      version: '4.0.0',
      exportedAt: timestamp,
      deviceId: storage.deviceId,
      totalStores: Object.keys(data).length,
      data
    };
    await writeTextFile(sub00, 'om_lifeos_master_backup.json', JSON.stringify(masterSnapshot, null, 2));
    totalFilesWritten++;

    const manifest = {
      backupTimestamp: timestamp,
      folderLayout: [
        '00_Master_System_Backup (Complete restorable JSON)',
        '01_Tasks_and_Planner (tasks, daily command targets, markdown checklists)',
        '02_Finance_and_Ledger (accounts, transactions, loans, investments, balance sheet)',
        '03_Notes_and_Notebooks (all notes JSON + individual markdown documents)',
        '04_Goals_and_Strategy (goals, tactical strategies, KPIs, milestones, missions)',
        '05_Health_and_Vitals (measurements, sleep, water, nutrition, appointments)',
        '06_Journal_and_Mind (journal entries JSON + individual formatted markdown files)',
        '07_Routines_and_Habits (daily routines, atomic habits, habit logs)',
        '08_Work_and_Learning (work projects, skills, courses, meetings, responsibilities)',
        '09_People_and_Network (contacts, interactions, relationships)',
        '10_Spiritual_and_Principles (core values, spiritual practices, commitments)',
        '11_Things_and_Vault (inventory items, documents meta, warranties, certificates)'
      ],
      recordCounts: {
        tasks: (data.tasks || []).length,
        notes: (data.notes || []).length,
        transactions: (data.finance || []).length,
        accounts: (data.financeAccounts || []).length,
        goals: (data.goals || []).length,
        habits: (data.habits || []).length,
        journal: (data.journal || []).length
      }
    };
    await writeTextFile(sub00, 'backup_manifest.json', JSON.stringify(manifest, null, 2));
    totalFilesWritten++;

    const standaloneHtml = generateCompleteStandaloneHtml(data);
    await writeTextFile(sub00, 'om_lifeos_offline_dashboard.html', standaloneHtml);
    totalFilesWritten++;

    // Write index.html at root folder for instant one-click offline browsing
    await writeTextFile(dirHandle, 'index.html', standaloneHtml);
    totalFilesWritten++;

    const readme = `Om-LifeOS Sovereign Computer Folder Backup
=========================================
Generated: ${timestamp}
Device ID: ${storage.deviceId}

This local folder contains your entire personal operating system data,
organized cleanly into separate subfolders for every life domain.

HOW TO USE THESE FILES:
1. Complete Offline Dashboard: Double-click 'index.html' or
   '00_Master_System_Backup/om_lifeos_offline_dashboard.html' in ANY browser
   to open the full interactive dashboard offline with zero internet required.
2. Complete System Restore: Use '00_Master_System_Backup/om_lifeos_master_backup.json'
   in Om-LifeOS -> Settings -> Restore Backup to instantly restore everything.
3. Direct Markdown Browsing: Notes in '03_Notes_and_Notebooks' and Journal entries
   in '06_Journal_and_Mind' are standard Markdown (.md) and can be opened in
   Obsidian, VS Code, Notion, or any text editor.
4. Financial Records: '02_Finance_and_Ledger' contains complete ledger histories.
5. Tasks: '01_Tasks_and_Planner' contains actionable markdown summaries.
`;
    await writeTextFile(sub00, 'README.txt', readme);
    totalFilesWritten++;

    // ----------------------------------------------------
    // Subfolder 01: Tasks & Planner
    // ----------------------------------------------------
    onProgress?.('Writing 01_Tasks_and_Planner...', 20, 100);
    const sub01 = await dirHandle.getDirectoryHandle('01_Tasks_and_Planner', { create: true });
    createdSubfolders.push('01_Tasks_and_Planner');

    const tasksList = data.tasks || [];
    await writeTextFile(sub01, 'tasks.json', JSON.stringify(tasksList, null, 2));
    totalFilesWritten++;

    // Human-readable tasks markdown
    let tasksMd = `# Tasks & Planner Roster\nGenerated: ${dateStr}\n\n`;
    tasksMd += `## Open Tasks (${tasksList.filter((t: any) => !t.done).length})\n`;
    tasksList.filter((t: any) => !t.done).forEach((t: any) => {
      tasksMd += `- [ ] **[${t.priority || 'Medium'}]** ${t.title} *(Domain: ${t.domain || 'general'} | Due: ${t.dueAt || 'none'})*\n`;
      if (t.description) tasksMd += `  > ${t.description}\n`;
    });
    tasksMd += `\n## Completed Tasks (${tasksList.filter((t: any) => t.done).length})\n`;
    tasksList.filter((t: any) => t.done).forEach((t: any) => {
      tasksMd += `- [x] ${t.title} *(Completed)*\n`;
    });
    await writeTextFile(sub01, 'tasks_summary.md', tasksMd);
    totalFilesWritten++;

    // Daily Planner Targets
    const dailyPlanner = data.appSettings?.dailyPlanner;
    if (dailyPlanner) {
      await writeTextFile(sub01, 'daily_command_target_today.json', JSON.stringify(dailyPlanner, null, 2));
      totalFilesWritten++;
    }

    // ----------------------------------------------------
    // Subfolder 02: Finance & Ledger
    // ----------------------------------------------------
    onProgress?.('Writing 02_Finance_and_Ledger...', 35, 100);
    const sub02 = await dirHandle.getDirectoryHandle('02_Finance_and_Ledger', { create: true });
    createdSubfolders.push('02_Finance_and_Ledger');

    await writeTextFile(sub02, 'accounts.json', JSON.stringify(data.financeAccounts || [], null, 2));
    await writeTextFile(sub02, 'transactions.json', JSON.stringify(data.finance || [], null, 2));
    await writeTextFile(sub02, 'loans.json', JSON.stringify(data.loans || [], null, 2));
    await writeTextFile(sub02, 'loan_payments.json', JSON.stringify(data.loanPayments || [], null, 2));
    await writeTextFile(sub02, 'investments.json', JSON.stringify(data.investments || [], null, 2));
    await writeTextFile(sub02, 'savings_plans.json', JSON.stringify(data.savingsPlans || [], null, 2));
    await writeTextFile(sub02, 'assets.json', JSON.stringify(data.assets || [], null, 2));
    await writeTextFile(sub02, 'liabilities.json', JSON.stringify(data.liabilities || [], null, 2));
    await writeTextFile(sub02, 'financial_goals.json', JSON.stringify(data.financialGoals || [], null, 2));
    totalFilesWritten += 9;

    // Financial Overview Markdown
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
    await writeTextFile(sub02, 'financial_overview.md', finMd);
    totalFilesWritten++;

    // ----------------------------------------------------
    // Subfolder 03: Notes & Notebooks
    // ----------------------------------------------------
    onProgress?.('Writing 03_Notes_and_Notebooks...', 50, 100);
    const sub03 = await dirHandle.getDirectoryHandle('03_Notes_and_Notebooks', { create: true });
    createdSubfolders.push('03_Notes_and_Notebooks');

    const notesList = data.notes || [];
    await writeTextFile(sub03, 'all_notes.json', JSON.stringify(notesList, null, 2));
    totalFilesWritten++;

    // Save individual markdown files for every note
    for (const note of notesList) {
      const catName = sanitizeFileName(note.category || 'General');
      const noteDir = await sub03.getDirectoryHandle(catName, { create: true });
      const safeTitle = sanitizeFileName(note.title || 'Untitled_Note');
      const fileName = `${safeTitle}.md`;

      let noteMd = `# ${note.title || 'Untitled Note'}\n`;
      noteMd += `Date: ${note.date || dateStr} | Notebook: ${note.category || 'General'}\n`;
      if (note.tags) noteMd += `Tags: #${note.tags.split(',').map((t: string) => t.trim()).join(' #')}\n`;
      noteMd += `\n---\n\n`;
      noteMd += `${note.body || ''}\n`;
      if (note.points) {
        noteMd += `\n### Key Takeaways & Action Points\n${note.points}\n`;
      }

      await writeTextFile(noteDir, fileName, noteMd);
      totalFilesWritten++;
    }

    // ----------------------------------------------------
    // Subfolder 04: Goals & Strategy
    // ----------------------------------------------------
    onProgress?.('Writing 04_Goals_and_Strategy...', 65, 100);
    const sub04 = await dirHandle.getDirectoryHandle('04_Goals_and_Strategy', { create: true });
    createdSubfolders.push('04_Goals_and_Strategy');

    await writeTextFile(sub04, 'goals.json', JSON.stringify(data.goals || [], null, 2));
    await writeTextFile(sub04, 'strategies.json', JSON.stringify(data.strategies || [], null, 2));
    await writeTextFile(sub04, 'milestones.json', JSON.stringify(data.milestones || [], null, 2));
    await writeTextFile(sub04, 'kpis.json', JSON.stringify(data.kpis || [], null, 2));
    await writeTextFile(sub04, 'missions.json', JSON.stringify(data.missions || [], null, 2));
    totalFilesWritten += 5;

    // Goals overview markdown
    const goalsList = data.goals || [];
    let goalsMd = `# Strategic Goals & Objectives\nDate: ${dateStr}\n\n`;
    goalsList.forEach((g: any) => {
      goalsMd += `### ${g.title} (${g.progress}% Complete)\n`;
      goalsMd += `- Category: ${g.category || 'General'}\n`;
      if (g.targetDate) goalsMd += `- Target Date: ${g.targetDate}\n`;
      goalsMd += `\n`;
    });
    await writeTextFile(sub04, 'goals_overview.md', goalsMd);
    totalFilesWritten++;

    // ----------------------------------------------------
    // Subfolder 05: Health & Vitals
    // ----------------------------------------------------
    onProgress?.('Writing 05_Health_and_Vitals...', 75, 100);
    const sub05 = await dirHandle.getDirectoryHandle('05_Health_and_Vitals', { create: true });
    createdSubfolders.push('05_Health_and_Vitals');

    await writeTextFile(sub05, 'health_measurements.json', JSON.stringify(data.healthMeasurements || [], null, 2));
    await writeTextFile(sub05, 'sleep_records.json', JSON.stringify(data.sleepRecords || [], null, 2));
    await writeTextFile(sub05, 'water_records.json', JSON.stringify(data.waterRecords || [], null, 2));
    await writeTextFile(sub05, 'nutrition_records.json', JSON.stringify(data.nutritionRecords || [], null, 2));
    await writeTextFile(sub05, 'health_appointments.json', JSON.stringify(data.healthAppointments || [], null, 2));
    await writeTextFile(sub05, 'health_notes.json', JSON.stringify(data.healthNotes || [], null, 2));
    totalFilesWritten += 6;

    // ----------------------------------------------------
    // Subfolder 06: Journal & Mind
    // ----------------------------------------------------
    onProgress?.('Writing 06_Journal_and_Mind...', 82, 100);
    const sub06 = await dirHandle.getDirectoryHandle('06_Journal_and_Mind', { create: true });
    createdSubfolders.push('06_Journal_and_Mind');

    const journalList = data.journal || [];
    await writeTextFile(sub06, 'all_journal_entries.json', JSON.stringify(journalList, null, 2));
    totalFilesWritten++;

    // Individual markdown entries
    for (const j of journalList) {
      const safeTitle = sanitizeFileName(j.title || `Journal_${j.date || 'entry'}`);
      const fileName = `${j.date || 'date'}_${safeTitle}.md`;
      let jMd = `# ${j.title || 'Journal Entry'} (${j.date || dateStr})\n`;
      if (j.mood) jMd += `Mood: ${j.mood}\n`;
      if (j.tags) jMd += `Tags: ${j.tags}\n`;
      jMd += `\n---\n\n${j.body || j.content || ''}\n`;
      await writeTextFile(sub06, fileName, jMd);
      totalFilesWritten++;
    }

    // ----------------------------------------------------
    // Subfolder 07: Routines & Habits
    // ----------------------------------------------------
    onProgress?.('Writing 07_Routines_and_Habits...', 88, 100);
    const sub07 = await dirHandle.getDirectoryHandle('07_Routines_and_Habits', { create: true });
    createdSubfolders.push('07_Routines_and_Habits');

    await writeTextFile(sub07, 'routines.json', JSON.stringify(data.routines || [], null, 2));
    await writeTextFile(sub07, 'habits.json', JSON.stringify(data.habits || [], null, 2));
    await writeTextFile(sub07, 'habit_logs.json', JSON.stringify(data.habitLogs || [], null, 2));
    totalFilesWritten += 3;

    // ----------------------------------------------------
    // Subfolder 08: Work & Learning
    // ----------------------------------------------------
    onProgress?.('Writing 08_Work_and_Learning...', 92, 100);
    const sub08 = await dirHandle.getDirectoryHandle('08_Work_and_Learning', { create: true });
    createdSubfolders.push('08_Work_and_Learning');

    await writeTextFile(sub08, 'work_projects.json', JSON.stringify(data.workProjects || [], null, 2));
    await writeTextFile(sub08, 'work_responsibilities.json', JSON.stringify(data.workResponsibilities || [], null, 2));
    await writeTextFile(sub08, 'learning_items.json', JSON.stringify(data.learningItems || [], null, 2));
    await writeTextFile(sub08, 'skills.json', JSON.stringify(data.skills || [], null, 2));
    await writeTextFile(sub08, 'courses.json', JSON.stringify(data.courses || [], null, 2));
    await writeTextFile(sub08, 'meetings.json', JSON.stringify(data.meetings || [], null, 2));
    totalFilesWritten += 6;

    // ----------------------------------------------------
    // Subfolder 09: People & Network
    // ----------------------------------------------------
    const sub09 = await dirHandle.getDirectoryHandle('09_People_and_Network', { create: true });
    createdSubfolders.push('09_People_and_Network');
    await writeTextFile(sub09, 'people.json', JSON.stringify(data.people || [], null, 2));
    await writeTextFile(sub09, 'interactions.json', JSON.stringify(data.interactions || [], null, 2));
    totalFilesWritten += 2;

    // ----------------------------------------------------
    // Subfolder 10: Spiritual & Principles
    // ----------------------------------------------------
    const sub10 = await dirHandle.getDirectoryHandle('10_Spiritual_and_Principles', { create: true });
    createdSubfolders.push('10_Spiritual_and_Principles');
    await writeTextFile(sub10, 'values.json', JSON.stringify(data.values || [], null, 2));
    await writeTextFile(sub10, 'practices.json', JSON.stringify(data.spiritualPractices || [], null, 2));
    await writeTextFile(sub10, 'commitments.json', JSON.stringify(data.commitments || [], null, 2));
    totalFilesWritten += 3;

    // ----------------------------------------------------
    // Subfolder 11: Things & Vault
    // ----------------------------------------------------
    onProgress?.('Writing 11_Things_and_Vault...', 97, 100);
    const sub11 = await dirHandle.getDirectoryHandle('11_Things_and_Vault', { create: true });
    createdSubfolders.push('11_Things_and_Vault');
    await writeTextFile(sub11, 'things_inventory.json', JSON.stringify(data.things || [], null, 2));
    await writeTextFile(sub11, 'documents.json', JSON.stringify(data.documents || [], null, 2));
    await writeTextFile(sub11, 'warranties.json', JSON.stringify(data.warranties || [], null, 2));
    await writeTextFile(sub11, 'receipts.json', JSON.stringify(data.receipts || [], null, 2));
    await writeTextFile(sub11, 'certificates.json', JSON.stringify(data.certificates || [], null, 2));
    await writeTextFile(sub11, 'important_records.json', JSON.stringify(data.importantRecords || [], null, 2));
    totalFilesWritten += 6;

    // Update metadata record with last backup stats
    record.lastBackupAt = Date.now();
    record.lastFileCount = totalFilesWritten;
    await saveHandleRecord(record);

    onProgress?.('✓ Complete! All files safely written to computer folder.', 100, 100);

    return {
      success: true,
      fileCount: totalFilesWritten,
      folderName: record.folderName,
      subfolders: createdSubfolders
    };
  } catch (err: any) {
    return {
      success: false,
      fileCount: totalFilesWritten,
      folderName: record.folderName,
      subfolders: createdSubfolders,
      error: `Failed writing files: ${err.message}`
    };
  }
}

/**
 * Universal Multi-Subfolder ZIP Generator:
 * Generates identical subfolder layout as a single .zip download package
 * for browsers without File System Access API or for portable offline archives!
 */
export async function exportAllFilesAsZip(
  onProgress?: (msg: string, current: number, total: number) => void
): Promise<Blob> {
  onProgress?.('Collecting data from sovereign database...', 10, 100);
  const data = await gatherFullLifeOSDataset();
  const timestamp = new Date().toISOString();
  const dateStr = timestamp.slice(0, 10);
  const zip = new JSZip();

  // 00_Master_System_Backup
  const sub00 = zip.folder('00_Master_System_Backup')!;
  sub00.file(
    'om_lifeos_master_backup.json',
    JSON.stringify(
      {
        app: 'Om-LifeOS',
        version: '4.0.0',
        exportedAt: timestamp,
        deviceId: storage.deviceId,
        data
      },
      null,
      2
    )
  );

  const standaloneHtml = generateCompleteStandaloneHtml(data);
  sub00.file('om_lifeos_offline_dashboard.html', standaloneHtml);
  zip.file('index.html', standaloneHtml);

  // 01_Tasks_and_Planner
  const sub01 = zip.folder('01_Tasks_and_Planner')!;
  const tasksList = data.tasks || [];
  sub01.file('tasks.json', JSON.stringify(tasksList, null, 2));

  let tasksMd = `# Tasks & Planner Roster\nGenerated: ${dateStr}\n\n`;
  tasksList.filter((t: any) => !t.done).forEach((t: any) => {
    tasksMd += `- [ ] [${t.priority || 'Medium'}] ${t.title} (${t.domain || 'general'})\n`;
  });
  sub01.file('tasks_summary.md', tasksMd);

  // 02_Finance_and_Ledger
  const sub02 = zip.folder('02_Finance_and_Ledger')!;
  sub02.file('accounts.json', JSON.stringify(data.financeAccounts || [], null, 2));
  sub02.file('transactions.json', JSON.stringify(data.finance || [], null, 2));
  sub02.file('loans.json', JSON.stringify(data.loans || [], null, 2));
  sub02.file('investments.json', JSON.stringify(data.investments || [], null, 2));
  sub02.file('savings_plans.json', JSON.stringify(data.savingsPlans || [], null, 2));
  sub02.file('assets.json', JSON.stringify(data.assets || [], null, 2));
  sub02.file('liabilities.json', JSON.stringify(data.liabilities || [], null, 2));

  // 03_Notes_and_Notebooks
  const sub03 = zip.folder('03_Notes_and_Notebooks')!;
  const notesList = data.notes || [];
  sub03.file('all_notes.json', JSON.stringify(notesList, null, 2));
  for (const note of notesList) {
    const cat = sanitizeFileName(note.category || 'General');
    const noteDir = sub03.folder(cat)!;
    const title = sanitizeFileName(note.title || 'Untitled_Note');
    noteDir.file(
      `${title}.md`,
      `# ${note.title}\nDate: ${note.date} | Notebook: ${note.category}\nTags: ${note.tags || 'none'}\n\n${note.body || ''}\n\n${note.points ? `### Takeaways\n${note.points}` : ''}`
    );
  }

  // 04_Goals_and_Strategy
  const sub04 = zip.folder('04_Goals_and_Strategy')!;
  sub04.file('goals.json', JSON.stringify(data.goals || [], null, 2));
  sub04.file('strategies.json', JSON.stringify(data.strategies || [], null, 2));
  sub04.file('milestones.json', JSON.stringify(data.milestones || [], null, 2));
  sub04.file('kpis.json', JSON.stringify(data.kpis || [], null, 2));

  // 05_Health_and_Vitals
  const sub05 = zip.folder('05_Health_and_Vitals')!;
  sub05.file('health_measurements.json', JSON.stringify(data.healthMeasurements || [], null, 2));
  sub05.file('sleep_records.json', JSON.stringify(data.sleepRecords || [], null, 2));
  sub05.file('nutrition_records.json', JSON.stringify(data.nutritionRecords || [], null, 2));

  // 06_Journal_and_Mind
  const sub06 = zip.folder('06_Journal_and_Mind')!;
  const journalList = data.journal || [];
  sub06.file('all_journal_entries.json', JSON.stringify(journalList, null, 2));
  for (const j of journalList) {
    const safeTitle = sanitizeFileName(j.title || `Journal_${j.date}`);
    sub06.file(`${j.date || 'date'}_${safeTitle}.md`, `# ${j.title}\nDate: ${j.date}\n\n${j.body || j.content || ''}`);
  }

  // 07_Routines_and_Habits
  const sub07 = zip.folder('07_Routines_and_Habits')!;
  sub07.file('routines.json', JSON.stringify(data.routines || [], null, 2));
  sub07.file('habits.json', JSON.stringify(data.habits || [], null, 2));
  sub07.file('habit_logs.json', JSON.stringify(data.habitLogs || [], null, 2));

  // 08_Work_and_Learning
  const sub08 = zip.folder('08_Work_and_Learning')!;
  sub08.file('work_projects.json', JSON.stringify(data.workProjects || [], null, 2));
  sub08.file('learning_items.json', JSON.stringify(data.learningItems || [], null, 2));

  // 09_People_and_Network
  const sub09 = zip.folder('09_People_and_Network')!;
  sub09.file('people.json', JSON.stringify(data.people || [], null, 2));

  // 10_Spiritual_and_Principles
  const sub10 = zip.folder('10_Spiritual_and_Principles')!;
  sub10.file('values.json', JSON.stringify(data.values || [], null, 2));

  // 11_Things_and_Vault
  const sub11 = zip.folder('11_Things_and_Vault')!;
  sub11.file('things_inventory.json', JSON.stringify(data.things || [], null, 2));
  sub11.file('documents.json', JSON.stringify(data.documents || [], null, 2));

  onProgress?.('Compiling ZIP archive...', 85, 100);
  return await zip.generateAsync({ type: 'blob' }, metadata => {
    onProgress?.(`Compressing: ${metadata.percent.toFixed(0)}%`, metadata.percent, 100);
  });
}
