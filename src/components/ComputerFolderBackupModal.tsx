import React from 'react';
import { X } from 'lucide-react';
import { ComputerFolderSyncCard } from './ComputerFolderSyncCard';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 relative"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <ComputerFolderSyncCard
          onSuccess={onSuccess}
          onError={onError}
          className="border-0 p-0 shadow-none dark:bg-transparent"
        />
      </div>
    </div>
  );
};
