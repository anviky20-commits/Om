import React, { useRef } from 'react';
import { Paperclip, File, X, Download, FileText } from 'lucide-react';

export interface StoredAttachmentMeta {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl?: string; // base64 or blob URL for images & downloads
}

interface AttachmentUploaderProps {
  attachments: StoredAttachmentMeta[];
  onChange: (attachments: StoredAttachmentMeta[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  className?: string;
  label?: string;
}

export const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({
  attachments,
  onChange,
  maxFiles = 5,
  maxSizeMB = 10,
  className = '',
  label = 'Attach Files (Images, PDF, Docs)'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: StoredAttachmentMeta[] = [...attachments];

    for (let i = 0; i < files.length; i++) {
      if (newItems.length >= maxFiles) break;
      const file = files[i];

      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`File "${file.name}" exceeds the ${maxSizeMB}MB limit.`);
        continue;
      }

      // Convert to base64 DataURL for offline persistent storage in note/journal
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

      newItems.push({
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl,
      });
    }

    onChange(newItems);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(attachments.filter(a => a.id !== id));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Paperclip className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate">
            {label}
          </span>
          <span className="text-[10px] text-slate-400 font-medium shrink-0">
            ({attachments.length}/{maxFiles})
          </span>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={attachments.length >= maxFiles}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-indigo-300 disabled:opacity-50 cursor-pointer transition-colors shrink-0 shadow-2xs whitespace-nowrap"
        >
          <Paperclip className="h-3 w-3 text-indigo-500" />
          <span>Attach File</span>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.zip"
      />

      {/* Attachment previews / badge pills */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {attachments.map(att => {
            const isImg = att.type.startsWith('image/') && att.dataUrl;
            return (
              <div
                key={att.id}
                className="group relative flex items-center gap-2 rounded-xl border border-slate-200/90 bg-slate-50/80 p-1.5 pr-2 text-xs dark:border-slate-800 dark:bg-slate-800/80 max-w-xs transition-colors"
              >
                {isImg ? (
                  <img
                    src={att.dataUrl}
                    alt={att.name}
                    className="h-8 w-8 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] truncate max-w-[130px]">
                    {att.name}
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">
                    {formatFileSize(att.size)}
                  </div>
                </div>

                {att.dataUrl && (
                  <a
                    href={att.dataUrl}
                    download={att.name}
                    onClick={e => e.stopPropagation()}
                    title="Download attached file"
                    className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <Download className="h-3 w-3" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={e => handleRemove(att.id, e)}
                  title="Remove attachment"
                  className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const AttachmentViewer: React.FC<{
  attachments?: (string | StoredAttachmentMeta)[];
  className?: string;
  compact?: boolean;
}> = ({ attachments, className = '', compact = false }) => {
  if (!attachments || attachments.length === 0) return null;

  const parsedAttachments: StoredAttachmentMeta[] = attachments
    .map(att => {
      if (typeof att === 'string') {
        try {
          return JSON.parse(att);
        } catch {
          return { id: att, name: att, type: 'file', size: 0 };
        }
      }
      return att;
    })
    .filter(Boolean);

  if (parsedAttachments.length === 0) return null;

  if (compact) {
    return (
      <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
          <Paperclip className="h-3 w-3 text-indigo-500" />
          <span>{parsedAttachments.length} {parsedAttachments.length === 1 ? 'file' : 'files'}:</span>
        </span>
        {parsedAttachments.map(att => {
          const isImg = att.type?.startsWith('image/') && att.dataUrl;
          return (
            <span
              key={att.id}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white/80 px-2 py-0.5 text-[10px] font-medium text-slate-700 shadow-2xs dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-200 max-w-[150px]"
            >
              {isImg ? (
                <img
                  src={att.dataUrl}
                  alt={att.name}
                  className="h-3.5 w-3.5 rounded object-cover shrink-0"
                />
              ) : (
                <FileText className="h-3 w-3 text-indigo-500 shrink-0" />
              )}
              <span className="truncate">{att.name}</span>
              {att.dataUrl && (
                <a
                  href={att.dataUrl}
                  download={att.name}
                  onClick={e => e.stopPropagation()}
                  title={`Download ${att.name}`}
                  className="p-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                >
                  <Download className="h-2.5 w-2.5" />
                </a>
              )}
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
        <Paperclip className="h-3 w-3 text-indigo-500" />
        <span>Attached Files ({parsedAttachments.length})</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {parsedAttachments.map(att => {
          const isImg = att.type?.startsWith('image/') && att.dataUrl;
          return (
            <div
              key={att.id}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 pr-2.5 text-xs shadow-2xs dark:border-slate-800 dark:bg-slate-800"
            >
              {isImg ? (
                <a
                  href={att.dataUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block shrink-0"
                  onClick={e => e.stopPropagation()}
                >
                  <img
                    src={att.dataUrl}
                    alt={att.name}
                    className="h-8 w-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 hover:opacity-90 transition-opacity"
                  />
                </a>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
              )}

              <div className="min-w-0 pr-1">
                <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] truncate max-w-[130px]">
                  {att.name}
                </div>
                {att.size > 0 && (
                  <div className="text-[9px] text-slate-400 font-mono">
                    {att.size < 1024 * 1024
                      ? `${(att.size / 1024).toFixed(0)} KB`
                      : `${(att.size / (1024 * 1024)).toFixed(1)} MB`}
                  </div>
                )}
              </div>

              {att.dataUrl && (
                <a
                  href={att.dataUrl}
                  download={att.name}
                  onClick={e => e.stopPropagation()}
                  title={`Download ${att.name}`}
                  className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
