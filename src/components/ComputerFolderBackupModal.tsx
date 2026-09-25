import React, { useState, useEffect } from 'react';
import {
  Folder, FolderCheck, HardDrive, RefreshCw, Download, Check, AlertCircle,
  X, ShieldCheck, ArrowRight, FileText, CheckCircle2, ChevronRight,
  ExternalLink, Layers, Sparkles, Database
} from 'lucide-react';
import {
  isFileSystemAccessSupported,
  getConnectedFolderInfo,
  connectComputerFolder,
  disconnectComputerFolder,
  syncAllFilesToComputerFolder,
  exportAllFilesAsZip,
  FolderSyncMeta
} from '../lib/computerFolderSync';
import { ComputerSubfoldersViewer } from './ComputerSubfoldersViewer';

interface ComputerFolderBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError?: (msg: string) => void;
}

export const ComputerFolderBackupModal: React.FC<ComputerFolderBackupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError
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
  const [lastSyncResult, setLastSyncResult] = useState<{
    success: boolean;
    fileCount: number;
    subfolders: string[];
    folderName: string;
  } | null>(null);

  const [isZipping, setIsZipping] = useState(false);

  const loadInfo = async () => {
    const info = await getConnectedFolderInfo();
    setFolderInfo(info);
  };

  useEffect(() => {
    if (isOpen) {
      loadInfo();
      setLastSyncResult(null);
      setProgressMsg('');
      setProgressPercent(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle first time or manual selection of folder
  const handleSelectFolder = async () => {
    try {
      const res = await connectComputerFolder();
      if (res.success) {
        onSuccess(`Connected to computer folder: "${res.folderName}"! Saving all domain subfolders now...`);
        await loadInfo();
        // Immediately trigger sync so all 12 subfolders and files are created right away!
        await executeSync();
      } else if (res.error && res.error !== 'Folder selection was cancelled.') {
        onError ? onError(res.error) : alert(res.error);
      }
    } catch (e: any) {
      onError ? onError(e.message) : alert(e.message);
    }
  };

  const handleDisconnect = async () => {
    await disconnectComputerFolder();
    await loadInfo();
    setLastSyncResult(null);
    onSuccess('Disconnected computer backup folder.');
  };

  const executeSync = async () => {
    setIsSyncing(true);
    setProgressPercent(0);
    setProgressMsg('Initializing direct folder backup...');

    try {
      const res = await syncAllFilesToComputerFolder((msg, current, total) => {
        setProgressMsg(msg);
        setProgressPercent(Math.round((current / total) * 100));
      });

      if (res.success) {
        setLastSyncResult(res);
        onSuccess(`✓ Saved ${res.fileCount} files into "${res.folderName}" across ${res.subfolders.length} subfolders.`);
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

  const handleRunSync = async () => {
    await executeSync();
  };

  const handleDownloadZipFallback = async () => {
    setIsZipping(true);
    try {
      const blob = await exportAllFilesAsZip((msg, current) => {
        setProgressMsg(msg);
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Om-LifeOS-MultiFolder-Backup-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      onSuccess('Complete multi-folder backup package (.zip) downloaded.');
    } catch (e: any) {
      onError ? onError(e.message) : alert(e.message);
    } finally {
      setIsZipping(false);
      setProgressMsg('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Direct Computer Folder Backup</span>
                {folderInfo.isConnected ? (
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
                Connect once to a local computer folder. Subsequent backups save automatically into categorized domain subfolders.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Browser Support Check */}
        {!isSupported && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <div className="font-bold">Direct File System Access is Not Supported in this Browser</div>
                <div className="mt-1 leading-relaxed text-amber-700 dark:text-amber-300">
                  Chrome, Microsoft Edge, Brave, and Opera desktop browsers support direct hard-drive folder synchronization. You can still download the entire categorized subfolder structure as a ZIP archive below!
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Status & Controls Card */}
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Connected Target Folder
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Folder className="h-4 w-4 text-indigo-500 shrink-0" />
                  <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                    {folderInfo.folderName || 'No folder selected'}
                  </span>
                </div>
                {folderInfo.lastBackupAt ? (
                  <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Last backup: {new Date(folderInfo.lastBackupAt).toLocaleString()} ({folderInfo.lastFileCount || 0} files written)
                  </div>
                ) : (
                  <div className="mt-1 text-[11px] text-slate-400">
                    No backup completed yet for this folder.
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {folderInfo.isConnected ? (
                  <>
                    <button
                      type="button"
                      disabled={isSyncing}
                      onClick={handleRunSync}
                      className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Saving Files...' : 'Sync All Files to Folder'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSyncing}
                      onClick={handleSelectFolder}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                      title="Select a different computer folder"
                    >
                      Change Folder
                    </button>

                    <button
                      type="button"
                      disabled={isSyncing}
                      onClick={handleDisconnect}
                      className="rounded-xl border border-rose-200 px-2.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/40 cursor-pointer"
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
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-50 cursor-pointer"
                  >
                    <FolderCheck className="h-4 w-4" />
                    <span>Select Computer Folder</span>
                  </button>
                )}
              </div>
            </div>

            {/* Sync Progress Indicator */}
            {isSyncing && (
              <div className="mt-3 space-y-2 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                <div className="flex justify-between text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  <span className="truncate pr-2">{progressMsg}</span>
                  <span className="font-mono font-bold">{progressPercent}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-200"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Sync Completed Result Banner */}
            {lastSyncResult && !isSyncing && (
              <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 border border-emerald-200/60 dark:border-emerald-800/40">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Backup Successful!</span>
                </div>
                <div className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-300">
                  Written {lastSyncResult.fileCount} files into "{lastSyncResult.folderName}" across {lastSyncResult.subfolders.length} subfolders.
                </div>
              </div>
            )}
            {/* Subfolders Dropdown Menu inside Target Folder */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <ComputerSubfoldersViewer
                targetFolderName={folderInfo.folderName}
                isFolderConnected={folderInfo.isConnected}
                hideTargetHeader={true}
              />
            </div>
          </div>

          {/* Portable Zip Package Fallback */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Want a single portable file with all subfolders?
            </div>
            <button
              type="button"
              disabled={isZipping || isSyncing}
              onClick={handleDownloadZipFallback}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
            >
              <Download className={`h-3.5 w-3.5 ${isZipping ? 'animate-bounce' : ''}`} />
              <span>{isZipping ? 'Creating ZIP...' : 'Download as Multi-Folder .ZIP'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
