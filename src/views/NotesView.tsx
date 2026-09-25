import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Plus, Search, Tag, Trash2, Edit3, Bold, Italic, Underline,
  List, Star, Copy, Check, Download, Pin, Filter, X, Maximize2,
  Calendar, Folder, Sparkles, CheckCircle2, BookOpen, Layers
} from 'lucide-react';
import { Note } from '../types';
import { storage, generateUUID } from '../lib/storage';
import { ConfirmModal } from '../components/ConfirmModal';

interface NotesViewProps {
  notes: Note[];
  categories: string[];
  onRefresh: () => void;
  onSuccess: (msg: string) => void;
}

export const NotesView: React.FC<NotesViewProps> = ({
  notes,
  categories = ['General', 'Strategy', 'Projects', 'Finance', 'Ideas'],
  onRefresh,
  onSuccess
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [colorFilter, setColorFilter] = useState<string>('all');
  
  // Custom notebooks list (merged from default categories, appSettings, and note categories)
  const [allCategories, setAllCategories] = useState<string[]>(categories);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Left-panel Inline Editor state
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [tags, setTags] = useState('');
  const [colorTheme, setColorTheme] = useState('slate');
  const [points, setPoints] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [editorText, setEditorText] = useState('');
  const [editorMode, setEditorMode] = useState<'rich' | 'plain'>('plain');
  
  // Modal states
  const [editingModalNote, setEditingModalNote] = useState<Note | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit Modal internal form state
  const [modalTitle, setModalTitle] = useState('');
  const [modalCategory, setModalCategory] = useState('General');
  const [modalCustomCat, setModalCustomCat] = useState('');
  const [modalTags, setModalTags] = useState('');
  const [modalColor, setModalColor] = useState('slate');
  const [modalPoints, setModalPoints] = useState('');
  const [modalPinned, setModalPinned] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [modalEditorMode, setModalEditorMode] = useState<'plain' | 'rich'>('plain');

  const formRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const richEditorRef = useRef<HTMLDivElement>(null);

  // Keep all categories synced with unique ones across existing notes
  useEffect(() => {
    const noteCats = notes.map(n => n.category).filter(Boolean);
    const combined = Array.from(new Set([...categories, ...noteCats]));
    setAllCategories(combined);
  }, [categories, notes]);

  const themePalettes: Record<string, { label: string; swatch: string; cardClass: string; dotClass: string }> = {
    slate: {
      label: 'Classic Slate',
      swatch: '#94a3b8',
      cardClass: 'bg-white border-slate-200/90 dark:bg-slate-900/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700',
      dotClass: 'bg-slate-400'
    },
    amber: {
      label: 'Soft Amber',
      swatch: '#f59e0b',
      cardClass: 'bg-amber-50/70 border-amber-200/80 dark:bg-amber-950/20 dark:border-amber-800/40 hover:border-amber-300 dark:hover:border-amber-700/60',
      dotClass: 'bg-amber-500'
    },
    emerald: {
      label: 'Soft Emerald',
      swatch: '#10b981',
      cardClass: 'bg-emerald-50/70 border-emerald-200/80 dark:bg-emerald-950/20 dark:border-emerald-800/40 hover:border-emerald-300 dark:hover:border-emerald-700/60',
      dotClass: 'bg-emerald-500'
    },
    sky: {
      label: 'Soft Sky',
      swatch: '#0ea5e9',
      cardClass: 'bg-sky-50/70 border-sky-200/80 dark:bg-sky-950/20 dark:border-sky-800/40 hover:border-sky-300 dark:hover:border-sky-700/60',
      dotClass: 'bg-sky-500'
    },
    violet: {
      label: 'Soft Violet',
      swatch: '#8b5cf6',
      cardClass: 'bg-purple-50/70 border-purple-200/80 dark:bg-purple-950/20 dark:border-purple-800/40 hover:border-purple-300 dark:hover:border-purple-700/60',
      dotClass: 'bg-purple-500'
    },
    rose: {
      label: 'Soft Rose',
      swatch: '#f43f5e',
      cardClass: 'bg-rose-50/70 border-rose-200/80 dark:bg-rose-950/20 dark:border-rose-800/40 hover:border-rose-300 dark:hover:border-rose-700/60',
      dotClass: 'bg-rose-500'
    }
  };

  const getTheme = (colorVal?: string) => {
    if (!colorVal) return themePalettes.slate;
    if (themePalettes[colorVal]) return themePalettes[colorVal];
    if (colorVal.includes('amber')) return themePalettes.amber;
    if (colorVal.includes('emerald')) return themePalettes.emerald;
    if (colorVal.includes('sky') || colorVal.includes('blue')) return themePalettes.sky;
    if (colorVal.includes('violet') || colorVal.includes('purple')) return themePalettes.violet;
    if (colorVal.includes('rose') || colorVal.includes('pink')) return themePalettes.rose;
    return themePalettes.slate;
  };

  // Open Edit Modal with full content preservation
  const handleOpenEditModal = (note: Note) => {
    setViewingNote(null);
    setEditingModalNote(note);
    setModalTitle(note.title);
    setModalCategory(note.category || 'General');
    setModalCustomCat('');
    setModalTags(note.tags || '');
    setModalColor(note.color && themePalettes[note.color] ? note.color : 'slate');
    setModalPoints(note.points || '');
    setModalPinned(Boolean(note.pinned));
    const content = note.body || note.html || '';
    setModalContent(content);
  };

  // Inline edit handler (populates form and focuses)
  const handleEditInline = (note: Note) => {
    setIsEditingInline(true);
    setEditingNoteId(note.id);
    setTitle(note.title);
    setCategory(note.category || 'General');
    setCustomCategoryInput('');
    setTags(note.tags || '');
    setColorTheme(note.color && themePalettes[note.color] ? note.color : 'slate');
    setPoints(note.points || '');
    setIsPinned(Boolean(note.pinned));
    const content = note.body || note.html || '';
    setEditorText(content);

    // Smooth scroll to form and focus
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 150);
  };

  const handleAddNewNotebook = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    if (!allCategories.includes(trimmed)) {
      const updated = [...allCategories, trimmed];
      setAllCategories(updated);

      // Persist to appSettings
      const settings = (await storage.getSingleton<any>('appSettings')) || {};
      settings.noteCategories = updated;
      await storage.setSingleton('appSettings', settings);
      onSuccess(`Notebook "${trimmed}" created`);
    }

    setCategory(trimmed);
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  // Inline Form Save
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalCategory = customCategoryInput.trim() || category || 'General';
    const now = Date.now();
    const body = editorText;
    const html = editorText.replace(/\n/g, '<br/>');

    if (editingNoteId) {
      const existing = notes.find(n => n.id === editingNoteId);
      if (existing) {
        const updated: Note = {
          ...existing,
          title: title.trim(),
          body,
          html,
          category: finalCategory,
          tags: tags.trim() || undefined,
          points: points.trim() || undefined,
          color: colorTheme,
          pinned: isPinned,
          updatedAt: now
        };
        await storage.put('notes', updated);
        onSuccess('✓ Note updated in vault');
      }
    } else {
      const newNote: Note = {
        id: generateUUID(),
        title: title.trim(),
        body,
        html,
        category: finalCategory,
        tags: tags.trim() || undefined,
        points: points.trim() || undefined,
        color: colorTheme,
        pinned: isPinned,
        date: new Date().toISOString().slice(0, 10),
        createdAt: now,
        updatedAt: now
      };
      await storage.put('notes', newNote);
      onSuccess('✓ Note saved to vault');
    }

    // Ensure notebook is in categories list
    if (finalCategory && !allCategories.includes(finalCategory)) {
      setAllCategories(prev => [...prev, finalCategory]);
    }

    resetForm();
    onRefresh();
  };

  // Modal Form Save
  const handleSaveModalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModalNote || !modalTitle.trim()) return;

    const finalCategory = modalCustomCat.trim() || modalCategory || 'General';
    const now = Date.now();
    const body = modalContent;
    const html = modalContent.replace(/\n/g, '<br/>');

    const updated: Note = {
      ...editingModalNote,
      title: modalTitle.trim(),
      body,
      html,
      category: finalCategory,
      tags: modalTags.trim() || undefined,
      points: modalPoints.trim() || undefined,
      color: modalColor,
      pinned: modalPinned,
      updatedAt: now
    };

    await storage.put('notes', updated);
    onSuccess('✓ Note updated in vault');
    setEditingModalNote(null);
    onRefresh();
  };

  const handleTogglePin = async (note: Note, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated: Note = {
      ...note,
      pinned: !note.pinned,
      updatedAt: Date.now()
    };
    await storage.put('notes', updated);
    onSuccess(note.pinned ? 'Note unpinned' : '📌 Note pinned to top');
    onRefresh();
  };

  const handleCopyNote = async (note: Note, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const fullText = `${note.title}\n\n${note.body || ''}${note.points ? `\n\nPoints:\n${note.points}` : ''}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedId(note.id);
      setTimeout(() => setCopiedId(null), 2000);
      onSuccess('Note copied to clipboard');
    } catch {
      onSuccess('Copy failed');
    }
  };

  const handleExportNote = (note: Note, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const fullText = `# ${note.title}\nDate: ${note.date} | Notebook: ${note.category}\nTags: ${note.tags || 'none'}\n\n${note.body || ''}\n\n${note.points ? `### Action Points:\n${note.points}` : ''}`;
    const blob = new Blob([fullText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    onSuccess('Note exported as Markdown file');
  };

  const handleDeleteClick = (note: Note, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setNoteToDelete(note);
  };

  const handleConfirmDelete = async () => {
    if (!noteToDelete) return;
    try {
      await storage.delete('notes', noteToDelete.id);
      onSuccess('✓ Note deleted');
      setNoteToDelete(null);
      if (editingModalNote?.id === noteToDelete.id) {
        setEditingModalNote(null);
      }
      if (viewingNote?.id === noteToDelete.id) {
        setViewingNote(null);
      }
      if (editingNoteId === noteToDelete.id) {
        resetForm();
      }
      onRefresh();
    } catch (err) {
      console.error('Failed to delete note', err);
    }
  };

  const resetForm = () => {
    setIsEditingInline(false);
    setEditingNoteId(null);
    setTitle('');
    setTags('');
    setColorTheme('slate');
    setPoints('');
    setIsPinned(false);
    setEditorText('');
    setCustomCategoryInput('');
  };

  const filteredNotes = notes.filter(n => {
    if (selectedCategory !== 'all' && n.category !== selectedCategory) return false;
    if (colorFilter !== 'all' && n.color !== colorFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const hay = `${n.title} ${n.body} ${n.points || ''} ${n.tags || ''} ${n.category}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt);
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl flex items-center gap-2">
            <span>Notes & Notebooks</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Organized knowledge vaults, structured pointwise takeaways, color palettes, and markdown export.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddingCategory(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Folder className="h-3.5 w-3.5 text-indigo-500" />
            <span>+ New Notebook</span>
          </button>
        </div>
      </div>

      {/* New Notebook Modal/Bar */}
      {isAddingCategory && (
        <form
          onSubmit={handleAddNewNotebook}
          className="flex items-center gap-2 p-3 bg-indigo-50/70 border border-indigo-200 rounded-2xl dark:bg-indigo-950/30 dark:border-indigo-800/60"
        >
          <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <input
            type="text"
            required
            autoFocus
            placeholder="Enter notebook title (e.g. Research, Architecture, Startup Ideas)..."
            value={newCategoryName}
            onChange={e => setNewCategoryName(e.target.value)}
            className="flex-1 h-8 rounded-lg border border-indigo-200 bg-white px-3 text-xs dark:border-indigo-700 dark:bg-slate-800 dark:text-white"
          />
          <button
            type="submit"
            className="h-8 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-500 cursor-pointer"
          >
            Create Notebook
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAddingCategory(false);
              setNewCategoryName('');
            }}
            className="h-8 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
          >
            Cancel
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Note Editor Form (5 cols) */}
        <div
          ref={formRef}
          className={`lg:col-span-5 rounded-3xl border transition-all ${
            editingNoteId
              ? 'border-indigo-400 bg-indigo-50/20 dark:border-indigo-500/50 dark:bg-indigo-950/20 ring-2 ring-indigo-500/20'
              : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
          } p-5 sm:p-6 shadow-sm`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 text-xs">
                📝
              </span>
              <span>{editingNoteId ? 'Edit Note (Inline)' : 'Create New Note'}</span>
            </h2>
            {editingNoteId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSaveNote} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Note Title
              </label>
              <input
                ref={titleInputRef}
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Give your note a title..."
                className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Notebook
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {allCategories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="__custom">+ Custom Notebook...</option>
                </select>
                {category === '__custom' && (
                  <input
                    type="text"
                    required
                    placeholder="Enter notebook name"
                    value={customCategoryInput}
                    onChange={e => setCustomCategoryInput(e.target.value)}
                    className="mt-1.5 h-8 w-full rounded-lg border border-indigo-200 px-2.5 text-xs dark:border-indigo-700 dark:bg-slate-800 dark:text-white"
                  />
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="ideas, architecture"
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Note Theme Palettes */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Card Theme Palette
                </label>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={e => setIsPinned(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                  <span>Pin to top</span>
                </label>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                {Object.entries(themePalettes).map(([k, t]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setColorTheme(k)}
                    className={`group relative flex h-7 w-7 items-center justify-center rounded-xl border transition-all cursor-pointer ${
                      colorTheme === k
                        ? 'border-indigo-600 ring-2 ring-indigo-500/30 scale-105'
                        : 'border-slate-200 dark:border-slate-700 hover:scale-105'
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

            {/* Note Content Editor */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Note Content & Body
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {editorText.length} chars
                </span>
              </div>
              <textarea
                rows={6}
                value={editorText}
                onChange={e => setEditorText(e.target.value)}
                placeholder="Write your note, thoughts, code, or markdown here..."
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white leading-relaxed"
              />
            </div>

            {/* Pointwise structured note section */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Pointwise Structured Takeaways (1 line = 1 point)
              </label>
              <textarea
                rows={2}
                value={points}
                onChange={e => setPoints(e.target.value)}
                placeholder="• Core decision 1&#10;• Immediate next step&#10;• Strategic insight"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 active:scale-98 transition-transform cursor-pointer"
            >
              {editingNoteId ? 'Update Note' : '＋ Save Note to Vault'}
            </button>
          </form>
        </div>

        {/* Notes Grid & Filter Bar (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search notes by title, notebook, tags, or content..."
                className="h-9 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Notebook Filters */}
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                All Notebooks ({notes.length})
              </button>
              {allCategories.map(cat => {
                const count = notes.filter(n => n.category === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredNotes.length === 0 ? (
              <div className="col-span-full py-16 text-center text-xs text-slate-400">
                No notes found matching your search or filters. Create your first note.
              </div>
            ) : (
              filteredNotes.map(n => {
                const theme = getTheme(n.color);
                return (
                  <div
                    key={n.id}
                    onClick={() => setViewingNote(n)}
                    className={`group relative rounded-2xl border p-4 shadow-xs transition-all card-hover flex flex-col justify-between cursor-pointer ${theme.cardClass}`}
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            {n.pinned && (
                              <Pin className="h-3 w-3 text-amber-500 fill-current shrink-0" />
                            )}
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                              {n.title}
                            </h3>
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400 truncate max-w-[100px]">{n.category}</span>
                            <span>·</span>
                            <span>{n.date}</span>
                          </div>
                        </div>

                        {/* Action buttons (Edit, Delete, Pin, Copy) */}
                        <div
                          className="flex items-center gap-0.5 shrink-0"
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={(e) => handleTogglePin(n, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 transition-colors"
                            title={n.pinned ? 'Unpin note' : 'Pin note to top'}
                          >
                            <Star className={`h-3.5 w-3.5 ${n.pinned ? 'text-amber-500 fill-current' : ''}`} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleCopyNote(n, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-colors"
                            title="Copy note text"
                          >
                            {copiedId === n.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleExportNote(n, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-colors"
                            title="Export markdown"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          
                          {/* EDIT BUTTON: Opens dedicated modal */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(n);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-400 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                            title="Edit note"
                            aria-label="Edit note"
                          >
                            <Edit3 className="h-3.5 w-3.5 text-indigo-500" />
                          </button>

                          {/* DELETE BUTTON */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteClick(n, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete note"
                            aria-label="Delete note"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                          </button>
                        </div>
                      </div>

                      {/* Content Preview */}
                      <div className="mt-2.5 text-xs text-slate-700 dark:text-slate-300 max-h-32 overflow-hidden line-clamp-4 leading-relaxed whitespace-pre-line">
                        {n.body || n.html?.replace(/<br\s*[\/]?>/gi, '\n').replace(/<[^>]*>/g, '')}
                      </div>

                      {/* Pointwise structured list */}
                      {n.points && (
                        <div className="mt-2.5 rounded-xl bg-slate-900/5 dark:bg-white/5 p-2 font-mono text-[10px] text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                          {n.points}
                        </div>
                      )}
                    </div>

                    {/* Tags at bottom */}
                    {n.tags && (
                      <div className="mt-3 flex flex-wrap gap-1 pt-2 border-t border-black/5 dark:border-white/5">
                        {n.tags.split(',').map(tag => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-md bg-white/60 dark:bg-slate-800/60 px-1.5 py-0.5 text-[9px] font-medium text-slate-600 dark:text-slate-300"
                          >
                            #{tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* DEDICATED EDIT NOTE MODAL */}
      {editingModalNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                  <Edit3 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Edit Note
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Modify title, notebook, content, points, and tags.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingModalNote(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModalNote} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Note Title
                </label>
                <input
                  type="text"
                  required
                  value={modalTitle}
                  onChange={e => setModalTitle(e.target.value)}
                  placeholder="Note title..."
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Notebook
                  </label>
                  <select
                    value={modalCategory}
                    onChange={e => setModalCategory(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {allCategories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="__custom">+ Custom Notebook...</option>
                  </select>
                  {modalCategory === '__custom' && (
                    <input
                      type="text"
                      required
                      placeholder="Notebook name"
                      value={modalCustomCat}
                      onChange={e => setModalCustomCat(e.target.value)}
                      className="mt-1.5 h-8 w-full rounded-lg border border-indigo-200 px-2.5 text-xs dark:border-indigo-700 dark:bg-slate-800 dark:text-white"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={modalTags}
                    onChange={e => setModalTags(e.target.value)}
                    placeholder="ideas, plans"
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Theme & Pin */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Theme Palette
                  </label>
                  <div className="mt-1.5 flex items-center gap-2">
                    {Object.entries(themePalettes).map(([k, t]) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setModalColor(k)}
                        className={`flex h-7 w-7 items-center justify-center rounded-xl border transition-all cursor-pointer ${
                          modalColor === k
                            ? 'border-indigo-600 ring-2 ring-indigo-500/30 scale-105'
                            : 'border-slate-200 dark:border-slate-700 hover:scale-105'
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

                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer pt-2 sm:pt-4">
                  <input
                    type="checkbox"
                    checked={modalPinned}
                    onChange={e => setModalPinned(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                  <span>Pin note to top</span>
                </label>
              </div>

              {/* Note Content Editor */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Note Content
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {modalContent.length} chars
                  </span>
                </div>
                <textarea
                  rows={8}
                  value={modalContent}
                  onChange={e => setModalContent(e.target.value)}
                  placeholder="Note body content..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white leading-relaxed"
                />
              </div>

              {/* Pointwise structured takeaways */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Pointwise Takeaways (1 line = 1 point)
                </label>
                <textarea
                  rows={2}
                  value={modalPoints}
                  onChange={e => setModalPoints(e.target.value)}
                  placeholder="• Key takeaway point"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const toDelete = editingModalNote;
                    setEditingModalNote(null);
                    setNoteToDelete(toDelete);
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Note</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingModalNote(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW NOTE MODAL (When clicking a card) */}
      {viewingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  {viewingNote.pinned && (
                    <Pin className="h-3.5 w-3.5 text-amber-500 fill-current shrink-0" />
                  )}
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {viewingNote.title}
                  </h3>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {viewingNote.category}
                  </span>
                  <span>·</span>
                  <span>{viewingNote.date}</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(viewingNote)}
                  className="rounded-xl p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
                  title="Edit Note"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const toDelete = viewingNote;
                    setViewingNote(null);
                    setNoteToDelete(toDelete);
                  }}
                  className="rounded-xl p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 cursor-pointer"
                  title="Delete Note"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewingNote(null)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {/* Content */}
              <div className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line">
                {viewingNote.body || viewingNote.html?.replace(/<br\s*[\/]?>/gi, '\n').replace(/<[^>]*>/g, '')}
              </div>

              {/* Points */}
              {viewingNote.points && (
                <div className="rounded-2xl bg-slate-100/70 dark:bg-slate-800/60 p-3.5 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed border border-slate-200/50 dark:border-slate-700/50">
                  <div className="font-sans font-bold text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Action Takeaways
                  </div>
                  {viewingNote.points}
                </div>
              )}

              {/* Tags */}
              {viewingNote.tags && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {viewingNote.tags.split(',').map(tag => (
                    <span
                      key={tag}
                      className="rounded-lg bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400"
                    >
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyNote(viewingNote)}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 dark:text-slate-400 cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportNote(viewingNote)}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 dark:text-slate-400 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export .md</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleOpenEditModal(viewingNote)}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 cursor-pointer"
              >
                Edit Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={Boolean(noteToDelete)}
        title="Delete Note?"
        message={
          noteToDelete
            ? `Are you sure you want to delete "${noteToDelete.title}"? This note will be permanently removed from your vault.`
            : ''
        }
        confirmText="Delete Note"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setNoteToDelete(null)}
      />
    </div>
  );
};
