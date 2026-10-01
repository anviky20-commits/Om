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

/**
 * STRICT 3-FILE POLICY
 * User requirement: Only these 3 files are allowed in the backup directory:
 * 1. om_lifeos_offline_dashboard.html
 * 2. finance_transactions.json
 * 3. om_lifeos_master_backup.json
 * All other files and all subfolders are permanently removed.
 */
export const ALLOWED_BACKUP_FILES = [
  'om_lifeos_offline_dashboard.html',
  'finance_transactions.json',
  'om_lifeos_master_backup.json'
] as const;

export const ALLOWED_BACKUP_FILES_SET = new Set<string>(ALLOWED_BACKUP_FILES);

// Known legacy file names from older versions to explicitly delete
export const LEGACY_FILES_TO_PURGE = [
  'index.html',
  'backup_manifest.json',
  'README.txt',
  'tasks.json',
  'tasks_summary.md',
  'daily_command_targets.json',
  'daily_command_target_today.json',
  'finance_accounts.json',
  'accounts.json',
  'transactions.json',
  'loans.json',
  'loan_payments.json',
  'investments.json',
  'savings_plans.json',
  'assets.json',
  'liabilities.json',
  'financial_goals.json',
  'financial_overview.md',
  'all_notes.json',
  'notes_catalog.md',
  'goals.json',
  'strategies.json',
  'milestones.json',
  'kpis.json',
  'missions.json',
  'goals_overview.md',
  'health_measurements.json',
  'sleep_records.json',
  'water_records.json',
  'nutrition_records.json',
  'health_appointments.json',
  'health_notes.json',
  'all_journal_entries.json',
  'journal_reflections.md',
  'routines.json',
  'habits.json',
  'habit_logs.json',
  'work_projects.json',
  'work_responsibilities.json',
  'learning_items.json',
  'skills.json',
  'courses.json',
  'meetings.json',
  'people.json',
  'interactions.json',
  'values.json',
  'practices.json',
  'spiritual_practices.json',
  'commitments.json',
  'things_inventory.json',
  'documents.json',
  'warranties.json',
  'receipts.json',
  'certificates.json',
  'important_records.json'
];

// Known legacy subfolder names to explicitly delete
export const LEGACY_SUBFOLDERS_TO_PURGE = [
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
 * Permanently purge all subfolders and all files EXCEPT the 3 allowed files:
 * 1. om_lifeos_offline_dashboard.html
 * 2. finance_transactions.json
 * 3. om_lifeos_master_backup.json
 */
export async function purgeAllExceptAllowedFiles(
  dirHandle: FileSystemDirectoryHandle,
  onProgress?: (msg: string) => void
): Promise<{ removedCount: number; removedNames: string[] }> {
  const removedNames: string[] = [];

  // 1. Explicitly remove all known legacy subfolders
  for (const name of LEGACY_SUBFOLDERS_TO_PURGE) {
    try {
      await (dirHandle as any).removeEntry(name, { recursive: true });
      if (!removedNames.includes(`[Folder] ${name}`)) {
        removedNames.push(`[Folder] ${name}`);
        onProgress?.(`Deleted subfolder: ${name}`);
      }
    } catch {
      // Ignored if not present
    }
  }

  // 2. Explicitly remove all known legacy files
  for (const name of LEGACY_FILES_TO_PURGE) {
    try {
      await (dirHandle as any).removeEntry(name);
      if (!removedNames.includes(name)) {
        removedNames.push(name);
        onProgress?.(`Deleted extra file: ${name}`);
      }
    } catch {
      // Ignored if not present
    }
  }

  // 3. Dynamically scan directory entries to delete ANY other subfolder or non-allowed file
  try {
    if (typeof (dirHandle as any).values === 'function') {
      for await (const entry of (dirHandle as any).values()) {
        if (entry.kind === 'directory') {
          try {
            await (dirHandle as any).removeEntry(entry.name, { recursive: true });
            const tag = `[Folder] ${entry.name}`;
            if (!removedNames.includes(tag)) {
              removedNames.push(tag);
              onProgress?.(`Deleted subfolder: ${entry.name}`);
            }
          } catch (e) {
            console.warn(`Could not remove directory ${entry.name}:`, e);
          }
        } else if (entry.kind === 'file') {
          if (!ALLOWED_BACKUP_FILES_SET.has(entry.name)) {
            try {
              await (dirHandle as any).removeEntry(entry.name);
              if (!removedNames.includes(entry.name)) {
                removedNames.push(entry.name);
                onProgress?.(`Deleted extra file: ${entry.name}`);
              }
            } catch (e) {
              console.warn(`Could not remove file ${entry.name}:`, e);
            }
          }
        }
      }
    } else if (typeof (dirHandle as any).entries === 'function') {
      for await (const [name, entry] of (dirHandle as any).entries()) {
        if (entry.kind === 'directory') {
          try {
            await (dirHandle as any).removeEntry(name, { recursive: true });
            const tag = `[Folder] ${name}`;
            if (!removedNames.includes(tag)) {
              removedNames.push(tag);
              onProgress?.(`Deleted subfolder: ${name}`);
            }
          } catch {}
        } else if (entry.kind === 'file') {
          if (!ALLOWED_BACKUP_FILES_SET.has(name)) {
            try {
              await (dirHandle as any).removeEntry(name);
              if (!removedNames.includes(name)) {
                removedNames.push(name);
                onProgress?.(`Deleted extra file: ${name}`);
              }
            } catch {}
          }
        }
      }
    }
  } catch (err) {
    console.warn('Dynamic folder scan during purge encountered:', err);
  }

  return { removedCount: removedNames.length, removedNames };
}

/**
 * Public trigger to permanently purge all extra files & subfolders from the currently connected computer folder,
 * leaving strictly the 3 allowed files.
 */
export async function cleanConnectedFolderToAllowedOnly(
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

    const res = await purgeAllExceptAllowedFiles(dirHandle, onProgress);
    return { success: true, removedCount: res.removedCount, removedNames: res.removedNames };
  } catch (err: any) {
    return { success: false, removedCount: 0, removedNames: [], error: err.message };
  }
}

// Aliases for backwards compatibility
export const cleanAllSubfoldersFromConnectedFolder = cleanConnectedFolderToAllowedOnly;
export const removeAllSubfoldersFromDirectory = purgeAllExceptAllowedFiles;

/**
 * Sync & Save Files to the Connected Computer Folder.
 * STRICT 3-FILE MODE:
 * 1. "om_lifeos_offline_dashboard.html"
 * 2. "finance_transactions.json"
 * 3. "om_lifeos_master_backup.json"
 *
 * All other files and all subfolders are permanently removed from the folder!
 */
export async function syncAllFilesToComputerFolder(
  onProgress?: (msg: string, current: number, total: number) => void
): Promise<{
  success: boolean;
  fileCount: number;
  folderName: string;
  removedFilesCount: number;
  error?: string;
}> {
  let record = await getHandleRecord();

  // If no folder selected yet, prompt user first time
  if (!record || !record.handle) {
    onProgress?.('Prompting to select computer folder...', 0, 100);
    const conn = await connectComputerFolder();
    if (!conn.success) {
      return { success: false, fileCount: 0, folderName: '', removedFilesCount: 0, error: conn.error };
    }
    record = await getHandleRecord();
    if (!record || !record.handle) {
      return { success: false, fileCount: 0, folderName: '', removedFilesCount: 0, error: 'Folder connection failed.' };
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
            removedFilesCount: 0,
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
      removedFilesCount: 0,
      error: `Permission error: ${err.message}`
    };
  }

  // 1. Permanently remove all subfolders and all extra files first
  onProgress?.('Permanently removing extra files & subfolders...', 15, 100);
  const cleanup = await purgeAllExceptAllowedFiles(dirHandle, (msg) => onProgress?.(msg, 25, 100));

  onProgress?.('Reading database records...', 40, 100);
  const data = await gatherFullLifeOSDataset();
  const timestamp = new Date().toISOString();

  let totalFilesWritten = 0;

  try {
    // -------------------------------------------------------------------------
    // FILE 1: Standalone Interactive Offline Dashboard HTML
    // (om_lifeos_offline_dashboard.html)
    // -------------------------------------------------------------------------
    onProgress?.('Writing om_lifeos_offline_dashboard.html...', 55, 100);
    const standaloneHtml = generateCompleteStandaloneHtml(data);
    await writeTextFile(dirHandle, 'om_lifeos_offline_dashboard.html', standaloneHtml);
    totalFilesWritten++;

    // -------------------------------------------------------------------------
    // FILE 2: Finance Transactions JSON
    // (finance_transactions.json)
    // -------------------------------------------------------------------------
    onProgress?.('Writing finance_transactions.json...', 75, 100);
    const transactions = data.finance || [];
    await writeTextFile(dirHandle, 'finance_transactions.json', JSON.stringify(transactions, null, 2));
    totalFilesWritten++;

    // -------------------------------------------------------------------------
    // FILE 3: Full Master System JSON Backup
    // (om_lifeos_master_backup.json)
    // -------------------------------------------------------------------------
    onProgress?.('Writing om_lifeos_master_backup.json...', 90, 100);
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

    // Final safety sweep: ensure no extra files remain
    await purgeAllExceptAllowedFiles(dirHandle);

    // Update metadata record with last backup stats
    record.lastBackupAt = Date.now();
    record.lastFileCount = totalFilesWritten; // 3 files
    await saveHandleRecord(record);

    onProgress?.('✓ Complete! Exactly 3 essential files saved (all other files removed).', 100, 100);

    return {
      success: true,
      fileCount: totalFilesWritten,
      folderName: record.folderName,
      removedFilesCount: cleanup.removedCount
    };
  } catch (err: any) {
    return {
      success: false,
      fileCount: totalFilesWritten,
      folderName: record.folderName,
      removedFilesCount: cleanup.removedCount,
      error: `Failed writing files: ${err.message}`
    };
  }
}

/**
 * Clean 3-File ZIP Generator:
 * Generates an archive containing strictly the 3 essential backup files:
 * 1. om_lifeos_offline_dashboard.html
 * 2. finance_transactions.json
 * 3. om_lifeos_master_backup.json
 */
export async function exportAllFilesAsZip(
  onProgress?: (msg: string, current: number, total: number) => void
): Promise<Blob> {
  onProgress?.('Collecting data from sovereign database...', 15, 100);
  const data = await gatherFullLifeOSDataset();
  const timestamp = new Date().toISOString();
  const zip = new JSZip();

  // File 1: om_lifeos_offline_dashboard.html
  onProgress?.('Adding om_lifeos_offline_dashboard.html...', 40, 100);
  const standaloneHtml = generateCompleteStandaloneHtml(data);
  zip.file('om_lifeos_offline_dashboard.html', standaloneHtml);

  // File 2: finance_transactions.json
  onProgress?.('Adding finance_transactions.json...', 65, 100);
  zip.file('finance_transactions.json', JSON.stringify(data.finance || [], null, 2));

  // File 3: om_lifeos_master_backup.json
  onProgress?.('Adding om_lifeos_master_backup.json...', 85, 100);
  const masterSnapshot = {
    app: 'Om-LifeOS',
    version: '4.8.0',
    exportedAt: timestamp,
    deviceId: storage.deviceId,
    data
  };
  zip.file('om_lifeos_master_backup.json', JSON.stringify(masterSnapshot, null, 2));

  onProgress?.('Compiling clean 3-file ZIP archive...', 95, 100);
  return await zip.generateAsync({ type: 'blob' }, (metadata) => {
    onProgress?.(`Compressing: ${metadata.percent.toFixed(0)}%`, metadata.percent, 100);
  });
}
