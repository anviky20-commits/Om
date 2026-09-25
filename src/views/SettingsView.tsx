import React, { useState, useEffect } from 'react';
import {
  Settings, Download, Upload, FileText, FileSpreadsheet,
  FileCode, Database, RefreshCw, Trash2, Users, Bell, ShieldCheck,
  Monitor, Palette, Copy, Check, Folder, FolderCheck, HardDrive,
  Layers, CheckCircle2, AlertCircle, ChevronRight, Globe
} from 'lucide-react';
import { storage, exportToCsv, exportToDocx, exportToXlsx, exportToPdf, exportToCompleteHtml, generateUUID } from '../lib/storage';
import {
  isFileSystemAccessSupported,
  getConnectedFolderInfo,
  connectComputerFolder,
  disconnectComputerFolder,
  syncAllFilesToComputerFolder,
  exportAllFilesAsZip,
  FolderSyncMeta
} from '../lib/computerFolderSync';
import { AppState, UserProfile } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import { ComputerSubfoldersViewer } from '../components/ComputerSubfoldersViewer';

interface SettingsViewProps {
  settings?: AppState;
  onRefresh: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onRefresh,
  onSuccess,
  onError,
  theme,
  onToggleTheme
}) => {
  const [activeTab, setActiveTab] = useState<'system' | 'workspaces' | 'exports' | 'computer'>('system');
  const [newProfileName, setNewProfileName] = useState('');
  const [storageStats, setStorageStats] = useState({ usage: 0, quota: 0, percent: 0, level: 'healthy' });
  const [integrityStats, setIntegrityStats] = useState<{ checked: number; issues: number; repaired: number }>({ checked: 0, issues: 0, repaired: 0 });
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [accentColor, setAccentColor] = useState<string>(settings?.accentColor || '#6366f1');

  useEffect(() => {
    if (settings?.accentColor) {
      setAccentColor(settings.accentColor);
    }
  }, [settings?.accentColor]);

  // Connect to Computer state
  const [pairCode, setPairCode] = useState(settings?.computerPairCode || '');
  const [isConnected, setIsConnected] = useState(settings?.computerConnected || false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Computer Folder Direct Sync state
  const isFolderApiSupported = isFileSystemAccessSupported();
  const [folderMeta, setFolderMeta] = useState<FolderSyncMeta>({
    isConnected: false,
    folderName: null,
    connectedAt: null,
    lastBackupAt: null,
    lastFileCount: null,
    autoSync: false,
    hasPermission: false
  });
  const [isFolderSyncing, setIsFolderSyncing] = useState(false);
  const [folderSyncProgress, setFolderSyncProgress] = useState('');
  const [folderSyncPercent, setFolderSyncPercent] = useState(0);
  const [isFolderZipping, setIsFolderZipping] = useState(false);

  const loadFolderMeta = async () => {
    const info = await getConnectedFolderInfo();
    setFolderMeta(info);
  };

  useEffect(() => {
    loadFolderMeta();
  }, []);

  const handleRunFolderSync = async () => {
    setIsFolderSyncing(true);
    setFolderSyncPercent(0);
    setFolderSyncProgress('Preparing files for domain subfolders...');

    try {
      const res = await syncAllFilesToComputerFolder((msg, current, total) => {
        setFolderSyncProgress(msg);
        setFolderSyncPercent(Math.round((current / total) * 100));
      });

      if (res.success) {
        onSuccess(`✓ Successfully saved ${res.fileCount} files into "${res.folderName}" across all ${res.subfolders.length} subfolders.`);
        await loadFolderMeta();
      } else if (res.error) {
        onError(res.error);
      }
    } catch (err: any) {
      onError(err.message);
    } finally {
      setIsFolderSyncing(false);
    }
  };

  const handleSelectComputerFolder = async () => {
    try {
      const res = await connectComputerFolder();
      if (res.success) {
        onSuccess(`Connected to computer folder: "${res.folderName}"! Saving all 12 domain subfolders now...`);
        await loadFolderMeta();
        await handleRunFolderSync();
      } else if (res.error && res.error !== 'Folder selection was cancelled.') {
        onError(res.error);
      }
    } catch (e: any) {
      onError(e.message);
    }
  };

  const handleDisconnectFolder = async () => {
    await disconnectComputerFolder();
    await loadFolderMeta();
    onSuccess('Disconnected computer backup folder.');
  };

  const handleDownloadZipPackage = async () => {
    setIsFolderZipping(true);
    setFolderSyncProgress('Packaging subfolders into ZIP...');
    try {
      const blob = await exportAllFilesAsZip((msg) => {
        setFolderSyncProgress(msg);
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Om-LifeOS-MultiFolder-Backup-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      onSuccess('Complete multi-folder backup package (.zip) downloaded');
    } catch (e: any) {
      onError(e.message);
    } finally {
      setIsFolderZipping(false);
      setFolderSyncProgress('');
    }
  };

  useEffect(() => {
    storage.getStorageEstimate().then(setStorageStats);
  }, []);

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    const appSettings = await storage.getSingleton<AppState>('appSettings') || {
      profileId: 'default',
      profiles: [],
      themeMode: 'light',
      accentColor: '#5d57c9',
      notificationsEnabled: true,
      noteCategories: ['General'],
      calcFavorites: []
    };

    const newProfile: UserProfile = {
      id: generateUUID(),
      name: newProfileName.trim(),
      createdAt: Date.now()
    };

    appSettings.profiles = [...(appSettings.profiles || []), newProfile];
    await storage.setSingleton('appSettings', appSettings);
    onSuccess(`Workspace profile "${newProfileName}" created`);
    setNewProfileName('');
    onRefresh();
  };

  const handleSwitchProfile = async (id: string) => {
    const appSettings = await storage.getSingleton<AppState>('appSettings') || {
      profileId: 'default',
      profiles: [],
      themeMode: 'light',
      accentColor: '#5d57c9',
      notificationsEnabled: true,
      noteCategories: ['General'],
      calcFavorites: []
    };
    appSettings.profileId = id;
    await storage.setSingleton('appSettings', appSettings);
    onSuccess('Workspace profile switched');
    onRefresh();
  };

  const handleGeneratePairCode = async () => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setPairCode(code);
    const appSettings = await storage.getSingleton<AppState>('appSettings') || {} as AppState;
    appSettings.computerPairCode = code;
    appSettings.computerConnected = false;
    await storage.setSingleton('appSettings', appSettings);
    onSuccess('6-digit computer pairing code generated');
  };

  const handleCopyPairCode = async () => {
    if (!pairCode) return;
    try {
      await navigator.clipboard.writeText(pairCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      onSuccess('Pairing code copied to clipboard');
    } catch {
      onError('Clipboard copy unavailable');
    }
  };

  const handleToggleComputerConnect = async () => {
    const nextState = !isConnected;
    setIsConnected(nextState);
    const appSettings = await storage.getSingleton<AppState>('appSettings') || {} as AppState;
    appSettings.computerConnected = nextState;
    await storage.setSingleton('appSettings', appSettings);
    onSuccess(nextState ? '🖥 Connected to computer' : 'Disconnected from computer');
  };

  const handleRequestNotifications = async () => {
    if (!('Notification' in window)) {
      onError('Browser does not support notifications');
      return;
    }
    try {
      const res = await Notification.requestPermission();
      if (res === 'granted') {
        new Notification('Om-LifeOS Notifications Enabled', {
          body: 'Scheduled reminders and deep work notifications are active.'
        });
        onSuccess('✓ Browser notifications allowed and verified');
      } else {
        onError('Notification permission was not granted');
      }
    } catch (e: any) {
      onError(`Notification request failed: ${e.message}`);
    }
  };

  const handleExportBackup = async () => {
    try {
      const blob = await storage.exportFullBackup();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Om-LifeOS-Complete-Backup-${new Date().toISOString().slice(0, 10)}.omlifeos`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      onSuccess('Full database backup (.omlifeos) downloaded');
    } catch (e: any) {
      onError(`Backup failed: ${e.message}`);
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const content = String(reader.result || '');
        await storage.importFullBackup(content);
        onSuccess('Full database backup restored atomically');
        onRefresh();
      } catch (err: any) {
        onError(`Restore failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const getUnifiedExportRows = async () => {
    const [tasks, notes, finance, goals, people] = await Promise.all([
      storage.getAll<any>('tasks'),
      storage.getAll<any>('notes'),
      storage.getAll<any>('finance'),
      storage.getAll<any>('goals'),
      storage.getAll<any>('people')
    ]);

    const rows: (string | number)[][] = [
      ['Module', 'ID', 'Title / Description', 'Status / Category', 'Amount / Progress', 'Date']
    ];

    tasks.forEach(t => rows.push(['Task', t.id, t.title, t.status, t.priority, t.dueAt || t.date || '']));
    notes.forEach(n => rows.push(['Note', n.id, n.title, n.category, '', n.date || '']));
    finance.forEach(f => rows.push(['Finance', f.id, f.category + (f.note ? ` (${f.note})` : ''), f.type, `₹${f.amount}`, f.date || '']));
    goals.forEach(g => rows.push(['Goal', g.id, g.title, g.category || '', `${g.progress}%`, g.targetDate || '']));
    people.forEach(p => rows.push(['Person', p.id, p.name, p.relationship, '', p.importantDate || '']));

    return rows;
  };

  const handleExportWord = async () => {
    const rows = await getUnifiedExportRows();
    exportToDocx('Om-LifeOS Unified Report', rows);
    onSuccess('Native Word (.docx) generated');
  };

  const handleExportExcel = async () => {
    const rows = await getUnifiedExportRows();
    exportToXlsx('Om-LifeOS Dataset', rows);
    onSuccess('Native Excel (.xlsx) generated');
  };

  const handleExportPdf = async () => {
    const rows = await getUnifiedExportRows();
    exportToPdf('Om-LifeOS Document Export', rows);
    onSuccess('Native PDF (.pdf) generated');
  };

  const handleExportCsv = async () => {
    const rows = await getUnifiedExportRows();
    exportToCsv('om-lifeos-records.csv', rows);
    onSuccess('CSV spreadsheet downloaded');
  };

  const handleExportCompleteHtml = async () => {
    try {
      await exportToCompleteHtml('Om-LifeOS-Complete');
      onSuccess('Complete standalone single-file HTML (.html) generated & downloaded');
    } catch (err: any) {
      onError(`HTML export failed: ${err.message}`);
    }
  };

  const handleRunIntegrityAudit = async () => {
    setIsAuditing(true);
    let totalChecked = 0;
    let issues = 0;
    let repaired = 0;

    try {
      const tasks = await storage.getAll<any>('tasks');
      const goals = await storage.getAll<any>('goals');
      const accounts = await storage.getAll<any>('financeAccounts');
      const finance = await storage.getAll<any>('finance');

      totalChecked += tasks.length + goals.length + accounts.length + finance.length;

      const goalIds = new Set(goals.map(g => g.id));
      for (const t of tasks) {
        if (t.goalId && !goalIds.has(t.goalId)) {
          issues++;
          t.goalId = null;
          await storage.put('tasks', t);
          repaired++;
        }
      }

      const acctIds = new Set(accounts.map(a => a.id));
      for (const f of finance) {
        if (f.accountId && !acctIds.has(f.accountId)) {
          issues++;
        }
      }

      setIntegrityStats({ checked: totalChecked, issues, repaired });
      onSuccess(`Integrity check: ${totalChecked} checked, ${issues} anomalies found, ${repaired} repaired`);
    } catch {
      onError('Integrity audit failed');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleResetData = () => {
    setIsResetConfirmOpen(true);
  };

  const handleConfirmReset = async () => {
    setIsResetConfirmOpen(false);
    await storage.clearAll();
    onSuccess('All data cleared. Reloading...');
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
          Settings, Storage & System Integrity
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Workspaces, multi-format client export, full atomic backup & restore, computer pairing, and storage telemetry.
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex p-1.5 gap-1.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/70 overflow-x-auto no-scrollbar shadow-2xs">
        {[
          {
            id: 'system',
            label: 'System & Appearance',
            icon: Palette,
            badge: null
          },
          {
            id: 'workspaces',
            label: 'Workspaces',
            icon: Users,
            badge: `${settings?.profiles?.length || 1}`
          },
          {
            id: 'exports',
            label: 'Data Exports & Snapshot',
            icon: Download,
            badge: null
          },
          {
            id: 'computer',
            label: 'Computer Folder Backup',
            icon: HardDrive,
            badge: folderMeta.isConnected ? 'Connected' : null
          }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-xl px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap tracking-normal transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white ring-1 ring-slate-200/60 dark:ring-slate-700/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 transition-colors ${
                isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
              }`} />
              <span className="leading-snug">{tab.label}</span>
              {tab.badge && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  tab.badge === 'Connected'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                    : isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}>
                  {tab.badge === 'Connected' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab: System & Appearance */}
      {activeTab === 'system' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Appearance Card (6 cols) */}
          <div className="lg:col-span-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
              <Palette className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Appearance & Theme</h2>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Color Mode</div>
                <div className="text-[11px] text-slate-400">Currently active: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</div>
              </div>
              <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs dark:border-slate-700 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={theme === 'dark' ? onToggleTheme : undefined}
                  className={`rounded-lg px-3 py-1 font-semibold transition-all ${
                    theme === 'light' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
                  }`}
                >
                  ☀ Light
                </button>
                <button
                  type="button"
                  onClick={theme === 'light' ? onToggleTheme : undefined}
                  className={`rounded-lg px-3 py-1 font-semibold transition-all ${
                    theme === 'dark' ? 'bg-slate-700 shadow-sm text-white' : 'text-slate-500'
                  }`}
                >
                  ☾ Dark
                </button>
              </div>
            </div>

            {/* Accent Theme Colors */}
            <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-900 dark:text-white">Accent Theme Highlight</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Customizes brand buttons and active focus indicators</div>
              <div className="mt-2.5 flex items-center gap-2.5">
                {[
                  { name: 'Indigo', hex: '#6366f1' },
                  { name: 'Emerald', hex: '#10b981' },
                  { name: 'Violet', hex: '#8b5cf6' },
                  { name: 'Amber', hex: '#f59e0b' },
                  { name: 'Rose', hex: '#f43f5e' },
                  { name: 'Sky', hex: '#0284c7' }
                ].map(acc => (
                  <button
                    key={acc.name}
                    type="button"
                    onClick={async () => {
                      setAccentColor(acc.hex);
                      document.documentElement.style.setProperty('--color-brand', acc.hex);
                      const appSettings = await storage.getSingleton<any>('appSettings') || {};
                      appSettings.accentColor = acc.hex;
                      await storage.setSingleton('appSettings', appSettings);
                      onSuccess(`${acc.name} theme accent applied`);
                      onRefresh();
                    }}
                    className="group flex flex-col items-center gap-1 cursor-pointer"
                    title={acc.name}
                  >
                    <span
                      className={`h-7 w-7 rounded-xl shadow-xs transition-transform group-hover:scale-110 flex items-center justify-center text-white text-[10px] ${
                        accentColor === acc.hex ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900 scale-105' : ''
                      }`}
                      style={{ backgroundColor: acc.hex }}
                    >
                      {accentColor === acc.hex ? '✓' : ''}
                    </span>
                    <span className="text-[10px] text-slate-400">{acc.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <div className="border-t border-slate-100 pt-4 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Browser Notifications</div>
                  <div className="text-[11px] text-slate-400">
                    Status: {typeof Notification !== 'undefined' ? Notification.permission : 'Unavailable'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRequestNotifications}
                  className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                  Enable Notifications
                </button>
              </div>
            </div>
          </div>

          {/* Storage Telemetry & Quota (6 cols) */}
          <div className="lg:col-span-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
              <Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Storage Health & Quota</h2>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">IndexedDB Quota Used</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {storageStats.percent.toFixed(2)}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${Math.min(100, Math.max(1, storageStats.percent))}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{(storageStats.usage / (1024 * 1024)).toFixed(1)} MB stored</span>
                <span>{(storageStats.quota / (1024 * 1024)).toFixed(0)} MB allocated</span>
              </div>
            </div>

            {/* Integrity Audit */}
            <div className="border-t border-slate-100 pt-4 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Data Integrity Audit</div>
                <div className="text-[10px] text-slate-400">
                  Checked {integrityStats.checked} references ({integrityStats.issues} issues, {integrityStats.repaired} repaired)
                </div>
              </div>
              <button
                type="button"
                disabled={isAuditing}
                onClick={handleRunIntegrityAudit}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
                <span>Run Audit</span>
              </button>
            </div>
          </div>

          {/* Windows Transparent Desktop Widget Card (12 cols) */}
          <div className="lg:col-span-12 rounded-3xl border border-purple-200 bg-linear-to-r from-purple-50/60 to-indigo-50/60 p-6 shadow-sm dark:border-purple-900/50 dark:from-purple-950/20 dark:to-indigo-950/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-600 text-white font-bold shadow-md shadow-purple-600/20">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Windows Transparent Desktop Widget</span>
                    <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950/80 dark:text-purple-300">
                      LIVE REALTIME SYNC
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Transparent acrylic widget pinned to desktop that connects directly with Om-LifeOS data
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('om_widget_active', 'true');
                    window.dispatchEvent(new Event('storage'));
                    onSuccess('✨ Transparent Floating Widget Activated on screen!');
                    onRefresh();
                  }}
                  className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-500 cursor-pointer"
                >
                  Activate On-Screen Widget
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.open(
                      `${window.location.origin}${window.location.pathname}?widget_mode=true`,
                      'OmLifeOSWidget',
                      'width=380,height=580,resizable=yes,scrollbars=no,status=no,toolbar=no'
                    );
                    onSuccess('Opened Transparent Widget in standalone popout window');
                  }}
                  className="rounded-xl border border-purple-300 bg-white px-3.5 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:bg-slate-800 dark:text-purple-300 cursor-pointer"
                >
                  Open Popout Window
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-purple-100 dark:border-purple-900/30">
                <div className="font-bold text-slate-900 dark:text-white">Full Transparency & Blur</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Opacity slider (20% to 100%) aur acrylic blur levels ke sath transparent glass look.
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-purple-100 dark:border-purple-900/30">
                <div className="font-bold text-slate-900 dark:text-white">Direct Live Data Connection</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Tasks, daily habits, Bikram Sambat date, notes aur finance automatic update hote hain.
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-purple-100 dark:border-purple-900/30">
                <div className="font-bold text-slate-900 dark:text-white">Windows & Web Ready</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Browser me floating draggable widget ya Tauri Windows app me borderless transparent window.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Workspaces */}
      {activeTab === 'workspaces' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
              Active Workspaces
            </h2>

            <div className="mt-4 space-y-2.5">
              {(settings?.profiles || []).map(p => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between rounded-2xl p-4 border transition-colors ${
                    p.id === settings?.profileId
                      ? 'border-indigo-500 bg-indigo-50/50 dark:border-indigo-500/50 dark:bg-indigo-950/40'
                      : 'border-slate-100 dark:border-slate-800'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{p.name}</div>
                    <div className="text-[10px] text-slate-400">Created {new Date(p.createdAt).toLocaleDateString()}</div>
                  </div>

                  {p.id === settings?.profileId ? (
                    <span className="rounded-full bg-indigo-600 px-3 py-0.5 text-[10px] font-semibold text-white">
                      Current
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSwitchProfile(p.id)}
                      className="rounded-xl border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                    >
                      Switch Workspace
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
              Create New Workspace
            </h2>
            <form onSubmit={handleCreateProfile} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Workspace Name</label>
                <input
                  type="text"
                  required
                  value={newProfileName}
                  onChange={e => setNewProfileName(e.target.value)}
                  placeholder="e.g. Venture Operations, Family"
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                + Create Workspace
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab: Backup & Multi-Format Exports */}
      {activeTab === 'exports' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Complete Standalone HTML Application */}
          <div className="lg:col-span-12 rounded-3xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 p-6 shadow-sm dark:border-indigo-900/60 dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 shrink-0">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Complete Standalone HTML App (.html)</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                      Single-File Offline
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Download this entire app as a single self-contained HTML file with all your live tasks, notes, journal, finances, and goals embedded. Opens directly in any browser on any phone or PC without internet or server.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleExportCompleteHtml}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 active:scale-98 transition-all cursor-pointer"
                  title="Export live user data into standalone single-file HTML"
                >
                  <Globe className="h-4 w-4" />
                  <span>Export Live Data HTML</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-400 pt-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Runs 100% offline on any device (double-click to open)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Embedded search, light/dark theme, interactive tasks</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>One-click full JSON backup & restorer built inside</span>
              </div>
            </div>
          </div>

          {/* Full Atomic Backup */}
          <div className="lg:col-span-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
              <Download className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Full Atomic Backup (.omlifeos)</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Export an encrypted, comprehensive snapshot of all 40+ IndexedDB stores including all tasks, notes, finances, and journal entries.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 active:scale-98"
              >
                <Download className="h-4 w-4" />
                <span>Export Snapshot</span>
              </button>

              <label className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer active:scale-98">
                <Upload className="h-4 w-4" />
                <span>Restore Backup</span>
                <input
                  type="file"
                  accept=".json,.omlifeos"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Multi-Format Exports */}
          <div className="lg:col-span-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
              Native Client-Side Documents
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleExportWord}
                className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-left transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800"
              >
                <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Word (.docx)</div>
                  <div className="text-[10px] text-slate-400">OpenXML document</div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-left transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Excel (.xlsx)</div>
                  <div className="text-[10px] text-slate-400">OpenXML spreadsheet</div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleExportPdf}
                className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-left transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800"
              >
                <FileText className="h-4 w-4 text-rose-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">PDF (.pdf)</div>
                  <div className="text-[10px] text-slate-400">Printable report</div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-left transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800"
              >
                <FileCode className="h-4 w-4 text-purple-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">CSV Spreadsheet</div>
                  <div className="text-[10px] text-slate-400">Universal tabular</div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleExportCompleteHtml}
                className="col-span-2 flex items-center gap-2.5 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-3.5 text-left transition-colors hover:bg-indigo-100/70 dark:border-indigo-800/80 dark:bg-indigo-950/40 cursor-pointer"
              >
                <Globe className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Standalone Web App (.html)</span>
                    <span className="text-[9px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 px-1.5 py-0.5 rounded-sm">Interactive Offline</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Single self-contained HTML file runnable in any browser</div>
                </div>
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="lg:col-span-12 rounded-3xl border border-red-200 bg-red-50/30 p-6 dark:border-red-950 dark:bg-red-950/10">
            <h2 className="text-sm font-bold text-rose-700 dark:text-rose-400">Danger Zone</h2>
            <p className="mt-1 text-xs text-rose-600/80 dark:text-rose-400/80">
              Clear all IndexedDB tables. All tasks, notes, finances and history will be permanently deleted.
            </p>
            <button
              type="button"
              onClick={handleResetData}
              className="mt-3 flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Reset Entire Database</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab: Connect to Computer & Folder Backup */}
      {activeTab === 'computer' && (
        <div className="space-y-6 max-w-4xl">
          {/* Section 1: Direct Computer Folder Backup */}
          <div className="rounded-3xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/40 via-white to-slate-50 p-6 shadow-sm dark:border-indigo-900/40 dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/30">
                  <HardDrive className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Direct Computer Folder Backup</span>
                    {folderMeta.isConnected ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        Not connected
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Connect your device backup directly to a folder on your computer. When you save, all files are saved automatically across organized domain subfolders.
                  </p>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {folderMeta.isConnected ? (
                  <>
                    <button
                      type="button"
                      disabled={isFolderSyncing}
                      onClick={handleRunFolderSync}
                      className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isFolderSyncing ? 'animate-spin' : ''}`} />
                      <span>{isFolderSyncing ? 'Saving Files...' : 'Sync All Files to Folder'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isFolderSyncing}
                      onClick={handleSelectComputerFolder}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Change Folder
                    </button>

                    <button
                      type="button"
                      disabled={isFolderSyncing}
                      onClick={handleDisconnectFolder}
                      className="rounded-xl border border-rose-200 px-2.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/40 cursor-pointer"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleSelectComputerFolder}
                    disabled={!isFolderApiSupported || isFolderSyncing}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-50 cursor-pointer"
                  >
                    <FolderCheck className="h-4 w-4" />
                    <span>Select Computer Folder</span>
                  </button>
                )}
              </div>
            </div>

            {/* Sync Progress Bar */}
            {isFolderSyncing && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  <span className="truncate pr-2">{folderSyncProgress}</span>
                  <span className="font-mono font-bold">{folderSyncPercent}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-200"
                    style={{ width: `${folderSyncPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Subfolders Architecture - Dropdown Menu inside Target Folder */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <ComputerSubfoldersViewer
                targetFolderName={folderMeta.folderName}
                isFolderConnected={folderMeta.isConnected}
                lastBackupAt={folderMeta.lastBackupAt}
                lastFileCount={folderMeta.lastFileCount}
                onSelectFolder={handleSelectComputerFolder}
              />
            </div>

            {/* Fallback ZIP */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-500">Need a single portable archive with all subfolders?</span>
              <button
                type="button"
                disabled={isFolderZipping || isFolderSyncing}
                onClick={handleDownloadZipPackage}
                className="flex items-center gap-1.5 font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{isFolderZipping ? 'Generating ZIP...' : 'Download as Multi-Folder .ZIP Package'}</span>
              </button>
            </div>
          </div>

          {/* Section 2: Peer Network Computer Pairing */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
              <Monitor className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Local Network Peer Pairing</h2>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Generate a one-time 6-digit peer pairing code to link this browser instance with another computer on your local network.
            </p>

            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center font-mono text-2xl font-extrabold tracking-widest text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                {pairCode || '— — — — — —'}
              </div>
              <button
                type="button"
                onClick={handleGeneratePairCode}
                className="rounded-xl bg-indigo-600 px-4 py-3 text-xs font-semibold text-white hover:bg-indigo-500 cursor-pointer"
              >
                Generate Code
              </button>
              {pairCode && (
                <button
                  type="button"
                  onClick={handleCopyPairCode}
                  className="rounded-xl border border-slate-200 p-3 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
                  title="Copy code"
                >
                  {copiedCode ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
              <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                Connection Status: {isConnected ? <span className="text-emerald-500">Connected</span> : <span className="text-slate-400">Offline</span>}
              </div>
              <button
                type="button"
                onClick={handleToggleComputerConnect}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  isConnected
                    ? 'border border-rose-300 text-rose-600 hover:bg-rose-50'
                    : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-700'
                }`}
              >
                {isConnected ? 'Disconnect' : 'Connect to Computer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DANGER RESET CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title="Reset Entire Database?"
        message="DANGER: This will permanently delete all tasks, notes, habits, routines, journals, and financial records from your local storage. This action cannot be undone."
        confirmText="Yes, Clear Everything"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};
