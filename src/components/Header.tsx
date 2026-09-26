import React, { useState, useEffect } from 'react';
import { Search, Plus, Zap, Moon, Sun, Users, Calendar, ChevronDown, Check, Clock, HardDrive } from 'lucide-react';
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
  const [bsDateInfo, setBsDateInfo] = useState({
    bsIso: '2083-06-09',
    bsEn: '2083 Ashwin 9',
    bsMonth: 'Ashwin',
    adIso: '2026-09-25'
  });
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

  // Compute BS and AD dates
  useEffect(() => {
    try {
      const todayIso = getTodayIso();
      const bs = adToBs(todayIso);
      setBsDateInfo({
        bsIso: bs.iso,
        bsEn: bs.formattedEn,
        bsMonth: bs.monthNameEn,
        adIso: todayIso
      });
    } catch {
      const todayIso = getTodayIso();
      setBsDateInfo({
        bsIso: '2083-06-09',
        bsEn: '2083 Ashwin 9',
        bsMonth: 'Ashwin',
        adIso: todayIso
      });
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

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-2 sm:px-4 lg:px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 transition-colors gap-1 sm:gap-2">
      {/* Zone 1: Left - Brand Identity & Nepali BS / Gregorian AD Date (Date is placed where search was) */}
      <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 shrink-0 select-none">
        {/* Mobile Hamburger Drawer Trigger */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden cursor-pointer shrink-0 transition-colors"
          aria-label="Open Navigation Menu"
        >
          <span className="text-lg leading-none">☰</span>
        </button>

        {/* Brand Logo & Wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-1.5 sm:gap-2 text-left focus:outline-none group cursor-pointer shrink-0"
          title="Om-LifeOS Dashboard"
        >
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-indigo-600 font-serif font-bold text-white shadow-sm shadow-indigo-500/20 group-hover:scale-105 transition-transform text-sm sm:text-base shrink-0">
            ॐ
          </div>
          <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 hidden min-[540px]:inline">
            Om-LifeOS
          </span>
        </button>

        {/* Date Display (Desktop & Tablet: Full or Semi-full Ribbon) */}
        <button
          type="button"
          onClick={onOpenBsModal}
          className="hidden sm:inline-flex items-center gap-1.5 lg:gap-2 rounded-xl border border-slate-200/90 bg-slate-50/90 px-2 lg:px-3 py-1.5 transition-all hover:border-indigo-400 hover:bg-white dark:border-slate-800 dark:bg-slate-800/80 dark:hover:border-indigo-500 dark:hover:bg-slate-800 shrink-0 cursor-pointer shadow-2xs group h-9"
          title={`Nepal Bikram Sambat: ${bsDateInfo.bsIso} | Gregorian: ${bsDateInfo.adIso}. Click for converter.`}
          aria-label="Nepal Bikram Sambat and Gregorian AD Calendar Converter"
        >
          <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:scale-105 transition-transform" />
          <div className="flex items-center gap-1 lg:gap-2 font-mono text-xs sm:text-[13px] font-semibold tracking-tight whitespace-nowrap">
            <span className="inline-flex items-center gap-1 text-indigo-700 dark:text-indigo-300">
              <span className="rounded bg-indigo-100/90 dark:bg-indigo-950/80 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-indigo-700 dark:text-indigo-300 tracking-wide uppercase">
                BS
              </span>
              <span className="text-slate-900 dark:text-slate-100 font-bold">
                {bsDateInfo.bsIso}
              </span>
              {bsDateInfo.bsMonth && (
                <span className="hidden 2xl:inline text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  ({bsDateInfo.bsMonth})
                </span>
              )}
            </span>
            <span className="text-slate-300 dark:text-slate-600 select-none font-normal hidden xl:inline">|</span>
            <span className="hidden xl:inline-flex items-center gap-1 text-slate-700 dark:text-slate-300">
              <span className="rounded bg-slate-200/80 dark:bg-slate-700/80 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase">
                AD
              </span>
              <span className="text-slate-700 dark:text-slate-200 font-semibold">
                {bsDateInfo.adIso}
              </span>
            </span>
          </div>
        </button>

        {/* Date Display (Mobile: Compact Badge) */}
        <button
          type="button"
          onClick={onOpenBsModal}
          className="inline-flex sm:hidden items-center gap-1 rounded-xl border border-slate-200/90 bg-slate-50/80 px-1.5 text-slate-700 transition-all hover:border-indigo-400 hover:bg-white dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-200 cursor-pointer shadow-2xs shrink-0 h-9"
          title={`Nepal BS: ${bsDateInfo.bsIso} | AD: ${bsDateInfo.adIso} (Click to open converter)`}
          aria-label="Nepal Bikram Sambat Date Converter"
        >
          <Calendar className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="rounded bg-indigo-100/90 dark:bg-indigo-950/80 px-1 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase leading-none">
            BS
          </span>
          <span className="font-mono text-[10px] font-semibold text-slate-800 dark:text-slate-200 hidden min-[400px]:inline">
            {bsDateInfo.bsIso.slice(5)}
          </span>
        </button>
      </div>

      {/* Zone 2: Middle - Centered Search Bar (Big on Desktop, Proportional on Tablet, Sleek on Mobile) */}
      <div className="flex flex-1 items-center justify-center min-w-0 px-1 sm:px-3 lg:px-6">
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex h-9 w-full max-w-[190px] xs:max-w-[230px] sm:max-w-xs md:max-w-sm lg:max-w-md xl:max-w-xl items-center gap-2 rounded-xl border border-slate-200/90 bg-slate-50/80 px-2.5 sm:px-3 text-xs sm:text-sm text-slate-500 transition-all hover:border-indigo-400 hover:bg-white dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:border-indigo-500 dark:hover:bg-slate-800 cursor-pointer shadow-2xs group shrink"
          aria-label="Global Search (Press to search)"
          title="Global Search (⌘K / Ctrl+K)"
        >
          <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-slate-400 group-hover:text-indigo-500 transition-colors" />
          <span className="truncate hidden xl:inline">Search notes, tasks, finance, goals...</span>
          <span className="truncate hidden sm:inline xl:hidden">Search notes, tasks...</span>
          <span className="truncate sm:hidden">Search...</span>
          <kbd className="ml-auto hidden md:inline-flex items-center gap-0.5 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 dark:border-slate-700 dark:bg-slate-900 shrink-0">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Zone 3: Right - Consolidated Action Strip (Clock, Quick Capture, Fast Actions, Theme) */}
      <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 shrink-0 select-none">
        {/* Live Digital Clock Widget */}
        <button
          type="button"
          onClick={() => setIs24Hour(prev => !prev)}
          className="flex h-9 items-center gap-1.5 sm:gap-2 rounded-xl border border-slate-200/90 bg-slate-50/80 px-1.5 sm:px-2.5 text-left transition-all hover:border-indigo-400 hover:bg-white dark:border-slate-800 dark:bg-slate-800/80 dark:hover:border-indigo-500 dark:hover:bg-slate-800 shrink-0 cursor-pointer shadow-2xs group"
          title="Live System Clock (Click to toggle 12h/24h format)"
          aria-label="Toggle 12/24 hour time format"
        >
          <div className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:scale-105 transition-transform" />
          <span className="font-mono text-xs sm:text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
            <span className="hidden xl:inline">{formattedTimeFull}</span>
            <span className="xl:hidden hidden min-[380px]:inline">{formattedTimeCompact}</span>
          </span>
        </button>

        {/* Quick Capture Button */}
        <button
          type="button"
          onClick={() => onOpenQuickCapture()}
          className="flex h-9 items-center gap-1.5 rounded-xl bg-indigo-600 px-2.5 sm:px-3 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition-transform active:scale-95 hover:bg-indigo-500 shrink-0 cursor-pointer"
          title="Quick Capture (Tasks, Notes, Finance)"
          aria-label="Quick Capture"
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span className="hidden lg:inline">Capture</span>
        </button>

        {/* Quick Command Menu Dropdown (Visible on sm+ screens) */}
        <div className="relative hidden sm:block">
          <button
            type="button"
            onClick={() => setIsActionsOpen(!isActionsOpen)}
            className="flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 sm:px-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer shrink-0"
            aria-label="Quick Actions"
            title="Fast Action Shortcuts"
          >
            <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span className="hidden xl:inline">Actions</span>
            <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
          </button>

          {isActionsOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsActionsOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-1.5 w-52 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95">
                <button
                  type="button"
                  onClick={() => { onOpenQuickCapture('task'); setIsActionsOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <span className="text-emerald-500">✓</span> Add New Task
                </button>
                <button
                  type="button"
                  onClick={() => { onOpenQuickCapture('note'); setIsActionsOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <span className="text-amber-500">📝</span> Quick Note
                </button>
                <button
                  type="button"
                  onClick={() => { onOpenQuickCapture('expense'); setIsActionsOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <span className="text-emerald-500">💰</span> Log Expense
                </button>
                <button
                  type="button"
                  onClick={() => { onNavigate('focus'); setIsActionsOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <span className="text-indigo-500">⏱</span> Start Focus Block
                </button>
                <button
                  type="button"
                  onClick={() => { onOpenBsModal(); setIsActionsOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <span>🇳🇵</span> Bikram Sambat Date
                </button>
                <button
                  type="button"
                  onClick={() => { onOpenMultiUser(); setIsActionsOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <span>👥</span> Multi-User & Pairing
                </button>
                {onOpenComputerBackup && (
                  <button
                    type="button"
                    onClick={() => { onOpenComputerBackup(); setIsActionsOpen(false); }}
                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40 cursor-pointer border-t border-slate-100 dark:border-slate-800 mt-1 pt-2"
                  >
                    <HardDrive className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Computer Folder Backup</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Multi-User Workspace Selector (Desktop) */}
        <div className="relative hidden lg:block">
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 cursor-pointer shrink-0"
            title="Switch Workspace Profile"
          >
            <Users className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            <span className="max-w-[85px] truncate">{currentProfile?.name || 'Workspace'}</span>
            <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
          </button>

          {isProfileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-1.5 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Workspace
                  </span>
                  <button
                    type="button"
                    onClick={() => { onOpenMultiUser(); setIsProfileOpen(false); }}
                    className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                </div>
                {profiles.map(prof => (
                  <button
                    key={prof.id}
                    type="button"
                    onClick={() => { onSelectProfile(prof.id); setIsProfileOpen(false); }}
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
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
                    className="flex w-full items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs text-indigo-600 font-semibold hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/30 cursor-pointer"
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>Multi-User Profiles & Pairing</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 shrink-0 cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle Dark/Light Mode"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
        </button>
      </div>
    </header>
  );
};
