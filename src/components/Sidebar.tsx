import React from 'react';
import {
  LayoutDashboard, CheckSquare, Repeat, Target, Timer, FileText,
  BookOpen, Calculator, DollarSign, Heart, Briefcase, Users,
  Compass, Folder, Settings, X, HardDrive
} from 'lucide-react';
import { NavModule } from '../types';

interface SidebarProps {
  activeModule: NavModule;
  onNavigate: (module: NavModule) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  openTasksCount: number;
  remindersCount: number;
  onOpenComputerBackup?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
  openTasksCount,
  remindersCount,
  onOpenComputerBackup,
}) => {
  const navItems: { id: NavModule; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'tasks', label: 'Tasks & Planner', icon: <CheckSquare className="h-4 w-4" />, badge: openTasksCount },
    { id: 'routine', label: 'Routine & Habits', icon: <Repeat className="h-4 w-4" /> },
    { id: 'goals', label: 'Goals & Strategy', icon: <Target className="h-4 w-4" /> },
    { id: 'focus', label: 'Focus (Deep Work)', icon: <Timer className="h-4 w-4" /> },
    { id: 'notes', label: 'Notes & Notebooks', icon: <FileText className="h-4 w-4" /> },
    { id: 'journal', label: 'Daily Journal', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'calculator', label: 'Calculator & Tools', icon: <Calculator className="h-4 w-4" /> },
    { id: 'finance', label: 'Finance & Ledger', icon: <DollarSign className="h-4 w-4" /> },
    { id: 'health', label: 'Health & Wellness', icon: <Heart className="h-4 w-4" /> },
    { id: 'work', label: 'Work & Learning', icon: <Briefcase className="h-4 w-4" /> },
    { id: 'people', label: 'People & Relations', icon: <Users className="h-4 w-4" /> },
    { id: 'spiritual', label: 'Values & Spiritual', icon: <Compass className="h-4 w-4" /> },
    { id: 'things', label: 'Things & Documents', icon: <Folder className="h-4 w-4" /> },
    { id: 'settings', label: 'Settings & Sync', icon: <Settings className="h-4 w-4" />, badge: remindersCount }
  ];

  const handleSelect = (id: NavModule) => {
    onNavigate(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out dark:border-slate-800 dark:bg-slate-900 md:static md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header / Brand in Mobile */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5 dark:border-slate-800/80 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 font-serif font-bold text-white">
              ॐ
            </div>
            <span className="text-base font-bold text-slate-900 dark:text-white">Om-LifeOS</span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Navigation System
          </div>
          <nav className="space-y-0.5">
            {navItems.map(item => {
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 font-semibold text-indigo-700 shadow-sm dark:bg-indigo-950/60 dark:text-indigo-300'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`transition-colors ${
                        isActive
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>

                  {Boolean(item.badge && item.badge > 0) && (
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold tabular-nums ${
                        isActive
                          ? 'bg-indigo-200 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info & Computer Backup Quick Button */}
        <div className="border-t border-slate-100 p-3 space-y-2 text-center dark:border-slate-800/80">
          {onOpenComputerBackup && (
            <button
              type="button"
              onClick={() => {
                onOpenComputerBackup();
                onCloseMobile();
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 py-1.5 px-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
            >
              <HardDrive className="h-3.5 w-3.5" />
              <span>Computer Backup</span>
            </button>
          )}
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Local-First Sovereign OS
          </div>
          <div className="font-mono text-[9px] text-slate-400 dark:text-slate-500">
            Multi-Device · IndexedDB
          </div>
        </div>
      </aside>
    </>
  );
};
