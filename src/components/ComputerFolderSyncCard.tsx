import React, { useState, useEffect } from 'react';
import {
  Folder, FolderCheck, HardDrive, RefreshCw, AlertCircle
} from 'lucide-react';
import {
  isFileSystemAccessSupported,
  getConnectedFolderInfo,
  connectComputerFolder,
  disconnectComputerFolder,
  syncAllFilesToComputerFolder,
  FolderSyncMeta
} from '../lib/computerFolderSync';

interface ComputerFolderSyncCardProps {
  onSuccess: (msg: string) => void;
  onError?: (msg: string) => void;
  className?: string;
  isEmbedded?: boolean;
}

export const ComputerFolderSyncCard: React.FC<ComputerFolderSyncCardProps> = ({
  onSuccess,
  onError,
  className = '',
  isEmbedded = false
}) => {
  const isSupported = isFileSystemAccessSupported();
  const [folderInfo, setFolderInfo] = useState<FolderSyncMeta>({
    isConnected: false,
    folderName: null,
    connectedAt: null,
    lastBackupAt: null,
    lastFileCount: null,
    autoSync: false,
    hasPermission: false
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  const loadInfo = async () => {
    try {
      const info = await getConnectedFolderInfo();
      setFolderInfo(info);
    } catch {}
  };

  useEffect(() => {
    loadInfo();
  }, []);

  const handleSelectFolder = async () => {
    try {
      const res = await connectComputerFolder();
      if (res.success) {
        onSuccess(`Connected to computer folder: "${res.folderName}"! Saving files now...`);
        await loadInfo();
        await executeSync();
      } else if (res.error && res.error !== 'Folder selection was cancelled.') {
        onError ? onError(res.error) : alert(res.error);
      }
    } catch (e: any) {
      onError ? onError(e.message) : alert(e.message);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectComputerFolder();
      await loadInfo();
      onSuccess('Disconnected computer backup folder.');
    } catch (e: any) {
      onError ? onError(e.message) : alert(e.message);
    }
  };

  const executeSync = async () => {
    setIsSyncing(true);
    setProgressPercent(0);
    setProgressMsg('Removing subfolders & saving to main folder...');

    try {
      const res = await syncAllFilesToComputerFolder((msg, current, total) => {
        setProgressMsg(msg);
        setProgressPercent(Math.round((current / total) * 100));
      });

      if (res.success) {
        onSuccess(`✓ Saved ${res.fileCount} files directly in "${res.folderName}" (0 subfolders).`);
        await loadInfo();
      } else {
        if (res.error) {
          onError ? onError(res.error) : alert(res.error);
        }
      }
    } catch (err: any) {
      onError ? onError(err.message) : alert(err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const content = (
    <div className="space-y-3">
      {/* Title & Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Direct Computer Folder Backup
          </h3>
        </div>
        {folderInfo.isConnected ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Connected
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            Not connected
          </span>
        )}
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        Save all personal sovereign records directly into your chosen computer folder with zero subfolders.
      </p>

      {/* Browser Support Warning if needed */}
      {!isSupported && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-2.5 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <span>Direct folder sync requires Chrome, Edge, Brave, or Opera on desktop.</span>
        </div>
      )}

      {/* Compact Folder Controller Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 rounded-2xl bg-slate-50/90 p-3 border border-slate-200/80 dark:bg-slate-800/50 dark:border-slate-700/60">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Folder className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            <span className="font-mono text-xs font-bold text-slate-900 dark:text-white truncate">
              {folderInfo.folderName || 'No folder selected'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
            {folderInfo.lastBackupAt
              ? `Last synced: ${new Date(folderInfo.lastBackupAt).toLocaleString()} (${folderInfo.lastFileCount || 0} files)`
              : '0 subfolders • Direct root storage'}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          {folderInfo.isConnected ? (
            <>
              <button
                type="button"
                disabled={isSyncing}
                onClick={executeSync}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Saving...' : 'Sync Now'}</span>
              </button>
              <button
                type="button"
                disabled={isSyncing}
                onClick={handleSelectFolder}
                className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                title="Select a different main folder on your computer"
              >
                Change
              </button>
              <button
                type="button"
                disabled={isSyncing}
                onClick={handleDisconnect}
                className="rounded-xl border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
                title="Disconnect folder"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleSelectFolder}
              disabled={!isSupported || isSyncing}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              <FolderCheck className="h-4 w-4" />
              <span>Select Computer Folder</span>
            </button>
          )}
        </div>
      </div>

      {/* Sync Progress Bar */}
      {isSyncing && (
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
            <span className="truncate pr-2">{progressMsg}</span>
            <span className="font-mono font-bold">{progressPercent}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );

  if (isEmbedded) {
    return <div className={className}>{content}</div>;
  }

  return (
    <div className={`rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      {content}
    </div>
  );
};
