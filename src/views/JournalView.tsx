import React, { useState, useRef } from 'react';
import {
  BookOpen, Calendar, Trash2, Edit3, Bold, Italic, Underline,
  List, Smile, Zap, Sparkles, Copy, Check, Search
} from 'lucide-react';
import { JournalEntry } from '../types';
import { storage, generateUUID } from '../lib/storage';
import { ConfirmModal } from '../components/ConfirmModal';

interface JournalViewProps {
  journal: JournalEntry[];
  onRefresh: () => void;
  onSuccess: (msg: string) => void;
}

export const JournalView: React.FC<JournalViewProps> = ({
  journal,
  onRefresh,
  onSuccess
}) => {
  const today = new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(today);
  const [colorTheme, setColorTheme] = useState('sky');
  const [mood, setMood] = useState('Productive');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const moodOptions = [
    { label: 'Productive', icon: '⚡' },
    { label: 'Peaceful', icon: '😌' },
    { label: 'Inspired', icon: '🌟' },
    { label: 'Deep Focus', icon: '🧘' },
    { label: 'Challenged', icon: '🌧' }
  ];

  const themePalettes: Record<string, { label: string; swatch: string; cardClass: string }> = {
    sky: {
      label: 'Calm Sky',
      swatch: '#38bdf8',
      cardClass: 'bg-sky-50/70 border-sky-200/80 dark:bg-sky-950/20 dark:border-sky-800/40 hover:border-sky-300 dark:hover:border-sky-700/60'
    },
    amber: {
      label: 'Warm Sunrise',
      swatch: '#fbbf24',
      cardClass: 'bg-amber-50/70 border-amber-200/80 dark:bg-amber-950/20 dark:border-amber-800/40 hover:border-amber-300 dark:hover:border-amber-700/60'
    },
    emerald: {
      label: 'Verdant Forest',
      swatch: '#34d399',
      cardClass: 'bg-emerald-50/70 border-emerald-200/80 dark:bg-emerald-950/20 dark:border-emerald-800/40 hover:border-emerald-300 dark:hover:border-emerald-700/60'
    },
    violet: {
      label: 'Twilight Violet',
      swatch: '#a78bfa',
      cardClass: 'bg-purple-50/70 border-purple-200/80 dark:bg-purple-950/20 dark:border-purple-800/40 hover:border-purple-300 dark:hover:border-purple-700/60'
    },
    slate: {
      label: 'Clean Slate',
      swatch: '#94a3b8',
      cardClass: 'bg-white border-slate-200/90 dark:bg-slate-900/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
    }
  };

  const getTheme = (colorVal?: string) => {
    if (!colorVal) return themePalettes.sky;
    if (themePalettes[colorVal]) return themePalettes[colorVal];
    if (colorVal.includes('amber') || colorVal.includes('fef9c3')) return themePalettes.amber;
    if (colorVal.includes('green') || colorVal.includes('f0fdf4')) return themePalettes.emerald;
    if (colorVal.includes('purple') || colorVal.includes('f5f3ff')) return themePalettes.violet;
    return themePalettes.sky;
  };

  const handleExec = (cmd: string, val: string | null = null) => {
    document.execCommand(cmd, false, val || undefined);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const html = editorRef.current?.innerHTML || '';
    const text = editorRef.current?.innerText || '';
    if (!text.trim() && !title.trim()) return;

    const now = Date.now();
    if (editingId) {
      const existing = journal.find(j => j.id === editingId);
      if (existing) {
        const updated: JournalEntry = {
          ...existing,
          title: title.trim() || 'Daily Reflection',
          text,
          html,
          date,
          color: colorTheme,
          mood,
          updatedAt: now
        };
        await storage.put('journal', updated);
        onSuccess('✓ Journal reflection updated');
      }
    } else {
      const newEntry: JournalEntry = {
        id: generateUUID(),
        title: title.trim() || 'Daily Reflection',
        text,
        html,
        date,
        color: colorTheme,
        mood,
        createdAt: now,
        updatedAt: now
      };
      await storage.put('journal', newEntry);
      onSuccess('✓ Journal reflection recorded');
    }

    resetForm();
    onRefresh();
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setTitle(entry.title);
    setDate(entry.date);
    setColorTheme(entry.color && themePalettes[entry.color] ? entry.color : 'sky');
    setMood(entry.mood || 'Productive');
    if (editorRef.current) {
      editorRef.current.innerHTML = entry.html || entry.text;
    }

    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 150);
  };

  const handleCopy = async (entry: JournalEntry) => {
    const fullText = `${entry.title} (${entry.date})\nMood: ${entry.mood || 'Reflective'}\n\n${entry.text || ''}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 2000);
      onSuccess('Copied to clipboard');
    } catch {
      onSuccess('Copy unavailable');
    }
  };

  const handleDelete = (entry: JournalEntry) => {
    setEntryToDelete(entry);
  };

  const handleConfirmDelete = async () => {
    if (!entryToDelete) return;
    try {
      await storage.delete('journal', entryToDelete.id);
      onSuccess('✓ Journal entry deleted');
      setEntryToDelete(null);
      if (editingId === entryToDelete.id) {
        resetForm();
      }
      onRefresh();
    } catch (err) {
      console.error('Failed to delete journal entry', err);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDate(today);
    setColorTheme('sky');
    setMood('Productive');
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
  };

  const filteredEntries = journal.filter(j => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return `${j.title} ${j.text} ${j.mood || ''} ${j.date}`.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Daily Journal & Philosophical Reflections
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Introspection, emotional intelligence, moral inventory, and daily insights.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Journal Editor (5 cols) */}
        <div
          ref={formRef}
          className={`lg:col-span-5 rounded-3xl border transition-all ${
            editingId
              ? 'border-indigo-400 bg-indigo-50/20 dark:border-indigo-500/50 dark:bg-indigo-950/20 ring-2 ring-indigo-500/20'
              : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
          } p-5 sm:p-6 shadow-sm`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 text-xs">
                📖
              </span>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingId ? 'Edit Entry' : 'Record Reflection'}
              </h2>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Reflection Title / Headline
              </label>
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Navigating strategic ambiguity"
                className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Dominant State / Mood
                </label>
                <select
                  value={mood}
                  onChange={e => setMood(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {moodOptions.map(m => (
                    <option key={m.label} value={m.label}>{m.icon} {m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Theme Swatches */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Entry Color Theme
              </label>
              <div className="mt-1.5 flex gap-2">
                {Object.entries(themePalettes).map(([k, t]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setColorTheme(k)}
                    className={`h-7 w-7 rounded-xl border flex items-center justify-center transition-all ${
                      colorTheme === k
                        ? 'border-indigo-600 ring-2 ring-indigo-500/30 scale-105'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                    title={t.label}
                  >
                    <span
                      className="h-4 w-4 rounded-lg shadow-xs"
                      style={{ backgroundColor: t.swatch }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Rich Editor Toolbar */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Introspection & Thoughts
              </label>
              <div className="mt-1 flex flex-wrap gap-1 rounded-t-xl border border-b-0 border-slate-200 bg-slate-50 p-1.5 dark:border-slate-700 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => handleExec('bold')}
                  className="rounded-lg p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                  title="Bold"
                >
                  <Bold className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleExec('italic')}
                  className="rounded-lg p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                  title="Italic"
                >
                  <Italic className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleExec('underline')}
                  className="rounded-lg p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                  title="Underline"
                >
                  <Underline className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleExec('insertUnorderedList')}
                  className="rounded-lg p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                  title="Bullet List"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>

              <div
                ref={editorRef}
                contentEditable
                className="min-h-[140px] max-h-64 overflow-y-auto rounded-b-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white leading-relaxed"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 active:scale-98 transition-transform"
            >
              {editingId ? 'Update Reflection' : '＋ Save Reflection'}
            </button>
          </form>
        </div>

        {/* Journal Timeline Archive (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Journal Timeline ({filteredEntries.length})
              </h2>
              <span className="text-[11px] text-slate-400">Chronological Archive</span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search reflections by word, mood, or date..."
                className="h-9 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-3.5">
            {filteredEntries.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                No journal reflections found. Record today's entry on the left.
              </div>
            ) : (
              filteredEntries.slice().reverse().map(j => {
                const theme = getTheme(j.color);
                const moodObj = moodOptions.find(m => m.label === j.mood);
                return (
                  <div
                    key={j.id}
                    className={`relative rounded-2xl border p-4 sm:p-5 shadow-xs transition-all card-hover ${theme.cardClass}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {j.title}
                          </h3>
                          {j.mood && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-white/70 dark:bg-slate-800/70 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                              <span>{moodObj?.icon || '•'}</span>
                              <span>{j.mood}</span>
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <Calendar className="h-3 w-3" />
                          <span className="font-mono">{j.date}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopy(j)}
                          className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Copy text"
                        >
                          {copiedId === j.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(j)}
                          className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Edit reflection"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(j)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete reflection"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div
                      className="prose prose-xs mt-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: j.html || j.text }}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* CONFIRM DELETE JOURNAL MODAL */}
      <ConfirmModal
        isOpen={Boolean(entryToDelete)}
        title="Delete Reflection?"
        message={
          entryToDelete
            ? `Are you sure you want to delete "${entryToDelete.title}"? This reflection will be permanently removed.`
            : ''
        }
        confirmText="Delete Reflection"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setEntryToDelete(null)}
      />
    </div>
  );
};
