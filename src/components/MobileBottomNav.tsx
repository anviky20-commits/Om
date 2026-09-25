import React from 'react';
import { LayoutDashboard, CheckSquare, Repeat, FileText, Settings } from 'lucide-react';
import { NavModule } from '../types';

interface MobileBottomNavProps {
  activeModule: NavModule;
  onNavigate: (module: NavModule) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeModule, onNavigate }) => {
  const tabs: { id: NavModule; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Home', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="h-4 w-4" /> },
    { id: 'routine', label: 'Habits', icon: <Repeat className="h-4 w-4" /> },
    { id: 'notes', label: 'Notes', icon: <FileText className="h-4 w-4" /> },
    { id: 'settings', label: 'More', icon: <Settings className="h-4 w-4" /> }
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-14 items-center justify-around border-t border-slate-200 bg-white/95 px-2 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 md:hidden">
      {tabs.map(tab => {
        const isActive = activeModule === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onNavigate(tab.id)}
            className={`flex flex-col items-center justify-center gap-0.5 rounded-lg py-1 px-3 transition-colors ${
              isActive
                ? 'font-semibold text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {tab.icon}
            <span className="text-[10px] leading-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
