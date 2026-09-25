import React, { useState } from 'react';
import {
  Folder, FolderOpen, FileText, FileCode, CheckCircle2, ChevronDown,
  ChevronUp, ChevronRight, Search, Layers, Sparkles, FolderTree, X, Filter
} from 'lucide-react';

export interface DomainFileSpec {
  name: string;
  type: 'json' | 'md' | 'txt' | 'html';
  desc: string;
}

export interface DomainFolderSpec {
  id: string;
  folderName: string;
  label: string;
  description: string;
  color: string;
  accentBg: string;
  borderClass: string;
  badgeBg: string;
  badgeText: string;
  files: DomainFileSpec[];
}

export const ALL_DOMAIN_SUBFOLDERS: DomainFolderSpec[] = [
  {
    id: '00',
    folderName: '00_Master_System_Backup',
    label: 'Master System Backup',
    description: 'Complete restorable JSON snapshot, system manifest & restoration guide',
    color: 'text-amber-600 dark:text-amber-400',
    accentBg: 'bg-amber-500/10',
    borderClass: 'border-amber-200 dark:border-amber-800/60',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/60',
    badgeText: 'text-amber-800 dark:text-amber-300',
    files: [
      { name: 'om_lifeos_offline_dashboard.html', type: 'html', desc: 'Complete standalone interactive HTML dashboard. Double-click to open in any browser offline!' },
      { name: 'om_lifeos_master_backup.json', type: 'json', desc: 'Atomic full-database snapshot. Restore anytime from Settings.' },
      { name: 'backup_manifest.json', type: 'json', desc: 'Metadata manifest with total counts across all stores.' },
      { name: 'README.txt', type: 'txt', desc: 'Sovereign backup explanation & restoration instructions.' }
    ]
  },
  {
    id: '01',
    folderName: '01_Tasks_and_Planner',
    label: 'Tasks & Planner',
    description: 'All tasks, daily command targets, and human-readable Markdown checklists',
    color: 'text-indigo-600 dark:text-indigo-400',
    accentBg: 'bg-indigo-500/10',
    borderClass: 'border-indigo-200 dark:border-indigo-800/60',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-950/60',
    badgeText: 'text-indigo-800 dark:text-indigo-300',
    files: [
      { name: 'tasks.json', type: 'json', desc: 'All tasks database with priorities, statuses, tags & due dates.' },
      { name: 'tasks_summary.md', type: 'md', desc: 'Clean Markdown checklist of pending & completed tasks.' },
      { name: 'daily_command_target_today.json', type: 'json', desc: 'Active daily planner command targets & priorities.' }
    ]
  },
  {
    id: '02',
    folderName: '02_Finance_and_Ledger',
    label: 'Finance & Ledger',
    description: 'Bank accounts, transactions, loans, assets, liabilities & balance sheet',
    color: 'text-emerald-600 dark:text-emerald-400',
    accentBg: 'bg-emerald-500/10',
    borderClass: 'border-emerald-200 dark:border-emerald-800/60',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60',
    badgeText: 'text-emerald-800 dark:text-emerald-300',
    files: [
      { name: 'accounts.json', type: 'json', desc: 'Bank accounts, cash balances & digital wallets.' },
      { name: 'transactions.json', type: 'json', desc: 'Every recorded income, expense, and transfer.' },
      { name: 'loans.json', type: 'json', desc: 'Active loans, lenders, interest rates & due dates.' },
      { name: 'loan_payments.json', type: 'json', desc: 'Historical loan repayment log with interest breakdowns.' },
      { name: 'investments.json', type: 'json', desc: 'Fixed deposits, stocks, mutual funds, gold.' },
      { name: 'savings_plans.json', type: 'json', desc: 'Goal-based recurring savings funds.' },
      { name: 'assets.json', type: 'json', desc: 'Tangible, real estate, and capital asset roster.' },
      { name: 'liabilities.json', type: 'json', desc: 'Current and long-term liabilities.' },
      { name: 'financial_goals.json', type: 'json', desc: 'Target milestones and net worth objectives.' },
      { name: 'financial_overview.md', type: 'md', desc: 'Markdown balance sheet and liquid cash audit.' }
    ]
  },
  {
    id: '03',
    folderName: '03_Notes_and_Notebooks',
    label: 'Notes & Notebooks',
    description: 'Full notes database plus individual Markdown files organized by notebook',
    color: 'text-purple-600 dark:text-purple-400',
    accentBg: 'bg-purple-500/10',
    borderClass: 'border-purple-200 dark:border-purple-800/60',
    badgeBg: 'bg-purple-100 dark:bg-purple-950/60',
    badgeText: 'text-purple-800 dark:text-purple-300',
    files: [
      { name: 'all_notes.json', type: 'json', desc: 'All notes with categories, tags, timestamps.' },
      { name: '[Notebook_Name]/*.md', type: 'md', desc: 'Individual note files readable directly in Obsidian, Notion, VS Code.' }
    ]
  },
  {
    id: '04',
    folderName: '04_Goals_and_Strategy',
    label: 'Goals & Strategy',
    description: 'Long-term visions, tactical strategies, KPIs, milestones & missions',
    color: 'text-blue-600 dark:text-blue-400',
    accentBg: 'bg-blue-500/10',
    borderClass: 'border-blue-200 dark:border-blue-800/60',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/60',
    badgeText: 'text-blue-800 dark:text-blue-300',
    files: [
      { name: 'goals.json', type: 'json', desc: 'Goal definitions, progress rates, targets.' },
      { name: 'strategies.json', type: 'json', desc: 'Execution plans, action steps, tactics.' },
      { name: 'milestones.json', type: 'json', desc: 'Time-bound checkpoints along the goal path.' },
      { name: 'kpis.json', type: 'json', desc: 'Key Performance Indicators and target metrics.' },
      { name: 'missions.json', type: 'json', desc: 'Core life pillars and mission statements.' },
      { name: 'goals_overview.md', type: 'md', desc: 'Formatted markdown summary of all goals.' }
    ]
  },
  {
    id: '05',
    folderName: '05_Health_and_Vitals',
    label: 'Health & Vitals',
    description: 'Body metrics, sleep records, hydration, nutrition & clinical memos',
    color: 'text-rose-600 dark:text-rose-400',
    accentBg: 'bg-rose-500/10',
    borderClass: 'border-rose-200 dark:border-rose-800/60',
    badgeBg: 'bg-rose-100 dark:bg-rose-950/60',
    badgeText: 'text-rose-800 dark:text-rose-300',
    files: [
      { name: 'health_measurements.json', type: 'json', desc: 'Weight, blood pressure, vitals history.' },
      { name: 'sleep_records.json', type: 'json', desc: 'Sleep duration, quality scores, sleep logs.' },
      { name: 'water_records.json', type: 'json', desc: 'Hydration intake and daily targets.' },
      { name: 'nutrition_records.json', type: 'json', desc: 'Meals, calories, dietary intake logs.' },
      { name: 'health_appointments.json', type: 'json', desc: 'Doctor consultations & clinical follow-ups.' },
      { name: 'health_notes.json', type: 'json', desc: 'Symptom logs, diagnoses, medical memos.' }
    ]
  },
  {
    id: '06',
    folderName: '06_Journal_and_Mind',
    label: 'Journal & Mind',
    description: 'All reflections, gratitude logs & individual dated Markdown entries',
    color: 'text-amber-700 dark:text-amber-300',
    accentBg: 'bg-amber-600/10',
    borderClass: 'border-amber-300 dark:border-amber-800/60',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/60',
    badgeText: 'text-amber-800 dark:text-amber-300',
    files: [
      { name: 'all_journal_entries.json', type: 'json', desc: 'Full historical journal entries database.' },
      { name: 'YYYY-MM-DD_[title].md', type: 'md', desc: 'Individual formatted daily reflection files.' }
    ]
  },
  {
    id: '07',
    folderName: '07_Routines_and_Habits',
    label: 'Routines & Habits',
    description: 'Morning & evening routines, atomic habits, streaks & check-in logs',
    color: 'text-teal-600 dark:text-teal-400',
    accentBg: 'bg-teal-500/10',
    borderClass: 'border-teal-200 dark:border-teal-800/60',
    badgeBg: 'bg-teal-100 dark:bg-teal-950/60',
    badgeText: 'text-teal-800 dark:text-teal-300',
    files: [
      { name: 'routines.json', type: 'json', desc: 'Morning, workday, evening structured routines.' },
      { name: 'habits.json', type: 'json', desc: 'Atomic habit definitions, cues, streaks, frequency.' },
      { name: 'habit_logs.json', type: 'json', desc: 'Historical habit completion & adherence records.' }
    ]
  },
  {
    id: '08',
    folderName: '08_Work_and_Learning',
    label: 'Work & Learning',
    description: 'Career projects, skills inventory, courses, meetings & responsibilities',
    color: 'text-sky-600 dark:text-sky-400',
    accentBg: 'bg-sky-500/10',
    borderClass: 'border-sky-200 dark:border-sky-800/60',
    badgeBg: 'bg-sky-100 dark:bg-sky-950/60',
    badgeText: 'text-sky-800 dark:text-sky-300',
    files: [
      { name: 'work_projects.json', type: 'json', desc: 'Work projects, client deliverables & deadlines.' },
      { name: 'work_responsibilities.json', type: 'json', desc: 'Role definitions, deliverables & scope.' },
      { name: 'learning_items.json', type: 'json', desc: 'Reading lists, research papers, study items.' },
      { name: 'skills.json', type: 'json', desc: 'Skill development roadmap & proficiency tiers.' },
      { name: 'courses.json', type: 'json', desc: 'Enrolled courses, certifications & curriculum.' },
      { name: 'meetings.json', type: 'json', desc: 'Meeting minutes, agendas & action decisions.' }
    ]
  },
  {
    id: '09',
    folderName: '09_People_and_Network',
    label: 'People & Network',
    description: 'Personal CRM, contacts directory, relationship tags & interaction history',
    color: 'text-orange-600 dark:text-orange-400',
    accentBg: 'bg-orange-500/10',
    borderClass: 'border-orange-200 dark:border-orange-800/60',
    badgeBg: 'bg-orange-100 dark:bg-orange-950/60',
    badgeText: 'text-orange-800 dark:text-orange-300',
    files: [
      { name: 'people.json', type: 'json', desc: 'Contacts, circle tags, birthdays, key relationships.' },
      { name: 'interactions.json', type: 'json', desc: 'Calls, meetings, catch-ups & touchpoints.' }
    ]
  },
  {
    id: '10',
    folderName: '10_Spiritual_and_Principles',
    label: 'Spiritual & Principles',
    description: 'Guiding core values, spiritual practices, principles & personal vows',
    color: 'text-violet-600 dark:text-violet-400',
    accentBg: 'bg-violet-500/10',
    borderClass: 'border-violet-200 dark:border-violet-800/60',
    badgeBg: 'bg-violet-100 dark:bg-violet-950/60',
    badgeText: 'text-violet-800 dark:text-violet-300',
    files: [
      { name: 'values.json', type: 'json', desc: 'Core philosophical principles and non-negotiables.' },
      { name: 'practices.json', type: 'json', desc: 'Meditation, mindfulness, prayers, observances.' },
      { name: 'commitments.json', type: 'json', desc: 'Personal vows and integrity contracts.' }
    ]
  },
  {
    id: '11',
    folderName: '11_Things_and_Vault',
    label: 'Things & Vault',
    description: 'Physical inventory, belongings, document registry, warranties & receipts',
    color: 'text-slate-600 dark:text-slate-300',
    accentBg: 'bg-slate-500/10',
    borderClass: 'border-slate-300 dark:border-slate-700',
    badgeBg: 'bg-slate-200 dark:bg-slate-800',
    badgeText: 'text-slate-800 dark:text-slate-200',
    files: [
      { name: 'things_inventory.json', type: 'json', desc: 'Physical belongings, locations, serial numbers.' },
      { name: 'documents.json', type: 'json', desc: 'Document registry, expiry dates & renewal notes.' },
      { name: 'warranties.json', type: 'json', desc: 'Device warranties, coverage dates, claims.' },
      { name: 'receipts.json', type: 'json', desc: 'Purchase proofs, invoices & acquisition prices.' },
      { name: 'certificates.json', type: 'json', desc: 'Degrees, licenses & credential identifiers.' },
      { name: 'important_records.json', type: 'json', desc: 'Legal and administrative vital records.' }
    ]
  }
];

export interface ComputerSubfoldersViewerProps {
  targetFolderName?: string | null;
  isFolderConnected?: boolean;
  lastBackupAt?: number | string | null;
  lastFileCount?: number | null;
  defaultOpen?: boolean;
  compact?: boolean;
  onSelectFolder?: () => void;
  hideTargetHeader?: boolean;
}

export const ComputerSubfoldersViewer: React.FC<ComputerSubfoldersViewerProps> = ({
  targetFolderName,
  isFolderConnected = false,
  lastBackupAt,
  lastFileCount,
  defaultOpen = false,
  compact = false,
  hideTargetHeader = false,
  onSelectFolder,
}) => {
  // Dropdown menu open/closed state
  const [isDropdownOpen, setIsDropdownOpen] = useState(defaultOpen);
  // Optional selected single subfolder inside dropdown menu
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  // Expanded files inside folders
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    ALL_DOMAIN_SUBFOLDERS.forEach(f => { next[f.id] = true; });
    setExpandedFolders(next);
  };

  const collapseAll = () => {
    setExpandedFolders({});
  };

  const handleSelectDropdownItem = (folderId: string) => {
    setSelectedFolderId(folderId || null);
    setIsDropdownOpen(true);
    if (folderId) {
      setExpandedFolders(prev => ({ ...prev, [folderId]: true }));
    }
  };

  const filteredFolders = ALL_DOMAIN_SUBFOLDERS.filter(folder => {
    if (selectedFolderId && folder.id !== selectedFolderId) {
      return false;
    }
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const matchFolder = folder.folderName.toLowerCase().includes(term) ||
      folder.label.toLowerCase().includes(term) ||
      folder.description.toLowerCase().includes(term);
    const matchFiles = folder.files.some(f => f.name.toLowerCase().includes(term) || f.desc.toLowerCase().includes(term));
    return matchFolder || matchFiles;
  });

  return (
    <div className="space-y-3.5">
      {/* Target Folder Header & Dropdown Menu Trigger Bar */}
      <div className="flex flex-col gap-3">
        {!hideTargetHeader && (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white/90 p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900/80">
            {/* Target Folder Display */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400 shrink-0">
                <Folder className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Target Backup Folder
                </span>
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200/80 dark:bg-slate-800 dark:border-slate-700">
                    {targetFolderName || 'No folder selected yet'}
                  </span>
                  {isFolderConnected ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Connected & Ready
                    </span>
                  ) : (
                    onSelectFolder && (
                      <button
                        type="button"
                        onClick={onSelectFolder}
                        className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:border-indigo-800 dark:text-indigo-300 cursor-pointer"
                      >
                        Choose Folder
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            {lastBackupAt ? (
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 self-start md:self-center">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                <span>Last saved: {new Date(lastBackupAt).toLocaleString()} ({lastFileCount || 0} files)</span>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 dark:text-slate-500 self-start md:self-center">
                12 domain subfolders configured
              </div>
            )}
          </div>
        )}

        {/* Dropdown Menu Controller inside "Target Folder" */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          {/* 1. Main Dropdown Toggle Button */}
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
              isDropdownOpen
                ? 'border-indigo-600 bg-indigo-600 text-white shadow-indigo-100 dark:shadow-none'
                : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750'
            }`}
            title="Click to toggle dropdown menu of all subfolders"
          >
            <div className="flex items-center gap-2">
              <FolderTree className={`h-4 w-4 ${isDropdownOpen ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`} />
              <span className="tracking-tight">Target Folder Subfolders</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                isDropdownOpen
                  ? 'bg-white/20 text-white'
                  : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
              }`}>
                {ALL_DOMAIN_SUBFOLDERS.length} Folders
              </span>
            </div>
            {isDropdownOpen ? (
              <ChevronUp className="h-4 w-4 ml-1 opacity-80" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-1 opacity-80" />
            )}
          </button>

          {/* 2. Quick Subfolder Selector Dropdown */}
          <div className="relative flex-1">
            <select
              value={selectedFolderId || ''}
              onChange={(e) => handleSelectDropdownItem(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-xs font-medium text-slate-700 shadow-2xs hover:border-indigo-300 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="">Jump directly to a Domain Subfolder...</option>
              {ALL_DOMAIN_SUBFOLDERS.map(f => (
                <option key={f.id} value={f.id}>
                  📁 {f.folderName}/ — {f.label} ({f.files.length} files)
                </option>
              ))}
            </select>
          </div>

          {/* When dropdown closed: quick hint */}
          {!isDropdownOpen && (
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hidden lg:inline">
              Click to browse subfolders
            </span>
          )}
        </div>
      </div>

      {/* Dropdown Menu Panel (revealed when isDropdownOpen is true) */}
      {isDropdownOpen && (
        <div className="rounded-2xl border border-indigo-200/80 bg-white p-4 shadow-sm dark:border-indigo-900/60 dark:bg-slate-900 space-y-3.5 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Dropdown Top Bar Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Layers className="h-4 w-4 text-indigo-500" />
                <span className="tracking-tight">12 Sovereign Domain Subfolders</span>
              </div>
              {selectedFolderId && (
                <button
                  type="button"
                  onClick={() => setSelectedFolderId(null)}
                  className="rounded-lg bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 cursor-pointer"
                >
                  Show All 12 Folders ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <div className="relative flex-1 sm:w-52">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search folders or files..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <button
                type="button"
                onClick={Object.keys(expandedFolders).length === ALL_DOMAIN_SUBFOLDERS.length ? collapseAll : expandAll}
                className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
              >
                {Object.keys(expandedFolders).length === ALL_DOMAIN_SUBFOLDERS.length ? 'Collapse All' : 'Expand All Files'}
              </button>

              <button
                type="button"
                onClick={() => setIsDropdownOpen(false)}
                className="shrink-0 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
                title="Close dropdown menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Subfolders Dropdown Menu List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
            {filteredFolders.map(folder => {
              const isExpanded = !!expandedFolders[folder.id];
              return (
                <div
                  key={folder.id}
                  className={`rounded-2xl border ${folder.borderClass} ${folder.accentBg} p-3 transition-all hover:shadow-xs bg-white dark:bg-slate-900/90`}
                >
                  {/* Folder Item Header */}
                  <div
                    onClick={() => toggleFolder(folder.id)}
                    className="flex items-start justify-between gap-2 cursor-pointer select-none"
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <div className={`mt-0.5 shrink-0 ${folder.color}`}>
                        {isExpanded ? (
                          <FolderOpen className="h-4 w-4" />
                        ) : (
                          <Folder className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-mono text-xs font-bold text-slate-900 dark:text-white truncate" title={folder.folderName}>
                          {folder.folderName}/
                        </div>
                        <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                          {folder.label}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {folder.description}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${folder.badgeBg} ${folder.badgeText}`}>
                        {folder.files.length} files
                      </span>
                      <div className="text-slate-400">
                        {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </div>
                    </div>
                  </div>

                  {/* Subfolder Files Preview (Expanded or Preview line) */}
                  {isExpanded ? (
                    <div className="mt-2.5 space-y-1.5 border-t border-slate-100 pt-2 dark:border-slate-800/80 animate-in fade-in duration-100">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Files inside this subfolder:
                      </div>
                      <div className="space-y-1">
                        {folder.files.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-1.5 rounded-lg bg-slate-50/90 p-1.5 text-[11px] dark:bg-slate-800/60"
                          >
                            <div className="mt-0.5 shrink-0">
                              {file.type === 'md' ? (
                                <FileText className="h-3.5 w-3.5 text-blue-500" />
                              ) : file.type === 'json' ? (
                                <FileCode className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <FileText className="h-3.5 w-3.5 text-slate-500" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                                  {file.name}
                                </span>
                                <span className={`text-[8px] font-mono uppercase px-1 rounded-sm font-bold ${
                                  file.type === 'md'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                    : file.type === 'json'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                }`}>
                                  .{file.type}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                {file.desc}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => toggleFolder(folder.id)}
                      className="mt-2 flex items-center justify-between text-[10px] text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer pt-1 border-t border-slate-100/60 dark:border-slate-800/60"
                    >
                      <span className="truncate">
                        {folder.files.map(f => f.name.replace('.json', '').replace('.md', '')).slice(0, 2).join(', ')}
                        {folder.files.length > 2 ? ` +${folder.files.length - 2} more` : ''}
                      </span>
                      <span className="shrink-0 font-medium underline ml-1">View files</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredFolders.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500 dark:border-slate-800">
              No subfolder matched "{searchTerm}".
            </div>
          )}

          {/* Footer note inside dropdown */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>All 12 subfolders are saved directly inside <strong className="font-mono text-slate-700 dark:text-slate-300">"{targetFolderName || 'Target Folder'}"</strong> on your computer.</span>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(false)}
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
            >
              Close Dropdown Menu ▲
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
