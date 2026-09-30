import React, { useRef, useEffect, useState } from 'react';
import {
  Bold, Italic, Underline, Strikethrough,
  List, Palette, Highlighter,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Indent, Outdent, RemoveFormatting, Table as TableIcon,
  ChevronDown, Plus, Minus, Trash2, Sparkles,
  Grid, Volume2, Type
} from 'lucide-react';
import { TextReaderController, VoiceLanguage, isSpeechSynthesisSupported } from '../lib/voiceService';

interface NoteRichEditorProps {
  initialHtml?: string;
  onChange: (html: string, plainText: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  className?: string;
}

// 24 Curated Rich Text Colors
const COLOR_PALETTES = [
  {
    category: 'Neutral & Dark',
    colors: [
      { name: 'Default', value: 'inherit' },
      { name: 'Black', value: '#0f172a' },
      { name: 'Slate Gray', value: '#475569' },
      { name: 'Muted Gray', value: '#94a3b8' }
    ]
  },
  {
    category: 'Reds & Warm',
    colors: [
      { name: 'Crimson Red', value: '#dc2626' },
      { name: 'Rose Red', value: '#e11d48' },
      { name: 'Coral Pink', value: '#f43f5e' },
      { name: 'Deep Orange', value: '#ea580c' },
      { name: 'Amber Bronze', value: '#d97706' }
    ]
  },
  {
    category: 'Greens & Teals',
    colors: [
      { name: 'Forest Green', value: '#15803d' },
      { name: 'Emerald', value: '#059669' },
      { name: 'Mint Green', value: '#10b981' },
      { name: 'Teal Green', value: '#0d9488' }
    ]
  },
  {
    category: 'Blues & Cyans',
    colors: [
      { name: 'Deep Royal', value: '#1d4ed8' },
      { name: 'Ocean Blue', value: '#2563eb' },
      { name: 'Vibrant Indigo', value: '#4f46e5' },
      { name: 'Sky Cyan', value: '#0284c7' },
      { name: 'Bright Cyan', value: '#0891b2' }
    ]
  },
  {
    category: 'Purples & Violets',
    colors: [
      { name: 'Electric Violet', value: '#7c3aed' },
      { name: 'Deep Purple', value: '#9333ea' },
      { name: 'Orchid Purple', value: '#a855f7' },
      { name: 'Magenta Fuchsia', value: '#c026d3' }
    ]
  }
];

// Highlight Colors
const HIGHLIGHT_COLORS = [
  { name: 'Clear / None', value: 'transparent', label: '✕ None' },
  { name: 'Pastel Yellow', value: '#fef08a', label: 'Yellow' },
  { name: 'Pastel Mint', value: '#bbf7d0', label: 'Mint' },
  { name: 'Pastel Sky', value: '#bae6fd', label: 'Sky' },
  { name: 'Pastel Rose', value: '#fbcfe8', label: 'Rose' },
  { name: 'Pastel Lavender', value: '#e9d5ff', label: 'Lavender' },
  { name: 'Warm Apricot', value: '#fed7aa', label: 'Apricot' },
  { name: 'Neon Lemon', value: '#fef9c3', label: 'Bright Lemon' },
  { name: 'Soft Silver', value: '#e2e8f0', label: 'Silver' }
];

// Preset Bullet Symbols
const BULLET_STYLES = [
  { id: 'disc', symbol: '•', label: 'Standard Disc (•)' },
  { id: 'circle', symbol: '○', label: 'Hollow Circle (○)' },
  { id: 'square', symbol: '■', label: 'Solid Square (■)' },
  { id: 'arrow', symbol: '➤', label: 'Forward Arrow (➤)' },
  { id: 'star', symbol: '★', label: 'Golden Star (★)' },
  { id: 'diamond', symbol: '◆', label: 'Diamond (◆)' },
  { id: 'check', symbol: '✓', label: 'Checkmark (✓)' },
  { id: 'box', symbol: '☐', label: 'Task Checkbox (☐)' },
  { id: 'target', symbol: '🎯', label: 'Target Emoji (🎯)' },
  { id: 'spark', symbol: '⚡', label: 'Lightning (⚡)' },
  { id: 'light', symbol: '💡', label: 'Idea Bulb (💡)' },
  { id: 'pin', symbol: '📌', label: 'Pushpin (📌)' }
];

// Preset Numbering Styles
const NUMBER_STYLES = [
  { id: 'decimal', label: '1. 2. 3. (Decimal)', prefix: '1.', type: '1' },
  { id: 'lower-alpha', label: 'a. b. c. (Lowercase)', prefix: 'a.', type: 'a' },
  { id: 'upper-alpha', label: 'A. B. C. (Uppercase)', prefix: 'A.', type: 'A' },
  { id: 'lower-roman', label: 'i. ii. iii. (Roman)', prefix: 'i.', type: 'i' },
  { id: 'upper-roman', label: 'I. II. III. (Roman Upper)', prefix: 'I.', type: 'I' },
  { id: 'circled', label: '① ② ③ (Circled Numbers)', prefix: '①', type: 'circled' }
];

export const NoteRichEditor: React.FC<NoteRichEditorProps> = ({
  initialHtml = '',
  onChange,
  placeholder = '',
  minHeight = 'min-h-[240px]',
  maxHeight = 'max-h-[500px]',
  className = ''
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);

  // Popover controls
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showBulletMenu, setShowBulletMenu] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState(false);

  // Custom Color Input State
  const [customTextColor, setCustomTextColor] = useState('#4f46e5');
  const [customHighlightColor, setCustomHighlightColor] = useState('#fef08a');

  // Custom Bullet/Number State
  const [customBulletInput, setCustomBulletInput] = useState('');
  const [customNumberPrefix, setCustomNumberPrefix] = useState('Step');

  // Table Creation Grid State
  const [tableGridHover, setTableGridHover] = useState({ rows: 3, cols: 3 });
  const [tableHasHeader, setTableHasHeader] = useState(true);

  // Active styles in toolbar
  const [activeStyle, setActiveStyle] = useState('p');
  const [activeSize, setActiveSize] = useState('3');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // Text Reading State
  const [isEditorSpeaking, setIsEditorSpeaking] = useState(false);
  const [isEditorPaused, setIsEditorPaused] = useState(false);
  const [editorReaderLang] = useState<VoiceLanguage>('hi-IN');
  const readerRef = useRef<TextReaderController | null>(null);

  // Clean up voice reader on unmount
  useEffect(() => {
    return () => {
      readerRef.current?.stop();
    };
  }, []);

  const toggleEditorReading = () => {
    if (!isSpeechSynthesisSupported()) {
      console.warn('Text reading is not supported on this browser.');
      return;
    }

    if (!isEditorSpeaking) {
      const text = editorRef.current?.innerText || '';
      if (!text.trim()) return;
      if (!readerRef.current) readerRef.current = new TextReaderController();
      readerRef.current.speak(text, {
        lang: editorReaderLang,
        onStateChange: (st) => {
          setIsEditorSpeaking(st.isSpeaking);
          setIsEditorPaused(st.isPaused);
        }
      });
      setIsEditorSpeaking(true);
    } else {
      readerRef.current?.stop();
      setIsEditorSpeaking(false);
      setIsEditorPaused(false);
    }
  };

  // Sync initialHtml only when changed externally
  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      if (editorRef.current.innerHTML !== initialHtml) {
        editorRef.current.innerHTML = initialHtml || '';
        updateStats();
      }
    }
  }, [initialHtml]);

  const updateStats = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    setCharCount(text.length);
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    setWordCount(words);
  };

  const exec = (cmd: string, val: string | null = null) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(cmd, false, val || undefined);
    handleEditorInput();
  };

  const handleEditorInput = () => {
    if (!editorRef.current) return;
    isUpdatingRef.current = true;
    const html = editorRef.current.innerHTML;
    const text = editorRef.current.innerText || '';
    updateStats();
    onChange(html, text);
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        exec('bold');
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        exec('italic');
      } else if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        exec('underline');
      } else if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        exec('justifyFull');
      }
    }
  };

  const handleApplyStyle = (tag: string) => {
    setActiveStyle(tag);
    if (tag === 'p') exec('formatBlock', '<p>');
    else if (tag === 'h1') exec('formatBlock', '<h1>');
    else if (tag === 'h2') exec('formatBlock', '<h2>');
    else if (tag === 'h3') exec('formatBlock', '<h3>');
    else if (tag === 'blockquote') exec('formatBlock', '<blockquote>');
    else if (tag === 'pre') exec('formatBlock', '<pre>');
  };

  const handleApplySize = (sizeVal: string) => {
    setActiveSize(sizeVal);
    exec('fontSize', sizeVal);
  };

  const closeAllPopovers = () => {
    setShowColorPicker(false);
    setShowHighlightPicker(false);
    setShowBulletMenu(false);
    setShowTableMenu(false);
  };

  // Insert Custom Bullet or Preset Bullet
  const insertCustomBulletList = (symbol: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    if (symbol === '•') {
      exec('insertUnorderedList');
      closeAllPopovers();
      return;
    }

    const selection = window.getSelection();
    const selectedText = selection ? selection.toString() : '';
    const itemContent = selectedText.trim() || 'List item';

    const bulletHtml = `<div style="display: flex; align-items: flex-start; margin: 4px 0;"><span style="color: #6366f1; font-weight: bold; margin-right: 8px; user-select: none;">${symbol}</span><span>${itemContent}</span></div>`;
    document.execCommand('insertHTML', false, bulletHtml);
    handleEditorInput();
    closeAllPopovers();
  };

  // Insert Numbered List with custom style
  const insertCustomNumberedList = (styleType: string, customPrefix?: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    if (styleType === '1' && !customPrefix) {
      exec('insertOrderedList');
      closeAllPopovers();
      return;
    }

    const selection = window.getSelection();
    const selectedText = selection ? selection.toString() : '';
    const itemContent = selectedText.trim() || 'First item';

    let itemHtml = '';
    if (customPrefix) {
      itemHtml = `<div style="display: flex; align-items: flex-start; margin: 4px 0;"><span style="color: #6366f1; font-weight: 700; margin-right: 8px;">${customPrefix} 1:</span><span>${itemContent}</span></div>`;
    } else if (styleType === 'circled') {
      itemHtml = `<div style="display: flex; align-items: flex-start; margin: 4px 0;"><span style="color: #6366f1; font-weight: bold; margin-right: 8px;">①</span><span>${itemContent}</span></div>`;
    } else {
      itemHtml = `<ol type="${styleType}" style="margin: 6px 0; padding-left: 24px;"><li>${itemContent}</li></ol>`;
    }

    document.execCommand('insertHTML', false, itemHtml);
    handleEditorInput();
    closeAllPopovers();
  };

  // Insert HTML Table
  const insertTable = (rows: number, cols: number, withHeader: boolean = true) => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    let tableHtml = `<table style="width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; border: 1px solid #cbd5e1;" data-om-table="true">`;

    if (withHeader) {
      tableHtml += `<thead><tr style="background-color: #f1f5f9;">`;
      for (let c = 1; c <= cols; c++) {
        tableHtml += `<th style="border: 1px solid #cbd5e1; padding: 8px 12px; font-weight: bold; text-align: left; background-color: #f8fafc; color: #1e293b;">Header ${c}</th>`;
      }
      tableHtml += `</tr></thead>`;
    }

    tableHtml += `<tbody>`;
    const numRows = withHeader ? rows - 1 : rows;
    for (let r = 1; r <= Math.max(1, numRows); r++) {
      const bg = r % 2 === 0 ? 'background-color: #f8fafc;' : 'background-color: #ffffff;';
      tableHtml += `<tr style="${bg}">`;
      for (let c = 1; c <= cols; c++) {
        tableHtml += `<td style="border: 1px solid #cbd5e1; padding: 8px 12px; min-width: 60px;">Cell ${r},${c}</td>`;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table><p><br/></p>`;

    document.execCommand('insertHTML', false, tableHtml);
    handleEditorInput();
    setShowTableMenu(false);
  };

  // Table Manipulation Helpers
  const addTableRow = () => {
    if (!editorRef.current) return;
    const selection = window.getSelection();
    if (!selection || !selection.anchorNode) return;
    let node: Node | null = selection.anchorNode;
    let tr: HTMLTableRowElement | null = null;
    let table: HTMLTableElement | null = null;

    while (node && node !== editorRef.current) {
      if (node.nodeName === 'TR') tr = node as HTMLTableRowElement;
      if (node.nodeName === 'TABLE') table = node as HTMLTableElement;
      node = node.parentNode;
    }

    if (table) {
      const numCols = table.rows[0]?.cells.length || 2;
      const newRow = table.insertRow(tr ? tr.rowIndex + 1 : -1);
      newRow.style.backgroundColor = '#ffffff';
      for (let i = 0; i < numCols; i++) {
        const newCell = newRow.insertCell(i);
        newCell.style.border = '1px solid #cbd5e1';
        newCell.style.padding = '8px 12px';
        newCell.innerText = 'New Data';
      }
      handleEditorInput();
    }
  };

  const addTableColumn = () => {
    if (!editorRef.current) return;
    const selection = window.getSelection();
    if (!selection || !selection.anchorNode) return;
    let node: Node | null = selection.anchorNode;
    let table: HTMLTableElement | null = null;

    while (node && node !== editorRef.current) {
      if (node.nodeName === 'TABLE') table = node as HTMLTableElement;
      node = node.parentNode;
    }

    if (table) {
      for (let r = 0; r < table.rows.length; r++) {
        const row = table.rows[r];
        const isHeader = row.parentElement?.nodeName === 'THEAD' || row.cells[0]?.nodeName === 'TH';
        const cell = isHeader ? document.createElement('th') : row.insertCell(-1);
        cell.style.border = '1px solid #cbd5e1';
        cell.style.padding = '8px 12px';
        cell.innerText = isHeader ? `Header ${row.cells.length + 1}` : 'New';
        if (isHeader) {
          cell.style.fontWeight = 'bold';
          cell.style.textAlign = 'left';
          cell.style.backgroundColor = '#f8fafc';
          row.appendChild(cell);
        }
      }
      handleEditorInput();
    }
  };

  const deleteTableRow = () => {
    if (!editorRef.current) return;
    const selection = window.getSelection();
    if (!selection || !selection.anchorNode) return;
    let node: Node | null = selection.anchorNode;
    let tr: HTMLTableRowElement | null = null;
    let table: HTMLTableElement | null = null;

    while (node && node !== editorRef.current) {
      if (node.nodeName === 'TR') tr = node as HTMLTableRowElement;
      if (node.nodeName === 'TABLE') table = node as HTMLTableElement;
      node = node.parentNode;
    }

    if (table && tr) {
      table.deleteRow(tr.rowIndex);
      handleEditorInput();
    }
  };

  const deleteTable = () => {
    if (!editorRef.current) return;
    const selection = window.getSelection();
    if (!selection || !selection.anchorNode) return;
    let node: Node | null = selection.anchorNode;
    let table: HTMLTableElement | null = null;

    while (node && node !== editorRef.current) {
      if (node.nodeName === 'TABLE') table = node as HTMLTableElement;
      node = node.parentNode;
    }

    if (table) {
      table.remove();
      handleEditorInput();
    }
  };

  return (
    <div className={`relative rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/95 shadow-sm transition-all focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500/80 overflow-hidden ${className}`}>
      {/* ========================================================================= */}
      {/* REFINED NOTEBOOK TOOLBAR (Sleek, tactile, premium stationery styling)    */}
      {/* ========================================================================= */}
      <div className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-xs px-2.5 py-1.5">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth py-0.5">
          {/* Paragraph Style */}
          <div className="relative shrink-0">
            <select
              value={activeStyle}
              onChange={(e) => handleApplyStyle(e.target.value)}
              className="h-7.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 pl-2 pr-6 text-[11px] font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs appearance-none"
              title="Typography Style"
            >
              <option value="p">Paragraph</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
              <option value="blockquote">Quote Block</option>
              <option value="pre">Code Block</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-1.5 top-2.5 h-3 w-3 text-slate-400" />
          </div>

          {/* Text Size */}
          <div className="relative shrink-0">
            <select
              value={activeSize}
              onChange={(e) => handleApplySize(e.target.value)}
              className="h-7.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 pl-2 pr-5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs appearance-none"
              title="Text Size"
            >
              <option value="2">12px</option>
              <option value="3">14px</option>
              <option value="4">16px</option>
              <option value="5">18px</option>
              <option value="6">24px</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-1.5 top-2.5 h-3 w-3 text-slate-400" />
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700/70 mx-0.5 shrink-0" />

          {/* Inline Formats: Bold, Italic, Underline, Strike */}
          <div className="flex items-center gap-0.5 bg-white dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/70 dark:border-slate-700/70 shrink-0 shadow-2xs">
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); exec('bold'); }}
              className="flex h-6.5 w-6.5 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400"
              title="Bold (Ctrl+B)"
            >
              <Bold className="h-3.5 w-3.5 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); exec('italic'); }}
              className="flex h-6.5 w-6.5 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400"
              title="Italic (Ctrl+I)"
            >
              <Italic className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); exec('underline'); }}
              className="flex h-6.5 w-6.5 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400"
              title="Underline (Ctrl+U)"
            >
              <Underline className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); exec('strikeThrough'); }}
              className="flex h-6.5 w-6.5 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400"
              title="Strikethrough"
            >
              <Strikethrough className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700/70 mx-0.5 shrink-0" />

          {/* Text Color Picker */}
          <div className="relative shrink-0">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setShowColorPicker(!showColorPicker);
                setShowHighlightPicker(false);
                setShowBulletMenu(false);
                setShowTableMenu(false);
              }}
              className={`flex h-7.5 items-center gap-1.5 rounded-lg px-2 text-[11px] font-semibold border transition-all cursor-pointer shadow-2xs ${
                showColorPicker
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-700 dark:text-indigo-300'
                  : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60'
              }`}
              title="Rich Text Color Palette"
            >
              <Palette className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Color</span>
              <ChevronDown className="h-2.5 w-2.5 opacity-60" />
            </button>

            {/* Extensive Color Palette Popover */}
            {showColorPicker && (
              <div
                className="absolute left-0 top-9 z-[60] w-72 max-w-[calc(100vw-32px)] rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xl dark:border-slate-700 dark:bg-slate-900 animate-in fade-in duration-100"
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100">
                    Text Colors
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">24+ Palettes</span>
                </div>

                <div className="mt-2.5 space-y-2.5 max-h-56 overflow-y-auto pr-1 no-scrollbar">
                  {COLOR_PALETTES.map((cat) => (
                    <div key={cat.category}>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        {cat.category}
                      </div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {cat.colors.map((c) => (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => {
                              exec('foreColor', c.value);
                              setShowColorPicker(false);
                            }}
                            className="group relative flex h-7 items-center justify-center rounded-lg border border-slate-200/80 dark:border-slate-700 hover:scale-105 transition-all cursor-pointer shadow-2xs"
                            style={{ backgroundColor: c.value === 'inherit' ? '#ffffff' : c.value }}
                            title={c.name}
                          >
                            {c.value === 'inherit' && (
                              <span className="text-[10px] font-bold text-slate-700">Auto</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Custom Hex Color Picker */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={customTextColor}
                      onChange={(e) => setCustomTextColor(e.target.value)}
                      className="h-7 w-7 rounded-lg border-0 p-0 cursor-pointer bg-transparent"
                      title="Pick custom hex color"
                    />
                    <input
                      type="text"
                      value={customTextColor}
                      onChange={(e) => setCustomTextColor(e.target.value)}
                      className="h-7 w-20 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 font-mono text-[10px] uppercase text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      exec('foreColor', customTextColor);
                      setShowColorPicker(false);
                    }}
                    className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs hover:bg-indigo-500 cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Highlight Color Picker */}
          <div className="relative shrink-0">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setShowHighlightPicker(!showHighlightPicker);
                setShowColorPicker(false);
                setShowBulletMenu(false);
                setShowTableMenu(false);
              }}
              className={`flex h-7.5 items-center gap-1.5 rounded-lg px-2 text-[11px] font-semibold border transition-all cursor-pointer shadow-2xs ${
                showHighlightPicker
                  ? 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/60 dark:border-amber-700 dark:text-amber-300'
                  : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60'
              }`}
              title="Highlight Text Background"
            >
              <Highlighter className="h-3.5 w-3.5 text-amber-500" />
              <span>Highlight</span>
              <ChevronDown className="h-2.5 w-2.5 opacity-60" />
            </button>

            {/* Highlight Palette Popover */}
            {showHighlightPicker && (
              <div
                className="absolute left-0 top-9 z-[60] w-64 max-w-[calc(100vw-32px)] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-700 dark:bg-slate-900 animate-in fade-in duration-100"
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="text-[11px] font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
                  Text Highlighter
                </div>

                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {HIGHLIGHT_COLORS.map((h) => (
                    <button
                      key={h.name}
                      type="button"
                      onClick={() => {
                        exec('hiliteColor', h.value);
                        setShowHighlightPicker(false);
                      }}
                      className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200/80 hover:scale-105 transition-all cursor-pointer text-[10px] font-semibold text-slate-800 dark:text-slate-200"
                      style={{ backgroundColor: h.value }}
                    >
                      <span>{h.label}</span>
                    </button>
                  ))}
                </div>

                {/* Custom Highlight Picker */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Custom:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={customHighlightColor}
                      onChange={(e) => setCustomHighlightColor(e.target.value)}
                      className="h-6 w-6 rounded border-0 p-0 cursor-pointer bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        exec('hiliteColor', customHighlightColor);
                        setShowHighlightPicker(false);
                      }}
                      className="rounded-lg bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-indigo-500 cursor-pointer"
                    >
                      Set
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700/70 mx-0.5 shrink-0" />

          {/* Custom Bullets & Numbers Studio */}
          <div className="relative shrink-0">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setShowBulletMenu(!showBulletMenu);
                setShowColorPicker(false);
                setShowHighlightPicker(false);
                setShowTableMenu(false);
              }}
              className={`flex h-7.5 items-center gap-1.5 rounded-lg px-2 text-[11px] font-semibold border transition-all cursor-pointer shadow-2xs ${
                showBulletMenu
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-700 dark:text-indigo-300'
                  : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60'
              }`}
              title="Custom Bullets & Numbering Studio"
            >
              <List className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Bullets</span>
              <ChevronDown className="h-2.5 w-2.5 opacity-60" />
            </button>

            {/* Custom Bullet / Number Studio Popover */}
            {showBulletMenu && (
              <div
                className="absolute left-0 top-9 z-[60] w-80 max-w-[calc(100vw-32px)] rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xl dark:border-slate-700 dark:bg-slate-900 animate-in fade-in duration-100"
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Bullet & Number Studio</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Custom Styles</span>
                </div>

                {/* Preset Bullet Icons Grid */}
                <div className="mt-2.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Select Bullet Symbol
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {BULLET_STYLES.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => insertCustomBulletList(b.symbol)}
                        className="flex items-center gap-1.5 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-indigo-50 hover:border-indigo-200 dark:hover:bg-slate-800 transition-all cursor-pointer text-left"
                      >
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm leading-none">
                          {b.symbol}
                        </span>
                        <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 truncate">
                          {b.label.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* DEFINE YOUR OWN CUSTOM BULLET */}
                <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                  <div className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Custom Bullet Symbol / Emoji:
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 🎯, ⚡, ✦, 👉, ✓"
                      value={customBulletInput}
                      onChange={(e) => setCustomBulletInput(e.target.value)}
                      className="h-8 flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      disabled={!customBulletInput.trim()}
                      onClick={() => insertCustomBulletList(customBulletInput.trim())}
                      className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-40 cursor-pointer"
                    >
                      Insert
                    </button>
                  </div>
                </div>

                {/* NUMBERING STYLES & CUSTOM PREFIX */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Numbering Formats
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {NUMBER_STYLES.map((ns) => (
                      <button
                        key={ns.id}
                        type="button"
                        onClick={() => insertCustomNumberedList(ns.type)}
                        className="flex items-center gap-1.5 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-800 text-left cursor-pointer"
                      >
                        <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {ns.prefix}
                        </span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-300 truncate">
                          {ns.label.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Custom Number Prefix */}
                  <div className="mt-2.5 flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500">Custom:</span>
                    <input
                      type="text"
                      placeholder="e.g. Step, Point, Day"
                      value={customNumberPrefix}
                      onChange={(e) => setCustomNumberPrefix(e.target.value)}
                      className="h-7 flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-[11px] text-slate-800 dark:text-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => insertCustomNumberedList('1', customNumberPrefix)}
                      className="rounded-lg bg-slate-800 dark:bg-slate-700 px-2 py-1 text-[11px] font-semibold text-white hover:bg-slate-900 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700/70 mx-0.5 shrink-0" />

          {/* Alignment Controls */}
          <div className="flex items-center gap-0.5 bg-white dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/70 dark:border-slate-700/70 shrink-0 shadow-2xs">
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); exec('justifyLeft'); }}
              className="flex h-6.5 w-6.5 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer text-slate-700 dark:text-slate-200 hover:text-indigo-600"
              title="Align Left"
            >
              <AlignLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); exec('justifyCenter'); }}
              className="flex h-6.5 w-6.5 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer text-slate-700 dark:text-slate-200 hover:text-indigo-600"
              title="Align Center"
            >
              <AlignCenter className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); exec('justifyRight'); }}
              className="flex h-6.5 w-6.5 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer text-slate-700 dark:text-slate-200 hover:text-indigo-600"
              title="Align Right"
            >
              <AlignRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); exec('justifyFull'); }}
              className="flex h-6.5 w-6.5 items-center justify-center rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors cursor-pointer text-indigo-600 dark:text-indigo-400 font-bold"
              title="Justify (Ctrl+J)"
            >
              <AlignJustify className="h-3.5 w-3.5 stroke-[2.2]" />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700/70 mx-0.5 shrink-0" />

          {/* Table Insertion */}
          <div className="relative shrink-0">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setShowTableMenu(!showTableMenu);
                setShowColorPicker(false);
                setShowHighlightPicker(false);
                setShowBulletMenu(false);
              }}
              className={`flex h-7.5 items-center gap-1.5 rounded-lg px-2 text-[11px] font-semibold border transition-all cursor-pointer shadow-2xs ${
                showTableMenu
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-700 dark:text-emerald-300'
                  : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60'
              }`}
              title="Insert Table Grid"
            >
              <TableIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Table</span>
              <ChevronDown className="h-2.5 w-2.5 opacity-60" />
            </button>

            {/* Table Dropdown Dialog */}
            {showTableMenu && (
              <div
                className="absolute left-0 sm:left-auto right-0 sm:right-auto top-9 z-[60] w-72 max-w-[calc(100vw-32px)] rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xl dark:border-slate-700 dark:bg-slate-900 animate-in fade-in duration-100"
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Grid className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Insert Table Grid</span>
                  </span>
                  <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold tabular-nums">
                    {tableGridHover.rows} × {tableGridHover.cols}
                  </span>
                </div>

                {/* 6x6 Visual Interactive Grid */}
                <div className="my-3 flex flex-col gap-1 items-center">
                  {[1, 2, 3, 4, 5, 6].map((r) => (
                    <div key={r} className="flex gap-1">
                      {[1, 2, 3, 4, 5, 6].map((c) => {
                        const isHovered = r <= tableGridHover.rows && c <= tableGridHover.cols;
                        return (
                          <div
                            key={c}
                            onMouseEnter={() => setTableGridHover({ rows: r, cols: c })}
                            onClick={() => insertTable(r, c, tableHasHeader)}
                            className={`h-5 w-5 rounded-md border transition-all cursor-pointer ${isHovered ? 'bg-indigo-500 border-indigo-600' : 'bg-slate-100 border-slate-300 dark:bg-slate-800 dark:border-slate-700'}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tableHasHeader}
                      onChange={(e) => setTableHasHeader(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>Header Row</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => insertTable(tableGridHover.rows, tableGridHover.cols, tableHasHeader)}
                    className="rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500 cursor-pointer shadow-xs"
                  >
                    Insert Table
                  </button>
                </div>

                {/* Table Modification Quick Tools */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Active Table Actions
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={addTableRow}
                      className="flex items-center justify-center gap-1 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                      title="Add Row to cursor position"
                    >
                      <Plus className="h-3 w-3 text-emerald-600" />
                      <span>Add Row</span>
                    </button>
                    <button
                      type="button"
                      onClick={addTableColumn}
                      className="flex items-center justify-center gap-1 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                      title="Add Column"
                    >
                      <Plus className="h-3 w-3 text-emerald-600" />
                      <span>Add Col</span>
                    </button>
                    <button
                      type="button"
                      onClick={deleteTableRow}
                      className="flex items-center justify-center gap-1 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      title="Delete Current Row"
                    >
                      <Minus className="h-3 w-3" />
                      <span>Delete Row</span>
                    </button>
                    <button
                      type="button"
                      onClick={deleteTable}
                      className="flex items-center justify-center gap-1 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/30 text-[10px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 cursor-pointer"
                      title="Delete Table"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Delete Table</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700/70 mx-0.5 shrink-0" />

          {/* Indent, Outdent, Clear Formatting */}
          <div className="flex items-center gap-0.5 bg-white dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/70 dark:border-slate-700/70 shrink-0 shadow-2xs">
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); exec('outdent'); }}
              className="flex h-6.5 w-6.5 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer text-slate-700 dark:text-slate-200"
              title="Decrease Indent"
            >
              <Outdent className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); exec('indent'); }}
              className="flex h-6.5 w-6.5 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer text-slate-700 dark:text-slate-200"
              title="Increase Indent"
            >
              <Indent className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); exec('removeFormat'); }}
              className="flex h-6.5 w-6.5 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              title="Clear Formatting"
            >
              <RemoveFormatting className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700/70 mx-0.5 shrink-0" />

          {/* Text Reading Aloud Button */}
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); toggleEditorReading(); }}
            className={`flex h-7.5 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-semibold transition-all cursor-pointer shrink-0 shadow-2xs ${
              isEditorSpeaking
                ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400/50'
                : 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40'
            }`}
            title={isEditorSpeaking ? 'Stop Reading Aloud' : 'Read Note Aloud (Hindi & English)'}
          >
            <Volume2 className={`h-3.5 w-3.5 ${isEditorSpeaking ? 'animate-bounce' : ''}`} />
            <span className="hidden sm:inline">
              {isEditorSpeaking ? 'Reading...' : 'Listen'}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LIVE TEXT READING BANNER                                                  */}
      {/* ========================================================================= */}
      {isEditorSpeaking && (
        <div className="flex items-center justify-between px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/50 border-b border-indigo-200/80 dark:border-indigo-900/60 text-xs font-semibold text-indigo-900 dark:text-indigo-200 animate-in fade-in select-none">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-indigo-600 animate-bounce shrink-0" />
            <span>Reading Note Aloud in Hindi & English...</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (isEditorPaused) {
                  readerRef.current?.resume();
                  setIsEditorPaused(false);
                } else {
                  readerRef.current?.pause();
                  setIsEditorPaused(true);
                }
              }}
              className="px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 cursor-pointer"
            >
              {isEditorPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              type="button"
              onClick={() => {
                readerRef.current?.stop();
                setIsEditorSpeaking(false);
                setIsEditorPaused(false);
              }}
              className="px-2.5 py-0.5 rounded-md bg-rose-600 text-[10px] font-semibold text-white hover:bg-rose-500 cursor-pointer shadow-xs"
            >
              Stop
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NOTEBOOK WRITING CANVAS (Luxurious paper feel, smooth typography)        */}
      {/* ========================================================================= */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleEditorInput}
        onKeyDown={handleKeyDown}
        onBlur={handleEditorInput}
        onClick={closeAllPopovers}
        className={`p-4 sm:p-5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none overflow-y-auto leading-relaxed ${minHeight} ${maxHeight}
          [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:my-3 [&_h1]:text-slate-950 dark:[&_h1]:text-white
          [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:my-2.5 [&_h2]:text-slate-900 dark:[&_h2]:text-slate-100
          [&_h3]:text-base [&_h3]:font-bold [&_h3]:my-2 [&_h3]:text-slate-800 dark:[&_h3]:text-slate-200
          [&_p]:my-1.5 [&_p]:leading-relaxed
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2
          [&_li]:my-1 [&_li]:leading-normal
          [&_blockquote]:border-l-3 [&_blockquote]:border-indigo-500 [&_blockquote]:bg-indigo-50/30 dark:[&_blockquote]:bg-indigo-950/20 [&_blockquote]:py-1.5 [&_blockquote]:px-3.5 [&_blockquote]:rounded-r-lg [&_blockquote]:italic [&_blockquote]:my-3 [&_blockquote]:text-slate-700 dark:[&_blockquote]:text-slate-300
          [&_pre]:bg-slate-950 [&_pre]:text-slate-100 [&_pre]:p-3.5 [&_pre]:rounded-xl [&_pre]:font-mono [&_pre]:text-xs [&_pre]:my-3 [&_pre]:overflow-x-auto
          [&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_table]:border [&_table]:border-slate-200 dark:[&_table]:border-slate-700 [&_table]:rounded-xl [&_table]:overflow-hidden
          [&_th]:border [&_th]:border-slate-200 dark:[&_th]:border-slate-700 [&_th]:bg-slate-50 dark:[&_th]:bg-slate-800/80 [&_th]:p-2.5 [&_th]:font-semibold [&_th]:text-left [&_th]:text-xs [&_th]:text-slate-900 dark:[&_th]:text-white
          [&_td]:border [&_td]:border-slate-200 dark:[&_td]:border-slate-700 [&_td]:p-2.5 [&_td]:min-w-[60px] [&_td]:text-xs
          [&_tr:nth-child(even)]:bg-slate-50/50 dark:[&_tr:nth-child(even)]:bg-slate-800/30
          empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400/90 empty:before:pointer-events-none empty:before:italic`}
        data-placeholder={placeholder}
      />

      {/* Editor Footer Status Bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 text-[10px] text-slate-400 select-none">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
            <Sparkles className="h-3 w-3" />
            <span>Interactive Canvas</span>
          </span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
          <span className="text-slate-500 dark:text-slate-400">Justify: <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[9px] border border-slate-200 dark:border-slate-700">Ctrl+J</kbd></span>
        </div>

        <div className="flex items-center gap-2.5 font-mono tabular-nums text-slate-500 dark:text-slate-400">
          <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
          <span>{charCount} {charCount === 1 ? 'char' : 'chars'}</span>
        </div>
      </div>
    </div>
  );
};
