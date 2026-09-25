import React, { useState, useEffect } from 'react';
import { Search, Plus, Zap, Moon, Sun, Users, Calendar, ChevronDown, Check, Clock, HardDrive, FolderCheck, Globe, Download } from 'lucide-react';
import { NavModule, UserProfile } from '../types';
import { adToBs, getTodayIso } from '../lib/nepaliDate';

interface HeaderProps {
  activeModule: NavModule;
  onNavigate: (module: NavModule) => void;
  onOpenQuickCapture: (initialType?: string) => void;
  onOpenSearch: () => void;
  onOpenBsModal: () => void;
  onOpenMultiUser: () => void;
  onOpenComputerBackup?: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  profiles: UserProfile[];
  currentProfileId: string;
  onSelectProfile: (id: string) => void;
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigate,
  onOpenQuickCapture,
  onOpenSearch,
  onOpenBsModal,
  onOpenMultiUser,
  onOpenComputerBackup,
  theme,
  onToggleTheme,
  profiles,
  currentProfileId,
  onSelectProfile,
  onOpenMobileMenu,
}) => {
  const [bsDateText, setBsDateText] = useState({ bs: 'BS —', ad: 'AD —' });
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [is24Hour, setIs24Hour] = useState(false);

  // Live Clock interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      const todayIso = getTodayIso();
      const bs = adToBs(todayIso);
      setBsDateText({
        bs: `BS ${bs.formattedNe}`,
        ad: `AD ${todayIso}`
      });
    } catch {
      setBsDateText({ bs: 'BS Calendar', ad: 'AD Date' });
    }
  }, []);

  const currentProfile = profiles.find(p => p.id === currentProfileId) || profiles[0];

  const formattedTimeFull = currentTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: !is24Hour
  });

  const formattedTimeCompact = currentTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: !is24Hour
  });

  const dayOfWeek = currentTime.toLocaleDateString('en-US', { weekday: 'short' });
  const monthDay = currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-2.5 sm:px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 transition-colors">
      {/* Zone 1: Mobile Hamburger + Brand Wordmark */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
          aria-label="Open Navigation Menu"
        >
          <span className="text-lg leading-none">☰</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-1.5 sm:gap-2 text-left focus:outline-none group"
        >
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-indigo-600 font-serif font-bold text-white shadow-sm shadow-indigo-500/20 group-hover:scale-105 transition-transform text-sm sm:text-base shrink-0">
            ॐ
          </div>
          <span className="text-xs sm:text-base font-bold tracking-tight text-slate-900 dark:text-white truncate max-w-[80px] xs:max-w-none sm:max-w-none">
            Om-LifeOS
          </span>
        </button>
      </div>

      {/* Zone 2: Search Bar + Nepali BS Widget (Tablet & Desktop) */}
      <div className="hidden md:flex flex-1 items-center justify-center gap-1.5 sm:gap-2 px-2 max-w-md min-w-0">
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex h-8 sm:h-9 w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 sm:px-3 text-xs text-slate-500 transition-colors hover:border-indigo-400 hover:bg-white dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:border-indigo-500 dark:hover:bg-slate-800 min-w-0"
          aria-label="Global Search"
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="truncate">Search notes, tasks, finance...</span>
          <kbd className="ml-auto hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:border-slate-700 dark:bg-slate-900 md:inline-block">
            ⌘K
          </kbd>
        </button>

        {/* Nepal Bikram Sambat Date Widget */}
        <button
          type="button"
          onClick={onOpenBsModal}
          className="hidden lg:flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1 text-left transition-colors hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/30 shrink-0"
          title="Nepal Bikram Sambat date. Click for BS ↔ AD converter."
        >
          <Calendar className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="font-mono text-[11px] font-semibold tracking-tight text-slate-900 dark:text-slate-200 truncate">
              {bsDateText.bs}
            </span>
            <span className="font-mono text-[9px] text-slate-500 dark:text-slate-400 truncate">
              {bsDateText.ad}
            </span>
          </div>
        </button>

        {/* Live Digital Clock Widget (Desktop & Tablet) */}
        <button
          type="button"
          onClick={() => setIs24Hour(prev => !prev)}
          className="hidden md:flex items-center gap-2 rounded-xl border border-slate-200/90 bg-slate-50/70 px-2.5 py-1 text-left transition-colors hover:border-indigo-400 hover:bg-white dark:border-slate-800 dark:bg-slate-800/60 dark:hover:border-indigo-500 shrink-0 cursor-pointer shadow-2xs group"
          title="Live System Clock (Click to toggle 12h/24h format)"
        >
          <div className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <Clock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:scale-105 transition-transform" />
          <div className="flex flex-col min-w-0">
            <span className="font-mono text-xs font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
              {formattedTimeFull}
            </span>
            <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500 truncate">
              {dayOfWeek}, {monthDay}
            </span>
          </div>
        </button>
      </div>

      {/* Zone 3: Actions + Theme + Profile Switcher */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Mobile Search Button (Compact icon, prevents flex collision) */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-white dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 shrink-0 cursor-pointer"
          aria-label="Search"
          title="Search (⌘K)"
        >
          <Search className="h-3.5 w-3.5" />
        </button>

        {/* Live Clock Widget (Mobile Compact) */}
        <button
          type="button"
          onClick={() => setIs24Hour(prev => !prev)}
          className="flex md:hidden items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50/90 px-2 py-1 text-slate-800 dark:border-slate-800 dark:bg-slate-800/90 dark:text-slate-200 shrink-0 cursor-pointer font-mono text-[11px] font-bold tabular-nums"
          title="Live Clock (Tap to toggle format)"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0"></span>
          <Clock className="h-3 w-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>{formattedTimeCompact}</span>
        </button>

        {/* Quick Capture Button */}
        <button
          type="button"
          onClick={() => onOpenQuickCapture()}
          className="flex h-8 sm:h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-2.5 sm:px-3 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 transition-transform active:scale-95 hover:bg-indigo-500"
          title="Quick Capture (Tasks, Notes, Finance)"
        >
          <Plus className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Capture</span>
        </button>

        {/* Quick Command Menu Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsActionsOpen(!isActionsOpen)}
            className="flex h-8 sm:h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 sm:px-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            aria-label="Quick Actions"
            title="Fast Action Shortcuts"
          >
            <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span className="hidden md:inline">Actions</span>
            <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
          </button>

          {isActionsOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsActionsOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-1.5 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95">
                <button
                  type="button"
                  onClick={() => { onOpenQuickCapture('task'); setIsActionsOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <span className="text-emerald-500">✓</span> Add New Task
                </button>
                <button
                  type="button"
                  onClick={() => { onOpenQuickCapture('note'); setIsActionsOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <span className="text-amber-500">📝</span> Quick Note
                </button>
                <button
                  type="button"
                  onClick={() => { onOpenQuickCapture('expense'); setIsActionsOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <span className="text-emerald-500">💰</span> Log Expense
                </button>
                <button
                  type="button"
                  onClick={() => { onNavigate('focus'); setIsActionsOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <span className="text-indigo-500">⏱</span> Start Focus Block
                </button>
                <button
                  type="button"
                  onClick={() => { onOpenBsModal(); setIsActionsOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <span>🇳🇵</span> Bikram Sambat Date
                </button>
                <button
                  type="button"
                  onClick={() => { onOpenMultiUser(); setIsActionsOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <span>👥</span> Multi-User & Pairing
                </button>
                {onOpenComputerBackup && (
                  <button
                    type="button"
                    onClick={() => { onOpenComputerBackup(); setIsActionsOpen(false); }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
                  >
                    <HardDrive className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Computer Folder Backup</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Quick Computer Backup Button (Tablet/Desktop) */}
        {onOpenComputerBackup && (
          <button
            type="button"
            onClick={onOpenComputerBackup}
            className="hidden md:flex h-8 sm:h-9 items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 px-2 sm:px-2.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60 transition-colors"
            title="Connect & Save to Computer Folder"
          >
            <HardDrive className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="hidden xl:inline">Computer Backup</span>
          </button>
        )}

        {/* Multi-User Workspace Selector (Desktop) */}
        <div className="relative hidden lg:block">
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex h-8 sm:h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
            title="Switch Workspace Profile"
          >
            <Users className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            <span className="max-w-[75px] truncate">{currentProfile?.name || 'Workspace'}</span>
            <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
          </button>

          {isProfileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-1.5 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Workspace
                  </span>
                  <button
                    type="button"
                    onClick={() => { onOpenMultiUser(); setIsProfileOpen(false); }}
                    className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    View All
                  </button>
                </div>
                {profiles.map(prof => (
                  <button
                    key={prof.id}
                    type="button"
                    onClick={() => { onSelectProfile(prof.id); setIsProfileOpen(false); }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                      prof.id === currentProfileId
                        ? 'bg-indigo-50 font-semibold text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{prof.name}</span>
                    {prof.id === currentProfileId && <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                  </button>
                ))}
                <div className="mt-1.5 border-t border-slate-100 pt-1.5 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => { onOpenMultiUser(); setIsProfileOpen(false); }}
                    className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-indigo-600 font-semibold hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/30"
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>Multi-User Profiles & Pairing</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Multi-User Icon on Mobile / Tablet */}
        <button
          type="button"
          onClick={onOpenMultiUser}
          className="flex lg:hidden h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 shrink-0"
          title="Multi-User Profiles & Multi-Device Pairing"
          aria-label="Multi-User Profiles"
        >
          <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        </button>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 shrink-0"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle Dark/Light Mode"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
        </button>
      </div>
    </header>
  );
};

