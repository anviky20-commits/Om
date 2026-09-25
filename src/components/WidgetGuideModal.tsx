import React, { useState } from 'react';
import {
  X, Layers, Monitor, Sliders, ExternalLink,
  CheckCircle2, Sparkles, Copy, Check, Download,
  AppWindow, Smartphone
} from 'lucide-react';

interface WidgetGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchWidget: () => void;
  onLaunchPopupWidget: () => void;
}

export const WidgetGuideModal: React.FC<WidgetGuideModalProps> = ({
  isOpen,
  onClose,
  onLaunchWidget,
  onLaunchPopupWidget,
}) => {
  const [copiedScript, setCopiedScript] = useState(false);

  if (!isOpen) return null;

  const tauriConfigSnippet = `{
  "app": {
    "windows": [
      {
        "label": "widget",
        "title": "Om-LifeOS Widget",
        "url": "/?view=widget",
        "width": 380,
        "height": 580,
        "transparent": true,
        "decorations": false,
        "alwaysOnTop": true,
        "shadow": false
      }
    ]
  }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Windows Transparent Desktop Widget (विंडोज विजेट)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Om-LifeOS se connected live transparent desktop widget
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {/* Section 1: Live In-App Transparent Floating Widget */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span className="font-bold text-indigo-950 dark:text-indigo-200 text-sm">
                  1. Instant Transparent Floating Widget
                </span>
              </div>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                Live & Ready
              </span>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-600 dark:text-slate-300">
              Aap turant transparent floating widget ko screen par activate kar sakte hain. Yeh real-time me aapke tasks, habits, BS/AD date, notes aur finance se connected rehta hai. Isme aap <strong>transparency opacity slider</strong> aur <strong>acrylic blur</strong> ko adjust kar sakte hain.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  onLaunchWidget();
                  onClose();
                }}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors cursor-pointer"
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Screen par Widget On karein</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onLaunchPopupWidget();
                }}
                className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:bg-slate-800 dark:text-indigo-300 transition-colors cursor-pointer"
              >
                <AppWindow className="h-3.5 w-3.5" />
                <span>Separate Popout Window me kholein</span>
              </button>
            </div>
          </div>

          {/* Section 2: Windows Native Desktop Widget (Tauri / Windows Setup) */}
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                2. Windows Native Transparent Widget (Tauri Desktop App)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Jab aap is project ko Tauri Windows desktop `.exe` ya `.msi` me build karenge, toh yeh transparent window ke taur par desktop screen par pinned rahega aur transparent background ke sath bina border ke chalega:
            </p>

            <div className="relative rounded-lg bg-slate-900 p-3 font-mono text-[11px] text-slate-200">
              <pre className="overflow-x-auto">{tauriConfigSnippet}</pre>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(tauriConfigSnippet);
                  setCopiedScript(true);
                  setTimeout(() => setCopiedScript(false), 2000);
                }}
                className="absolute top-2 right-2 flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-300 hover:bg-slate-700 cursor-pointer"
              >
                {copiedScript ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copiedScript ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="font-semibold text-slate-800 dark:text-slate-200">Transparent: true</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Desktop wallpaper ke upar glass effect deta hai</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="font-semibold text-slate-800 dark:text-slate-200">Decorations: false</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Title bar aur borders hatakar clean widget banata hai</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="font-semibold text-slate-800 dark:text-slate-200">AlwaysOnTop: true</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Hamesha screen ke samne ya desktop par pinned rehta hai</div>
              </div>
            </div>
          </div>

          {/* Section 3: Live Sync Mechanism */}
          <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Real-Time Live Data Sync</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Yeh widget directly aapke IndexedDB storage aur BroadcastChannel se synced hai. Jaise hi aap app me koi task complete karenge ya new entry add karenge, widget instant update ho jayega bina page refresh kiye!
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onLaunchWidget();
              onClose();
            }}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 cursor-pointer"
          >
            Activate Widget Now
          </button>
        </div>
      </div>
    </div>
  );
};
