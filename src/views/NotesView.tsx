import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search, Trash2, Edit3,
  Star, Copy, Check, Download, Pin, Filter, X,
  Folder, BookOpen, Sparkles, Volume2
} from 'lucide-react';
import { Note } from '../types';
import { storage, generateUUID } from '../lib/storage';
import { ConfirmModal } from '../components/ConfirmModal';
import { AttachmentUploader, AttachmentViewer, StoredAttachmentMeta } from '../components/AttachmentUploader';
import { NoteRichEditor } from '../components/NoteRichEditor';
import { globalTextReader } from '../lib/voiceService';

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
  const [isPinned, setIsPinned] = useState(false);
  const [editorText, setEditorText] = useState('');
  const [editorHtml, setEditorHtml] = useState('');
  const [attachments, setAttachments] = useState<StoredAttachmentMeta[]>([]);
  
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
  const [modalPinned, setModalPinned] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [modalHtml, setModalHtml] = useState('');
  const [modalAttachments, setModalAttachments] = useState<StoredAttachmentMeta[]>([]);
  const [isSpeakingNote, setIsSpeakingNote] = useState(false);
  const [speakingNoteCardId, setSpeakingNoteCardId] = useState<string | null>(null);

  // Toggle read note aloud for individual note card
  const toggleSpeakNoteCard = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    if (speakingNoteCardId === note.id) {
      globalTextReader.stop();
      setSpeakingNoteCardId(null);
    } else {
      globalTextReader.stop();
      const textToRead = (note.title ? note.title + '. ' : '') + (note.body || note.html?.replace(/<[^>]+>/g, ' ') || '');
      if (!textToRead.trim()) return;
      setSpeakingNoteCardId(note.id);
      globalTextReader.speak(textToRead, {
        onStateChange: (st) => {
          if (!st.isSpeaking) {
            setSpeakingNoteCardId(null);
          }
        }
      });
    }
  };

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
    setModalPinned(Boolean(note.pinned));
    const content = note.body || note.html || '';
    const htmlContent = note.html || (note.body ? note.body.replace(/\n/g, '<br/>') : '');
    setModalContent(content);
    setModalHtml(htmlContent);
    const parsedAtts: StoredAttachmentMeta[] = (note.attachments || []).map(a => {
      try {
        return typeof a === 'string' ? JSON.parse(a) : a;
      } catch {
        return { id: a, name: a, type: 'file', size: 0 };
      }
    });
    setModalAttachments(parsedAtts);
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
    setIsPinned(Boolean(note.pinned));
    const content = note.body || note.html || '';
    const htmlContent = note.html || (note.body ? note.body.replace(/\n/g, '<br/>') : '');
    setEditorText(content);
    setEditorHtml(htmlContent);
    const parsedAtts: StoredAttachmentMeta[] = (note.attachments || []).map(a => {
      try {
        return typeof a === 'string' ? JSON.parse(a) : a;
      } catch {
        return { id: a, name: a, type: 'file', size: 0 };
      }
    });
    setAttachments(parsedAtts);

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
    const html = editorHtml || (editorText ? editorText.replace(/\n/g, '<br/>') : '');

    const serializedAttachments = attachments.map(a => JSON.stringify(a));

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
          color: colorTheme,
          pinned: isPinned,
          attachments: serializedAttachments.length > 0 ? serializedAttachments : undefined,
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
        color: colorTheme,
        pinned: isPinned,
        attachments: serializedAttachments.length > 0 ? serializedAttachments : undefined,
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
    const html = modalHtml || (modalContent ? modalContent.replace(/\n/g, '<br/>') : '');
    const serializedModalAttachments = modalAttachments.map(a => JSON.stringify(a));

    const updated: Note = {
      ...editingModalNote,
      title: modalTitle.trim(),
      body,
      html,
      category: finalCategory,
      tags: modalTags.trim() || undefined,
      color: modalColor,
      pinned: modalPinned,
      attachments: serializedModalAttachments.length > 0 ? serializedModalAttachments : undefined,
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
    const fullText = `${note.title}\n\n${note.body || ''}`;
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
    const fullText = `# ${note.title}\nDate: ${note.date} | Notebook: ${note.category}\nTags: ${note.tags || 'none'}\n\n${note.body || ''}`;
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
    setIsPinned(false);
    setEditorText('');
    setEditorHtml('');
    setCustomCategoryInput('');
    setAttachments([]);
  };

  const filteredNotes = notes.filter(n => {
    if (selectedCategory !== 'all' && n.category !== selectedCategory) return false;
    if (colorFilter !== 'all' && n.color !== colorFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const hay = `${n.title} ${n.body} ${n.tags || ''} ${n.category}`.toLowerCase();
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
            Organized knowledge vaults, rich text formatting, color palettes, attachments, and markdown export.
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
          className={`lg:col-span-5 rounded-2xl border transition-all ${
            editingNoteId
              ? 'border-indigo-400 bg-indigo-50/20 dark:border-indigo-500/50 dark:bg-indigo-950/20 ring-2 ring-indigo-500/20'
              : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
          } p-5 sm:p-6 shadow-xs`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 dark:border-slate-800">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 text-xs">
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

            {/* Note Content Writing Canvas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Notebook Canvas & Rich Formatting</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                  <span>Tables · Custom Bullets · 24+ Colors</span>
                </div>
              </div>
              <NoteRichEditor
                initialHtml={editorHtml}
                onChange={(html, text) => {
                  setEditorHtml(html);
                  setEditorText(text);
                }}
                placeholder="Start typing your note... Use custom bullets (🎯, ⚡), tables, 24+ colors, and paragraph justify (Ctrl+J)."
                minHeight="min-h-[220px]"
                maxHeight="max-h-[460px]"
              />
            </div>

            {/* Attached Files Section */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 dark:border-slate-800 dark:bg-slate-800/40">
              <AttachmentUploader
                attachments={attachments}
                onChange={setAttachments}
                label="Attach Files & Images"
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
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800/80 dark:bg-slate-900 space-y-3.5">
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
            <div className="flex overflow-x-auto pb-1 gap-2 no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`rounded-xl px-3 py-1.5 text-xs sm:text-sm font-semibold whitespace-nowrap tracking-normal transition-all cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/80'
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
                    className={`rounded-xl px-3 py-1.5 text-xs sm:text-sm font-semibold whitespace-nowrap tracking-normal transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/80'
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
                          
                          {/* READ ALOUD (LISTEN) BUTTON */}
                          <button
                            type="button"
                            onClick={(e) => toggleSpeakNoteCard(n, e)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              speakingNoteCardId === n.id
                                ? 'bg-indigo-600 text-white animate-pulse shadow-xs'
                                : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-400'
                            }`}
                            title={speakingNoteCardId === n.id ? "Stop reading" : "Read note aloud (Hindi & English)"}
                            aria-label="Read note aloud"
                          >
                            <Volume2 className={`h-3.5 w-3.5 ${speakingNoteCardId === n.id ? 'animate-bounce' : ''}`} />
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
                      <div 
                        className="mt-2.5 text-xs text-slate-700 dark:text-slate-300 max-h-36 overflow-hidden line-clamp-4 leading-relaxed [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-bold [&_blockquote]:italic [&_blockquote]:pl-2 [&_blockquote]:border-l-2 [&_blockquote]:border-indigo-400 [&_table]:w-full [&_table]:border-collapse [&_table]:text-[10px] [&_th]:border [&_th]:border-slate-300 dark:[&_th]:border-slate-700 [&_th]:p-1 [&_td]:border [&_td]:border-slate-300 dark:[&_td]:border-slate-700 [&_td]:p-1"
                        dangerouslySetInnerHTML={{ __html: n.html || (n.body ? n.body.replace(/\n/g, '<br/>') : '') }}
                      />

                      {/* Attached Files indicator / chips */}
                      {n.attachments && n.attachments.length > 0 && (
                        <div className="mt-2.5 pt-1.5 border-t border-black/5 dark:border-white/5">
                          <AttachmentViewer attachments={n.attachments} compact={true} />
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

              {/* Note Content Writing Canvas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Note Body & Formatting Studio</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <span>Full Table & Custom Bullets Active</span>
                  </div>
                </div>
                <NoteRichEditor
                  initialHtml={modalHtml}
                  onChange={(html, text) => {
                    setModalHtml(html);
                    setModalContent(text);
                  }}
                  placeholder="Edit your note with rich styles, custom bullets, 24+ colors, tables, and paragraph justify..."
                  minHeight="min-h-[260px]"
                  maxHeight="max-h-[480px]"
                />
              </div>

              {/* Edit Modal Attachments */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 dark:border-slate-800 dark:bg-slate-800/40">
                <AttachmentUploader
                  attachments={modalAttachments}
                  onChange={setModalAttachments}
                  label="Attach Files & Images"
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
                  onClick={() => {
                    const text = viewingNote.body || viewingNote.html?.replace(/<[^>]+>/g, ' ') || '';
                    if (isSpeakingNote) {
                      globalTextReader.stop();
                      setIsSpeakingNote(false);
                    } else {
                      globalTextReader.speak(text, {
                        onStateChange: (st) => setIsSpeakingNote(st.isSpeaking)
                      });
                      setIsSpeakingNote(true);
                    }
                  }}
                  className={`rounded-xl p-1.5 transition-colors cursor-pointer ${
                    isSpeakingNote
                      ? 'bg-indigo-600 text-white animate-pulse'
                      : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                  title={isSpeakingNote ? 'Stop Reading' : 'Read Note Aloud (Hindi & English)'}
                >
                  <Volume2 className={`h-4 w-4 ${isSpeakingNote ? 'animate-bounce' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isSpeakingNote) {
                      globalTextReader.stop();
                      setIsSpeakingNote(false);
                    }
                    setViewingNote(null);
                  }}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {/* Content */}
              <div 
                className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 prose dark:prose-invert max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:my-0.5 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:my-2.5 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:my-2 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:my-1.5 [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-400 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:my-2 [&_blockquote]:text-slate-600 dark:[&_blockquote]:text-slate-300 [&_pre]:bg-slate-100 dark:[&_pre]:bg-slate-800 [&_pre]:p-2.5 [&_pre]:rounded-xl [&_pre]:font-mono [&_pre]:text-xs [&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_table]:border [&_table]:border-slate-300 dark:[&_table]:border-slate-700 [&_table]:rounded-xl [&_table]:overflow-hidden [&_th]:border [&_th]:border-slate-300 dark:[&_th]:border-slate-700 [&_th]:bg-slate-100 dark:[&_th]:bg-slate-800 [&_th]:p-2.5 [&_th]:font-bold [&_th]:text-left [&_th]:text-xs [&_td]:border [&_td]:border-slate-300 dark:[&_td]:border-slate-700 [&_td]:p-2.5 [&_td]:text-xs [&_tr:nth-child(even)]:bg-slate-50/70 dark:[&_tr:nth-child(even)]:bg-slate-800/40"
                dangerouslySetInnerHTML={{ __html: viewingNote.html || (viewingNote.body ? viewingNote.body.replace(/\n/g, '<br/>') : '') }}
              />

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

              {/* Attachments in Viewing Modal */}
              {viewingNote.attachments && viewingNote.attachments.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <AttachmentViewer attachments={viewingNote.attachments} />
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
