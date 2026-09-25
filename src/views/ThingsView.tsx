import React, { useState, useRef } from 'react';
import {
  Folder, Plus, FileCheck, Shield, Trash2, Receipt, Award, FileText,
  Upload, Edit3, Download, Paperclip, Eye, Calendar, Check, Search,
  X, AlertCircle, Sparkles, Tag, CheckCircle2
} from 'lucide-react';
import {
  ThingItem, DocumentItem, WarrantyItem, ReceiptItem, CertificateItem, ImportantRecordItem
} from '../types';
import { storage, generateUUID } from '../lib/storage';
import { ConfirmModal } from '../components/ConfirmModal';

interface ThingsViewProps {
  things: ThingItem[];
  documents: DocumentItem[];
  warranties: WarrantyItem[];
  receipts?: ReceiptItem[];
  certificates?: CertificateItem[];
  importantRecords?: ImportantRecordItem[];
  onRefresh: () => void;
  onSuccess: (msg: string) => void;
}

type SubMenuTab = 'things' | 'documents' | 'warranties' | 'receipts' | 'certificates' | 'records';

interface DeleteTarget {
  store: 'things' | 'documents' | 'warranties' | 'receipts' | 'certificates' | 'importantRecords';
  id: string;
  name: string;
  typeLabel: string;
}

interface EditItemTarget {
  store: 'things' | 'documents' | 'warranties' | 'receipts' | 'certificates' | 'importantRecords';
  item: any;
}

export const ThingsView: React.FC<ThingsViewProps> = ({
  things,
  documents,
  warranties,
  receipts = [],
  certificates = [],
  importantRecords = [],
  onRefresh,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<SubMenuTab>('things');
  const [searchQuery, setSearchQuery] = useState('');
  const today = new Date().toISOString().slice(0, 10);

  // File import input refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formFileInputRef = useRef<HTMLInputElement>(null);

  // Delete & Edit Modal States
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [editTarget, setEditTarget] = useState<EditItemTarget | null>(null);
  const [previewFile, setPreviewFile] = useState<{ name: string; data: string; type?: string } | null>(null);

  // Manual Add Form states
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string; data: string; type: string } | null>(null);

  // Form states for each category
  const [thingName, setThingName] = useState('');
  const [thingCategory, setThingCategory] = useState('Hardware');
  const [thingValue, setThingValue] = useState('');
  const [thingNote, setThingNote] = useState('');

  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('Identity');
  const [docRef, setDocRef] = useState('');
  const [docDate, setDocDate] = useState(today);
  const [docNote, setDocNote] = useState('');

  const [warTitle, setWarTitle] = useState('');
  const [warExpiry, setWarExpiry] = useState('');
  const [warNote, setWarNote] = useState('');

  const [recTitle, setRecTitle] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recDate, setRecDate] = useState(today);
  const [recNote, setRecNote] = useState('');

  const [certTitle, setCertTitle] = useState('');
  const [certIssuer, setCertIssuer] = useState('');
  const [certExpiry, setCertExpiry] = useState('');
  const [certNote, setCertNote] = useState('');

  const [recrdTitle, setRecrdTitle] = useState('');
  const [recrdDate, setRecrdDate] = useState(today);
  const [recrdNote, setRecrdNote] = useState('');

  // Edit Modal internal form state
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editAttachedFile, setEditAttachedFile] = useState<{ name: string; size: string; data: string; type: string } | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Generic "Import File" handler for all sub-menus
  const handleImportFileToCurrentTab = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      const formattedSize = formatFileSize(file.size);
      const now = Date.now();

      if (activeTab === 'things') {
        const item: ThingItem = {
          id: generateUUID(),
          name: cleanName,
          category: 'Hardware',
          value: 0,
          note: `Imported file: ${file.name}`,
          fileName: file.name,
          fileSize: formattedSize,
          fileType: file.type || 'application/octet-stream',
          fileData: dataUrl,
          createdAt: now
        };
        await storage.put('things', item);
        onSuccess(`✓ "${file.name}" imported to Physical Inventory`);
      } else if (activeTab === 'documents') {
        const doc: DocumentItem = {
          id: generateUUID(),
          title: cleanName,
          type: 'Official Document',
          date: today,
          note: `Imported file: ${file.name}`,
          fileName: file.name,
          fileSize: formattedSize,
          fileType: file.type || 'application/pdf',
          fileData: dataUrl,
          createdAt: now
        };
        await storage.put('documents', doc);
        onSuccess(`✓ "${file.name}" imported to Documents`);
      } else if (activeTab === 'warranties') {
        // Expiry 1 year from now by default
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        const war: WarrantyItem = {
          id: generateUUID(),
          title: cleanName,
          expiry: nextYear.toISOString().slice(0, 10),
          note: `Imported warranty card: ${file.name}`,
          fileName: file.name,
          fileSize: formattedSize,
          fileType: file.type,
          fileData: dataUrl,
          createdAt: now
        };
        await storage.put('warranties', war);
        onSuccess(`✓ "${file.name}" imported to Warranties`);
      } else if (activeTab === 'receipts') {
        const rec: ReceiptItem = {
          id: generateUUID(),
          title: cleanName,
          date: today,
          amount: 0,
          note: `Imported receipt invoice: ${file.name}`,
          fileName: file.name,
          fileSize: formattedSize,
          fileType: file.type,
          fileData: dataUrl,
          createdAt: now
        };
        await storage.put('receipts', rec);
        onSuccess(`✓ "${file.name}" imported to Receipts`);
      } else if (activeTab === 'certificates') {
        const cert: CertificateItem = {
          id: generateUUID(),
          title: cleanName,
          issuer: 'Imported Verified Issuer',
          note: `Certificate file: ${file.name}`,
          fileName: file.name,
          fileSize: formattedSize,
          fileType: file.type,
          fileData: dataUrl,
          createdAt: now
        };
        await storage.put('certificates', cert);
        onSuccess(`✓ "${file.name}" imported to Certificates`);
      } else if (activeTab === 'records') {
        const recrd: ImportantRecordItem = {
          id: generateUUID(),
          title: cleanName,
          date: today,
          note: `Imported record scan: ${file.name}`,
          fileName: file.name,
          fileSize: formattedSize,
          fileType: file.type,
          fileData: dataUrl,
          createdAt: now
        };
        await storage.put('importantRecords', recrd);
        onSuccess(`✓ "${file.name}" imported to Important Records`);
      }

      onRefresh();
    } catch (err: any) {
      console.error('File import error', err);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle manual form file attachment
  const handleAttachFormFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setAttachedFile({
        name: file.name,
        size: formatFileSize(file.size),
        data: dataUrl,
        type: file.type
      });
      // Auto fill title if empty
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      if (activeTab === 'things' && !thingName) setThingName(cleanName);
      if (activeTab === 'documents' && !docTitle) setDocTitle(cleanName);
      if (activeTab === 'warranties' && !warTitle) setWarTitle(cleanName);
      if (activeTab === 'receipts' && !recTitle) setRecTitle(cleanName);
      if (activeTab === 'certificates' && !certTitle) setCertTitle(cleanName);
      if (activeTab === 'records' && !recrdTitle) setRecrdTitle(cleanName);
    } catch (err) {
      console.error('File read error', err);
    }
  };

  // Add Item Handlers
  const handleAddThing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thingName.trim()) return;

    const t: ThingItem = {
      id: generateUUID(),
      name: thingName.trim(),
      category: thingCategory,
      value: Number(thingValue) || 0,
      note: thingNote.trim() || undefined,
      fileName: attachedFile?.name,
      fileSize: attachedFile?.size,
      fileType: attachedFile?.type,
      fileData: attachedFile?.data,
      createdAt: Date.now()
    };
    await storage.put('things', t);
    onSuccess('✓ Physical item added to inventory');
    setThingName('');
    setThingValue('');
    setThingNote('');
    setAttachedFile(null);
    onRefresh();
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) return;

    const d: DocumentItem = {
      id: generateUUID(),
      title: docTitle.trim(),
      type: docType,
      reference: docRef.trim() || undefined,
      date: docDate || today,
      note: docNote.trim() || undefined,
      fileName: attachedFile?.name,
      fileSize: attachedFile?.size,
      fileType: attachedFile?.type,
      fileData: attachedFile?.data,
      createdAt: Date.now()
    };
    await storage.put('documents', d);
    onSuccess('✓ Document record saved');
    setDocTitle('');
    setDocRef('');
    setDocNote('');
    setAttachedFile(null);
    onRefresh();
  };

  const handleAddWarranty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warTitle.trim()) return;

    const w: WarrantyItem = {
      id: generateUUID(),
      title: warTitle.trim(),
      expiry: warExpiry || undefined,
      note: warNote.trim() || undefined,
      fileName: attachedFile?.name,
      fileSize: attachedFile?.size,
      fileType: attachedFile?.type,
      fileData: attachedFile?.data,
      createdAt: Date.now()
    };
    await storage.put('warranties', w);
    onSuccess('✓ Warranty registered');
    setWarTitle('');
    setWarExpiry('');
    setWarNote('');
    setAttachedFile(null);
    onRefresh();
  };

  const handleAddReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recTitle.trim()) return;

    const r: ReceiptItem = {
      id: generateUUID(),
      title: recTitle.trim(),
      amount: Number(recAmount) || 0,
      date: recDate || today,
      note: recNote.trim() || undefined,
      fileName: attachedFile?.name,
      fileSize: attachedFile?.size,
      fileType: attachedFile?.type,
      fileData: attachedFile?.data,
      createdAt: Date.now()
    };
    await storage.put('receipts', r);
    onSuccess('✓ Purchase receipt archived');
    setRecTitle('');
    setRecAmount('');
    setRecNote('');
    setAttachedFile(null);
    onRefresh();
  };

  const handleAddCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certTitle.trim()) return;

    const c: CertificateItem = {
      id: generateUUID(),
      title: certTitle.trim(),
      issuer: certIssuer.trim() || undefined,
      expiry: certExpiry || undefined,
      note: certNote.trim() || undefined,
      fileName: attachedFile?.name,
      fileSize: attachedFile?.size,
      fileType: attachedFile?.type,
      fileData: attachedFile?.data,
      createdAt: Date.now()
    };
    await storage.put('certificates', c);
    onSuccess('✓ Certificate credential registered');
    setCertTitle('');
    setCertIssuer('');
    setCertExpiry('');
    setCertNote('');
    setAttachedFile(null);
    onRefresh();
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recrdTitle.trim()) return;

    const ir: ImportantRecordItem = {
      id: generateUUID(),
      title: recrdTitle.trim(),
      date: recrdDate || today,
      note: recrdNote.trim() || undefined,
      fileName: attachedFile?.name,
      fileSize: attachedFile?.size,
      fileType: attachedFile?.type,
      fileData: attachedFile?.data,
      createdAt: Date.now()
    };
    await storage.put('importantRecords', ir);
    onSuccess('✓ Important record saved');
    setRecrdTitle('');
    setRecrdNote('');
    setAttachedFile(null);
    onRefresh();
  };

  // Open Edit Modal for any item
  const handleOpenEdit = (store: DeleteTarget['store'], item: any) => {
    setEditTarget({ store, item });
    setEditTitle(item.title || item.name || '');
    setEditCategory(item.category || item.type || item.issuer || '');
    setEditValue(item.value !== undefined ? String(item.value) : item.amount !== undefined ? String(item.amount) : item.reference || '');
    setEditDate(item.date || item.expiry || '');
    setEditNote(item.note || '');
    if (item.fileName && item.fileData) {
      setEditAttachedFile({
        name: item.fileName,
        size: item.fileSize || 'Attached File',
        data: item.fileData,
        type: item.fileType || ''
      });
    } else {
      setEditAttachedFile(null);
    }
  };

  // Save changes from Edit Modal
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget || !editTitle.trim()) return;

    const { store, item } = editTarget;
    const now = Date.now();

    let updated: any = {
      ...item,
      updatedAt: now,
      fileName: editAttachedFile?.name || item.fileName,
      fileSize: editAttachedFile?.size || item.fileSize,
      fileType: editAttachedFile?.type || item.fileType,
      fileData: editAttachedFile?.data || item.fileData
    };

    if (store === 'things') {
      updated = {
        ...updated,
        name: editTitle.trim(),
        category: editCategory || 'Hardware',
        value: Number(editValue) || 0,
        note: editNote.trim() || undefined
      };
    } else if (store === 'documents') {
      updated = {
        ...updated,
        title: editTitle.trim(),
        type: editCategory || 'Official Document',
        reference: editValue.trim() || undefined,
        date: editDate || today,
        note: editNote.trim() || undefined
      };
    } else if (store === 'warranties') {
      updated = {
        ...updated,
        title: editTitle.trim(),
        expiry: editDate || undefined,
        note: editNote.trim() || undefined
      };
    } else if (store === 'receipts') {
      updated = {
        ...updated,
        title: editTitle.trim(),
        amount: Number(editValue) || 0,
        date: editDate || today,
        note: editNote.trim() || undefined
      };
    } else if (store === 'certificates') {
      updated = {
        ...updated,
        title: editTitle.trim(),
        issuer: editCategory.trim() || undefined,
        expiry: editDate || undefined,
        note: editNote.trim() || undefined
      };
    } else if (store === 'importantRecords') {
      updated = {
        ...updated,
        title: editTitle.trim(),
        date: editDate || today,
        note: editNote.trim() || undefined
      };
    }

    await storage.put(store, updated);
    onSuccess(`✓ Record updated`);
    setEditTarget(null);
    onRefresh();
  };

  // Safe delete handler with ConfirmModal
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await storage.delete(deleteTarget.store, deleteTarget.id);
      onSuccess(`✓ ${deleteTarget.typeLabel} deleted`);
      setDeleteTarget(null);
      onRefresh();
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  // Create task for maintenance
  const handleCreateThingTask = async (thing: ThingItem) => {
    const t = {
      id: generateUUID(),
      title: `Inspect / Maintain: ${thing.name}`,
      description: `Category: ${thing.category} · Value: ₹${thing.value}`,
      domain: 'personal' as const,
      priority: 'Low' as const,
      dueAt: today,
      date: today,
      linkedEntity: { type: 'Thing', id: thing.id },
      done: false,
      status: 'open' as const,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await storage.put('tasks', t);
    onSuccess(`✓ Maintenance task added to planner for ${thing.name}`);
    onRefresh();
  };

  // Compute total value
  const totalPhysicalValue = things.reduce((sum, t) => sum + (Number(t.value) || 0), 0);
  const totalReceiptsValue = receipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  // Submenu tab items
  const tabs = [
    { id: 'things', label: `Things & Hardware (${things.length})`, icon: Folder },
    { id: 'documents', label: `Documents (${documents.length})`, icon: FileCheck },
    { id: 'warranties', label: `Warranties (${warranties.length})`, icon: Shield },
    { id: 'receipts', label: `Receipts (${receipts.length})`, icon: Receipt },
    { id: 'certificates', label: `Certificates (${certificates.length})`, icon: Award },
    { id: 'records', label: `Important Records (${importantRecords.length})`, icon: FileText }
  ];

  return (
    <div className="space-y-6">
      {/* Hidden global file input for top Import File action */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.csv,.txt,.json"
        className="hidden"
        onChange={handleImportFileToCurrentTab}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl flex items-center gap-2">
            <span>Things, Assets & Document Vault</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Physical asset tracking, warranties, receipts, official documents, certificates, and importable file registries.
          </p>
        </div>

        {/* Global Import File Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 transition-all cursor-pointer"
            title="Import a file (PDF, Image, Doc, Receipt, Scan) into current sub-menu"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Import File</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-menu Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-2 dark:border-slate-800">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id as any);
                setAttachedFile(null);
              }}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SEARCH AND QUICK IMPORT ACTION STRIP */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="h-8 w-full rounded-xl border border-slate-200 pl-8 pr-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Active Vault: <span className="font-semibold text-slate-700 dark:text-slate-200 capitalize">{activeTab}</span>
          </span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <Upload className="h-3 w-3" />
            <span>Import File to {activeTab}</span>
          </button>
        </div>
      </div>

      {/* SUB MENU 1: THINGS & HARDWARE */}
      {activeTab === 'things' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Add Item Form */}
          <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800 flex items-center gap-2">
              <Folder className="h-4 w-4 text-indigo-500" />
              <span>Register Physical Item</span>
            </h2>
            <form onSubmit={handleAddThing} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Item Name</label>
                <input
                  type="text"
                  required
                  value={thingName}
                  onChange={e => setThingName(e.target.value)}
                  placeholder="e.g. M3 MacBook Pro, Audio Interface"
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Category</label>
                  <select
                    value={thingCategory}
                    onChange={e => setThingCategory(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="Hardware">Hardware</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Tools">Tools</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="Valuables">Valuables</option>
                    <option value="Appliances">Appliances</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Estimated Value (₹)</label>
                  <input
                    type="number"
                    value={thingValue}
                    onChange={e => setThingValue(e.target.value)}
                    placeholder="150000"
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Notes / Serial No.</label>
                <textarea
                  rows={2}
                  value={thingNote}
                  onChange={e => setThingNote(e.target.value)}
                  placeholder="Serial number, warranty note, location..."
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Attach File Section */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Attach Document / Photo / Invoice</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="file"
                    className="hidden"
                    id="thing-form-file"
                    onChange={handleAttachFormFile}
                  />
                  <label
                    htmlFor="thing-form-file"
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    <span>{attachedFile ? 'Change File' : 'Attach File'}</span>
                  </label>
                  {attachedFile && (
                    <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium truncate max-w-[200px]">
                      <span className="truncate">{attachedFile.name}</span>
                      <button type="button" onClick={() => setAttachedFile(null)} className="text-slate-400 hover:text-rose-500">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <button type="submit" className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 cursor-pointer">
                + Register Thing
              </button>
            </form>
          </div>

          {/* Items Registry List */}
          <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Physical Inventory ({things.length})
              </h2>
              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                Total: ₹{totalPhysicalValue.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="mt-4 space-y-2.5 max-h-[500px] overflow-y-auto">
              {things
                .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.category.toLowerCase().includes(searchQuery.toLowerCase()))
                .length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">No items found matching criteria.</div>
              ) : (
                things
                  .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.category.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(t => (
                    <div key={t.id} className="rounded-2xl border border-slate-100 p-3.5 text-xs dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 dark:text-white truncate">{t.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                            <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-medium">{t.category}</span>
                            {t.note && <span className="truncate max-w-[200px]">{t.note}</span>}
                          </div>

                          {/* Attached File Badge */}
                          {t.fileName && (
                            <div className="mt-2 flex items-center gap-2">
                              <span
                                onClick={() => t.fileData && setPreviewFile({ name: t.fileName!, data: t.fileData, type: t.fileType })}
                                className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600 hover:underline dark:bg-indigo-950/50 dark:text-indigo-400 cursor-pointer"
                              >
                                <Paperclip className="h-3 w-3" />
                                <span className="truncate max-w-[150px]">{t.fileName}</span>
                                {t.fileSize && <span>({t.fileSize})</span>}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Actions (Value, Task, Edit, Delete) */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-mono font-bold text-slate-900 dark:text-white mr-1 tabular-nums">
                            ₹{Number(t.value).toLocaleString('en-IN')}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCreateThingTask(t)}
                            className="rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400 cursor-pointer"
                            title="Create maintenance task"
                          >
                            + Task
                          </button>

                          {/* EDIT KEY / BUTTON */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit('things', t)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
                            title="Edit Item"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>

                          {/* DELETE KEY / BUTTON */}
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ store: 'things', id: t.id, name: t.name, typeLabel: 'Item' })}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            title="Delete Item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB MENU 2: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Add Document Form */}
          <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800 flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-emerald-500" />
              <span>Add Official Document</span>
            </h2>
            <form onSubmit={handleAddDocument} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Document Title</label>
                <input
                  type="text"
                  required
                  value={docTitle}
                  onChange={e => setDocTitle(e.target.value)}
                  placeholder="e.g. Passport, Tax Identification, Property Deed"
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Type / Classification</label>
                  <input
                    type="text"
                    value={docType}
                    onChange={e => setDocType(e.target.value)}
                    placeholder="Identity, Property, Legal, Medical"
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Reference No.</label>
                  <input
                    type="text"
                    value={docRef}
                    onChange={e => setDocRef(e.target.value)}
                    placeholder="ID / Folio / Serial code"
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Issue / Registration Date</label>
                  <input
                    type="date"
                    value={docDate}
                    onChange={e => setDocDate(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-2.5 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Attach Document Scan / PDF</label>
                  <div className="mt-1">
                    <input
                      type="file"
                      className="hidden"
                      id="doc-form-file"
                      onChange={handleAttachFormFile}
                    />
                    <label
                      htmlFor="doc-form-file"
                      className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      <span className="truncate">{attachedFile ? attachedFile.name : 'Choose File'}</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Notes / Safe Location</label>
                <textarea
                  rows={2}
                  value={docNote}
                  onChange={e => setDocNote(e.target.value)}
                  placeholder="Locker number, physical folder, notes..."
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <button type="submit" className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-500 cursor-pointer">
                + Register Document
              </button>
            </form>
          </div>

          {/* Documents Registry List */}
          <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Official Documents ({documents.length})
              </h2>
            </div>

            <div className="mt-4 space-y-2.5 max-h-[500px] overflow-y-auto">
              {documents
                .filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()) || (d.type && d.type.toLowerCase().includes(searchQuery.toLowerCase())))
                .length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">No documents registered.</div>
              ) : (
                documents
                  .filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()) || (d.type && d.type.toLowerCase().includes(searchQuery.toLowerCase())))
                  .map(d => (
                    <div key={d.id} className="rounded-2xl border border-slate-100 p-3.5 text-xs dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 dark:text-white truncate">{d.title}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                            <span className="rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 font-medium">{d.type}</span>
                            {d.reference && <span>Ref: {d.reference}</span>}
                            {d.date && <span>· Date: {d.date}</span>}
                          </div>
                          {d.note && <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{d.note}</div>}

                          {/* Attached File Pill */}
                          {d.fileName && (
                            <div className="mt-2 flex items-center gap-2">
                              <span
                                onClick={() => d.fileData && setPreviewFile({ name: d.fileName!, data: d.fileData, type: d.fileType })}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 hover:underline dark:bg-emerald-950/50 dark:text-emerald-300 cursor-pointer"
                              >
                                <Paperclip className="h-3 w-3" />
                                <span className="truncate max-w-[160px]">{d.fileName}</span>
                                {d.fileSize && <span>({d.fileSize})</span>}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* EDIT KEY & DELETE KEY */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit('documents', d)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
                            title="Edit Document"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ store: 'documents', id: d.id, name: d.title, typeLabel: 'Document' })}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            title="Delete Document"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB MENU 3: WARRANTIES */}
      {activeTab === 'warranties' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Add Warranty Form */}
          <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800 flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-500" />
              <span>Register Warranty</span>
            </h2>
            <form onSubmit={handleAddWarranty} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Item / Equipment</label>
                <input
                  type="text"
                  required
                  value={warTitle}
                  onChange={e => setWarTitle(e.target.value)}
                  placeholder="e.g. Sony Mirrorless Camera Warranty"
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Expiry Date</label>
                <input
                  type="date"
                  value={warExpiry}
                  onChange={e => setWarExpiry(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Warranty Terms / Support Contact</label>
                <textarea
                  rows={2}
                  value={warNote}
                  onChange={e => setWarNote(e.target.value)}
                  placeholder="Coverage terms, claim helpline, retailer..."
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Attach Warranty Card / Bill</label>
                <div className="mt-1">
                  <input
                    type="file"
                    className="hidden"
                    id="war-form-file"
                    onChange={handleAttachFormFile}
                  />
                  <label
                    htmlFor="war-form-file"
                    className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    <span className="truncate">{attachedFile ? attachedFile.name : 'Choose File'}</span>
                  </label>
                </div>
              </div>

              <button type="submit" className="w-full rounded-xl bg-amber-500 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-400 cursor-pointer">
                + Register Warranty
              </button>
            </form>
          </div>

          {/* Warranties List */}
          <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
              Active Warranties ({warranties.length})
            </h2>
            <div className="mt-4 space-y-2.5 max-h-[500px] overflow-y-auto">
              {warranties
                .filter(w => w.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">No warranties registered.</div>
              ) : (
                warranties
                  .filter(w => w.title.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(w => (
                    <div key={w.id} className="rounded-2xl border border-slate-100 p-3.5 text-xs dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 dark:text-white truncate">{w.title}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>Expires: {w.expiry || 'No date set'}</span>
                            <span className="rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 font-bold text-[9px]">
                              Active
                            </span>
                          </div>
                          {w.note && <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{w.note}</div>}

                          {/* Attached File */}
                          {w.fileName && (
                            <div className="mt-2 flex items-center gap-2">
                              <span
                                onClick={() => w.fileData && setPreviewFile({ name: w.fileName!, data: w.fileData, type: w.fileType })}
                                className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 hover:underline dark:bg-amber-950/50 dark:text-amber-300 cursor-pointer"
                              >
                                <Paperclip className="h-3 w-3" />
                                <span className="truncate max-w-[160px]">{w.fileName}</span>
                                {w.fileSize && <span>({w.fileSize})</span>}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* EDIT KEY & DELETE KEY */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit('warranties', w)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
                            title="Edit Warranty"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ store: 'warranties', id: w.id, name: w.title, typeLabel: 'Warranty' })}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            title="Delete Warranty"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB MENU 4: RECEIPTS */}
      {activeTab === 'receipts' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Add Receipt Form */}
          <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-indigo-500" />
              <span>Add Purchase Receipt</span>
            </h2>
            <form onSubmit={handleAddReceipt} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Item / Store Title</label>
                <input
                  type="text"
                  required
                  value={recTitle}
                  onChange={e => setRecTitle(e.target.value)}
                  placeholder="e.g. Ergonomic Office Desk"
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Amount (₹)</label>
                  <input
                    type="number"
                    value={recAmount}
                    onChange={e => setRecAmount(e.target.value)}
                    placeholder="24000"
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Date</label>
                  <input
                    type="date"
                    value={recDate}
                    onChange={e => setRecDate(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-2.5 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Attach Receipt Invoice Scan</label>
                <div className="mt-1">
                  <input
                    type="file"
                    className="hidden"
                    id="rec-form-file"
                    onChange={handleAttachFormFile}
                  />
                  <label
                    htmlFor="rec-form-file"
                    className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    <span className="truncate">{attachedFile ? attachedFile.name : 'Choose File'}</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Notes / Payment Method</label>
                <textarea
                  rows={2}
                  value={recNote}
                  onChange={e => setRecNote(e.target.value)}
                  placeholder="Order ID, credit card, tax notes..."
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <button type="submit" className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 cursor-pointer">
                + Save Receipt
              </button>
            </form>
          </div>

          {/* Receipts Archive List */}
          <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Receipts Archive ({receipts.length})
              </h2>
              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                Total: ₹{totalReceiptsValue.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="mt-4 space-y-2.5 max-h-[500px] overflow-y-auto">
              {receipts
                .filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">No receipts archived.</div>
              ) : (
                receipts
                  .filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(r => (
                    <div key={r.id} className="rounded-2xl border border-slate-100 p-3.5 text-xs dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 dark:text-white truncate">{r.title}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Date: {r.date || 'N/A'}</div>
                          {r.note && <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{r.note}</div>}

                          {/* Attached Receipt File */}
                          {r.fileName && (
                            <div className="mt-2 flex items-center gap-2">
                              <span
                                onClick={() => r.fileData && setPreviewFile({ name: r.fileName!, data: r.fileData, type: r.fileType })}
                                className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600 hover:underline dark:bg-indigo-950/50 dark:text-indigo-400 cursor-pointer"
                              >
                                <Paperclip className="h-3 w-3" />
                                <span className="truncate max-w-[160px]">{r.fileName}</span>
                                {r.fileSize && <span>({r.fileSize})</span>}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums mr-1">
                            ₹{Number(r.amount).toLocaleString('en-IN')}
                          </span>

                          {/* EDIT KEY & DELETE KEY */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit('receipts', r)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
                            title="Edit Receipt"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ store: 'receipts', id: r.id, name: r.title, typeLabel: 'Receipt' })}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            title="Delete Receipt"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB MENU 5: CERTIFICATES & CREDENTIALS */}
      {activeTab === 'certificates' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Add Certificate Form */}
          <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800 flex items-center gap-2">
              <Award className="h-4 w-4 text-purple-500" />
              <span>Register Certificate</span>
            </h2>
            <form onSubmit={handleAddCertificate} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Certificate Name</label>
                <input
                  type="text"
                  required
                  value={certTitle}
                  onChange={e => setCertTitle(e.target.value)}
                  placeholder="e.g. AWS Solutions Architect, Degree"
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Issuing Authority</label>
                  <input
                    type="text"
                    value={certIssuer}
                    onChange={e => setCertIssuer(e.target.value)}
                    placeholder="Amazon, University, Google"
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Expiry Date</label>
                  <input
                    type="date"
                    value={certExpiry}
                    onChange={e => setCertExpiry(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-2.5 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Attach Certificate Scan / PDF</label>
                <div className="mt-1">
                  <input
                    type="file"
                    className="hidden"
                    id="cert-form-file"
                    onChange={handleAttachFormFile}
                  />
                  <label
                    htmlFor="cert-form-file"
                    className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    <span className="truncate">{attachedFile ? attachedFile.name : 'Choose File'}</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Notes / Credential URL</label>
                <textarea
                  rows={2}
                  value={certNote}
                  onChange={e => setCertNote(e.target.value)}
                  placeholder="Verification ID, credential link, notes..."
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <button type="submit" className="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-purple-500 cursor-pointer">
                + Register Certificate
              </button>
            </form>
          </div>

          {/* Certificates Registry List */}
          <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
              Certificates & Credentials ({certificates.length})
            </h2>

            <div className="mt-4 space-y-2.5 max-h-[500px] overflow-y-auto">
              {certificates
                .filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">No certificates registered.</div>
              ) : (
                certificates
                  .filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(c => (
                    <div key={c.id} className="rounded-2xl border border-slate-100 p-3.5 text-xs dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 dark:text-white truncate">{c.title}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                            {c.issuer && <span className="rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 font-medium">{c.issuer}</span>}
                            <span>Expires: {c.expiry || 'Permanent'}</span>
                          </div>
                          {c.note && <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{c.note}</div>}

                          {/* Attached Certificate */}
                          {c.fileName && (
                            <div className="mt-2 flex items-center gap-2">
                              <span
                                onClick={() => c.fileData && setPreviewFile({ name: c.fileName!, data: c.fileData, type: c.fileType })}
                                className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700 hover:underline dark:bg-purple-950/50 dark:text-purple-300 cursor-pointer"
                              >
                                <Paperclip className="h-3 w-3" />
                                <span className="truncate max-w-[160px]">{c.fileName}</span>
                                {c.fileSize && <span>({c.fileSize})</span>}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* EDIT KEY & DELETE KEY */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit('certificates', c)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
                            title="Edit Certificate"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ store: 'certificates', id: c.id, name: c.title, typeLabel: 'Certificate' })}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            title="Delete Certificate"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB MENU 6: IMPORTANT RECORDS */}
      {activeTab === 'records' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Add Record Form */}
          <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800 flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              <span>Save Important Record</span>
            </h2>
            <form onSubmit={handleAddRecord} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Record Title</label>
                <input
                  type="text"
                  required
                  value={recrdTitle}
                  onChange={e => setRecrdTitle(e.target.value)}
                  placeholder="e.g. Bank Locker Key Ref, Real Estate Deed"
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Date Recorded</label>
                <input
                  type="date"
                  value={recrdDate}
                  onChange={e => setRecrdDate(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Attach Document Scan / Archive File</label>
                <div className="mt-1">
                  <input
                    type="file"
                    className="hidden"
                    id="recrd-form-file"
                    onChange={handleAttachFormFile}
                  />
                  <label
                    htmlFor="recrd-form-file"
                    className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    <span className="truncate">{attachedFile ? attachedFile.name : 'Choose File'}</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Notes / Details</label>
                <textarea
                  rows={3}
                  value={recrdNote}
                  onChange={e => setRecrdNote(e.target.value)}
                  placeholder="Registry office, locker number, folio reference, custody..."
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <button type="submit" className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white dark:bg-slate-700 hover:bg-slate-800 cursor-pointer">
                Save Record
              </button>
            </form>
          </div>

          {/* Important Records List */}
          <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
              Important Records ({importantRecords.length})
            </h2>

            <div className="mt-4 space-y-2.5 max-h-[500px] overflow-y-auto">
              {importantRecords
                .filter(ir => ir.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">No records found.</div>
              ) : (
                importantRecords
                  .filter(ir => ir.title.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(ir => (
                    <div key={ir.id} className="rounded-2xl border border-slate-100 p-3.5 text-xs dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 dark:text-white truncate">{ir.title}</div>
                          {ir.date && <div className="text-[10px] text-slate-400 mt-0.5">Recorded: {ir.date}</div>}
                          {ir.note && <div className="mt-1 text-slate-600 dark:text-slate-300 text-xs whitespace-pre-line">{ir.note}</div>}

                          {/* Attached Record File */}
                          {ir.fileName && (
                            <div className="mt-2 flex items-center gap-2">
                              <span
                                onClick={() => ir.fileData && setPreviewFile({ name: ir.fileName!, data: ir.fileData, type: ir.fileType })}
                                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 hover:underline dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                              >
                                <Paperclip className="h-3 w-3" />
                                <span className="truncate max-w-[160px]">{ir.fileName}</span>
                                {ir.fileSize && <span>({ir.fileSize})</span>}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* EDIT KEY & DELETE KEY */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit('importantRecords', ir)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ store: 'importantRecords', id: ir.id, name: ir.title, typeLabel: 'Record' })}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED EDIT MODAL FOR ALL SUB-MENUS */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                  <Edit3 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                    Edit {editTarget.store.replace(/([A-Z])/g, ' $1')}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Update metadata, notes, values, or file attachment.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  {editTarget.store === 'things' ? 'Item Name' : 'Title'}
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {(editTarget.store === 'things' || editTarget.store === 'documents' || editTarget.store === 'certificates') && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    {editTarget.store === 'things' ? 'Category' : editTarget.store === 'certificates' ? 'Issuer' : 'Classification / Type'}
                  </label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              )}

              {(editTarget.store === 'things' || editTarget.store === 'receipts' || editTarget.store === 'documents') && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    {editTarget.store === 'documents' ? 'Reference Number' : 'Value / Amount (₹)'}
                  </label>
                  <input
                    type={editTarget.store === 'documents' ? 'text' : 'number'}
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              )}

              {(editTarget.store === 'warranties' || editTarget.store === 'receipts' || editTarget.store === 'documents' || editTarget.store === 'certificates' || editTarget.store === 'importantRecords') && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    {editTarget.store === 'warranties' || editTarget.store === 'certificates' ? 'Expiry Date' : 'Record Date'}
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Notes / Details</label>
                <textarea
                  rows={2}
                  value={editNote}
                  onChange={e => setEditNote(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Edit Attached File */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">File Attachment</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="file"
                    className="hidden"
                    id="edit-modal-file"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const d = await readFileAsDataUrl(f);
                      setEditAttachedFile({
                        name: f.name,
                        size: formatFileSize(f.size),
                        data: d,
                        type: f.type
                      });
                    }}
                  />
                  <label
                    htmlFor="edit-modal-file"
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    <span>{editAttachedFile ? 'Replace File' : 'Upload File'}</span>
                  </label>
                  {editAttachedFile && (
                    <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium truncate max-w-[200px]">
                      <span className="truncate">{editAttachedFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setEditAttachedFile(null)}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
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
            </form>
          </div>
        </div>
      )}

      {/* FILE PREVIEW & DOWNLOAD MODAL */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-md">
                  {previewFile.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-auto my-4 flex items-center justify-center bg-slate-50 dark:bg-slate-950 rounded-2xl p-4">
              {previewFile.data.startsWith('data:image/') ? (
                <img
                  src={previewFile.data}
                  alt={previewFile.name}
                  className="max-h-[50vh] max-w-full rounded-xl object-contain shadow-xs"
                />
              ) : previewFile.data.startsWith('data:application/pdf') ? (
                <iframe
                  src={previewFile.data}
                  title={previewFile.name}
                  className="w-full h-[50vh] rounded-xl border border-slate-200 dark:border-slate-800"
                />
              ) : (
                <div className="text-center py-10 space-y-3">
                  <FileText className="h-12 w-12 mx-auto text-indigo-500" />
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    File format ready for viewing or saving to device.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
              <a
                href={previewFile.data}
                download={previewFile.name}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download File</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={`Delete ${deleteTarget?.typeLabel}?`}
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This record and any attached file will be permanently removed.`
            : ''
        }
        confirmText={`Delete ${deleteTarget?.typeLabel || 'Item'}`}
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
