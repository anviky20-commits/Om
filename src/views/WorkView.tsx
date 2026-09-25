import React, { useState } from 'react';
import { Briefcase, BookOpen, Users, Plus, CheckCircle2, Trash2, Award, Edit3, X, Calendar } from 'lucide-react';
import { WorkProject, LearningItem, Meeting, WorkResponsibility, Skill, Course } from '../types';
import { storage, generateUUID } from '../lib/storage';
import { ConfirmModal } from '../components/ConfirmModal';

interface WorkViewProps {
  projects: WorkProject[];
  learningItems: LearningItem[];
  meetings: Meeting[];
  responsibilities?: WorkResponsibility[];
  skills?: Skill[];
  courses?: Course[];
  onRefresh: () => void;
  onSuccess: (msg: string) => void;
}

type WorkTab = 'projects' | 'learning' | 'skills' | 'meetings';

interface DeleteTarget {
  type: 'project' | 'learning' | 'skill' | 'meeting';
  id: string;
  name: string;
  store: string;
}

interface EditTarget {
  type: 'project' | 'learning' | 'skill' | 'meeting';
  item: any;
}

export const WorkView: React.FC<WorkViewProps> = ({
  projects,
  learningItems,
  meetings,
  responsibilities = [],
  skills = [],
  courses = [],
  onRefresh,
  onSuccess
}) => {
  const today = new Date().toISOString().slice(0, 10);
  const [activeTab, setActiveTab] = useState<WorkTab>('projects');

  // New Item Forms
  const [projName, setProjName] = useState('');
  const [projClient, setProjClient] = useState('');
  const [projDue, setProjDue] = useState('');
  const [projStatus, setProjStatus] = useState('Active');

  const [learnTitle, setLearnTitle] = useState('');
  const [learnType, setLearnType] = useState('Course');
  const [learnProgress, setLearnProgress] = useState(0);

  const [skillName, setSkillName] = useState('');
  const [skillLevel, setSkillLevel] = useState('Intermediate');
  const [targetLevel, setTargetLevel] = useState('Mastery');

  const [meetTitle, setMeetTitle] = useState('');
  const [meetPeople, setMeetPeople] = useState('');
  const [meetDate, setMeetDate] = useState(today);

  // Edit & Delete modal states
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  // Edit form internal fields
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editNumber, setEditNumber] = useState<number>(0);
  const [editExtra, setEditExtra] = useState('');

  const handleOpenEdit = (type: EditTarget['type'], item: any) => {
    setEditTarget({ type, item });
    if (type === 'project') {
      setEditTitle(item.name || '');
      setEditSubtitle(item.client || '');
      setEditDate(item.due || '');
      setEditExtra(item.status || 'Active');
    } else if (type === 'learning') {
      setEditTitle(item.title || '');
      setEditSubtitle(item.type || 'Course');
      setEditNumber(item.progress || 0);
    } else if (type === 'skill') {
      setEditTitle(item.name || '');
      setEditSubtitle(item.level || 'Intermediate');
      setEditExtra(item.targetLevel || 'Mastery');
    } else if (type === 'meeting') {
      setEditTitle(item.title || '');
      setEditSubtitle(item.people || '');
      setEditDate(item.date || today);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget || !editTitle.trim()) return;

    const { type, item } = editTarget;
    const now = Date.now();

    if (type === 'project') {
      const updated: WorkProject = {
        ...item,
        name: editTitle.trim(),
        client: editSubtitle.trim() || undefined,
        due: editDate || undefined,
        status: editExtra || 'Active',
        updatedAt: now
      };
      await storage.put('workProjects', updated);
      onSuccess('✓ Project deliverable updated');
    } else if (type === 'learning') {
      const updated: LearningItem = {
        ...item,
        title: editTitle.trim(),
        type: editSubtitle.trim() || 'Course',
        progress: Number(editNumber) || 0,
        updatedAt: now
      };
      await storage.put('learningItems', updated);
      onSuccess('✓ Learning curriculum item updated');
    } else if (type === 'skill') {
      const updated: Skill = {
        ...item,
        name: editTitle.trim(),
        level: editSubtitle.trim() || 'Intermediate',
        targetLevel: editExtra.trim() || 'Mastery',
        updatedAt: now
      };
      await storage.put('skills', updated);
      onSuccess('✓ Skill item updated');
    } else if (type === 'meeting') {
      const updated: Meeting = {
        ...item,
        title: editTitle.trim(),
        people: editSubtitle.trim() || undefined,
        date: editDate || today,
        updatedAt: now
      };
      await storage.put('meetings', updated);
      onSuccess('✓ Meeting agenda updated');
    }

    setEditTarget(null);
    onRefresh();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await storage.delete(deleteTarget.store, deleteTarget.id);
      onSuccess(`✓ ${deleteTarget.name} deleted`);
      setDeleteTarget(null);
      onRefresh();
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) return;

    const p: WorkProject = {
      id: generateUUID(),
      name: projName.trim(),
      client: projClient.trim() || undefined,
      due: projDue || undefined,
      status: projStatus,
      createdAt: Date.now()
    };
    await storage.put('workProjects', p);
    onSuccess('✓ Project added');
    setProjName('');
    setProjClient('');
    setProjDue('');
    onRefresh();
  };

  const handleCreateProjectTask = async (proj: WorkProject) => {
    const t = {
      id: generateUUID(),
      title: `Deliverable for: ${proj.name}`,
      description: `Client: ${proj.client || 'Internal'}`,
      domain: 'work' as const,
      priority: 'High' as const,
      dueAt: proj.due || today,
      date: proj.due || today,
      projectId: proj.id,
      done: false,
      status: 'open' as const,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await storage.put('tasks', t);
    onSuccess(`✓ Linked task created for ${proj.name}`);
    onRefresh();
  };

  const handleAddLearning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!learnTitle.trim()) return;

    const l: LearningItem = {
      id: generateUUID(),
      title: learnTitle.trim(),
      type: learnType,
      progress: Number(learnProgress),
      createdAt: Date.now()
    };
    await storage.put('learningItems', l);
    onSuccess('✓ Learning curriculum updated');
    setLearnTitle('');
    setLearnProgress(0);
    onRefresh();
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName.trim()) return;

    const s: Skill = {
      id: generateUUID(),
      name: skillName.trim(),
      level: skillLevel,
      targetLevel,
      createdAt: Date.now()
    };
    await storage.put('skills', s);
    onSuccess('✓ Skill tree item registered');
    setSkillName('');
    onRefresh();
  };

  const handleAddMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetTitle.trim()) return;

    const m: Meeting = {
      id: generateUUID(),
      title: meetTitle.trim(),
      people: meetPeople.trim() || undefined,
      date: meetDate,
      createdAt: Date.now()
    };
    await storage.put('meetings', m);
    onSuccess('✓ Meeting scheduled');
    setMeetTitle('');
    setMeetPeople('');
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl flex items-center gap-2">
          <span>Work, Projects & Skill Trees</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Professional deliverables, task linking, lifelong skills acquisition, and structured agendas.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-1.5 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'projects', label: `Projects (${projects.length})`, icon: Briefcase },
          { id: 'learning', label: `Learning Tracks (${learningItems.length})`, icon: BookOpen },
          { id: 'skills', label: `Skill Trees (${skills.length})`, icon: Award },
          { id: 'meetings', label: `Meetings & Agendas (${meetings.length})`, icon: Users }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab: Projects */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-indigo-500" />
              <span>Add Work Project</span>
            </h2>
            <form onSubmit={handleAddProject} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Project / Deliverable Name</label>
                <input
                  type="text"
                  required
                  value={projName}
                  onChange={e => setProjName(e.target.value)}
                  placeholder="e.g. Distributed Search Indexer"
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Client / Org</label>
                  <input
                    type="text"
                    value={projClient}
                    onChange={e => setProjClient(e.target.value)}
                    placeholder="Client or Team"
                    className="mt-1 h-8 w-full rounded-lg border border-slate-200 px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Target Due Date</label>
                  <input
                    type="date"
                    value={projDue}
                    onChange={e => setProjDue(e.target.value)}
                    className="mt-1 h-8 w-full rounded-lg border border-slate-200 px-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Status</label>
                <select
                  value={projStatus}
                  onChange={e => setProjStatus(e.target.value)}
                  className="mt-1 h-8 w-full rounded-lg border border-slate-200 px-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Active">Active</option>
                  <option value="In Review">In Review</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <button type="submit" className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 cursor-pointer">
                + Add Project
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
              Active Deliverables ({projects.length})
            </h2>
            <div className="mt-4 space-y-3 max-h-[500px] overflow-y-auto">
              {projects.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">No work projects created yet.</div>
              ) : (
                projects.map(p => (
                  <div key={p.id} className="rounded-2xl border border-slate-100 p-4 text-xs dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 dark:text-white text-sm truncate">{p.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                          <span className="rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 px-1.5 py-0.5 font-medium">{p.status || 'Active'}</span>
                          <span>{p.client || 'Internal Project'}</span>
                          {p.due && <span>· Due: {p.due}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCreateProjectTask(p)}
                          className="rounded-lg bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400 cursor-pointer"
                          title="Generate linked task"
                        >
                          + Task
                        </button>
                        {/* EDIT BUTTON */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit('project', p)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Edit Project"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        {/* DELETE BUTTON */}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ type: 'project', id: p.id, name: p.name, store: 'workProjects' })}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                          title="Delete Project"
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

      {/* Tab: Learning */}
      {activeTab === 'learning' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-emerald-500" />
              <span>Add Learning Track</span>
            </h2>
            <form onSubmit={handleAddLearning} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Course / Book / Topic</label>
                <input
                  type="text"
                  required
                  value={learnTitle}
                  onChange={e => setLearnTitle(e.target.value)}
                  placeholder="e.g. Distributed Systems in Go"
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Type</label>
                  <input
                    type="text"
                    value={learnType}
                    onChange={e => setLearnType(e.target.value)}
                    placeholder="Book, Course, Paper"
                    className="mt-1 h-8 w-full rounded-lg border border-slate-200 px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Progress ({learnProgress}%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={learnProgress}
                    onChange={e => setLearnProgress(Number(e.target.value))}
                    className="mt-1 h-8 w-full rounded-lg border border-slate-200 px-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
              <button type="submit" className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-500 cursor-pointer">
                + Register Learning
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
              Curriculum & Mastery ({learningItems.length})
            </h2>
            <div className="mt-4 space-y-3 max-h-[500px] overflow-y-auto">
              {learningItems.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">No learning tracks added yet.</div>
              ) : (
                learningItems.map(l => (
                  <div key={l.id} className="rounded-2xl border border-slate-100 p-4 text-xs dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm truncate">{l.title}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {/* EDIT BUTTON */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit('learning', l)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Edit Learning Track"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        {/* DELETE BUTTON */}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ type: 'learning', id: l.id, name: l.title, store: 'learningItems' })}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                          title="Delete Learning Track"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{l.type}</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{l.progress}%</span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${l.progress}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Skills */}
      {activeTab === 'skills' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800 flex items-center gap-2">
              <Award className="h-4 w-4 text-purple-500" />
              <span>Add Skill Tree Item</span>
            </h2>
            <form onSubmit={handleAddSkill} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Skill Name</label>
                <input
                  type="text"
                  required
                  value={skillName}
                  onChange={e => setSkillName(e.target.value)}
                  placeholder="e.g. TypeScript, System Architecture"
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Current Level</label>
                  <input
                    type="text"
                    value={skillLevel}
                    onChange={e => setSkillLevel(e.target.value)}
                    placeholder="Intermediate"
                    className="mt-1 h-8 w-full rounded-lg border border-slate-200 px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Target Level</label>
                  <input
                    type="text"
                    value={targetLevel}
                    onChange={e => setTargetLevel(e.target.value)}
                    placeholder="Mastery"
                    className="mt-1 h-8 w-full rounded-lg border border-slate-200 px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
              <button type="submit" className="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-purple-500 cursor-pointer">
                + Register Skill
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
              Acquired Competencies ({skills.length})
            </h2>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
              {skills.length === 0 ? (
                <div className="col-span-full py-12 text-center text-xs text-slate-400">No skill competencies recorded.</div>
              ) : (
                skills.map(s => (
                  <div key={s.id} className="rounded-2xl border border-slate-100 p-4 text-xs dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors flex justify-between items-start">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{s.name}</div>
                      <div className="mt-1 text-[11px] text-slate-400">
                        Current: <span className="font-semibold text-purple-600 dark:text-purple-400">{s.level}</span> · Target: {s.targetLevel}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {/* EDIT BUTTON */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit('skill', s)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Edit Skill"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      {/* DELETE BUTTON */}
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ type: 'skill', id: s.id, name: s.name, store: 'skills' })}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                        title="Delete Skill"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Meetings */}
      {activeTab === 'meetings' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800 flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-500" />
              <span>Schedule Meeting</span>
            </h2>
            <form onSubmit={handleAddMeeting} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Agenda / Topic</label>
                <input
                  type="text"
                  required
                  value={meetTitle}
                  onChange={e => setMeetTitle(e.target.value)}
                  placeholder="e.g. Q4 Strategy Review"
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Attendees</label>
                  <input
                    type="text"
                    value={meetPeople}
                    onChange={e => setMeetPeople(e.target.value)}
                    placeholder="Team, Alex"
                    className="mt-1 h-8 w-full rounded-lg border border-slate-200 px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Date</label>
                  <input
                    type="date"
                    value={meetDate}
                    onChange={e => setMeetDate(e.target.value)}
                    className="mt-1 h-8 w-full rounded-lg border border-slate-200 px-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
                  />
                </div>
              </div>
              <button type="submit" className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 cursor-pointer">
                + Schedule Meeting
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
              Meetings Timeline ({meetings.length})
            </h2>
            <div className="mt-4 space-y-3 max-h-[500px] overflow-y-auto">
              {meetings.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">No scheduled meetings.</div>
              ) : (
                meetings.map(m => (
                  <div key={m.id} className="rounded-2xl border border-slate-100 p-4 text-xs dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 dark:text-white text-sm truncate">{m.title}</div>
                      <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        <span>{m.date}</span>
                        {m.people && <span>· Attendees: {m.people}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {/* EDIT BUTTON */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit('meeting', m)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Edit Meeting"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      {/* DELETE BUTTON */}
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ type: 'meeting', id: m.id, name: m.title, store: 'meetings' })}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                        title="Delete Meeting"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED EDIT MODAL */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                  <Edit3 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                    Edit {editTarget.type}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Modify record details and save updates.
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
                  {editTarget.type === 'project' ? 'Project Name' : editTarget.type === 'learning' ? 'Curriculum Title' : editTarget.type === 'skill' ? 'Skill Name' : 'Meeting Topic'}
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {editTarget.type === 'project' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Client / Org</label>
                      <input
                        type="text"
                        value={editSubtitle}
                        onChange={e => setEditSubtitle(e.target.value)}
                        className="mt-1 h-8 w-full rounded-lg border border-slate-200 px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Due Date</label>
                      <input
                        type="date"
                        value={editDate}
                        onChange={e => setEditDate(e.target.value)}
                        className="mt-1 h-8 w-full rounded-lg border border-slate-200 px-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Status</label>
                    <select
                      value={editExtra}
                      onChange={e => setEditExtra(e.target.value)}
                      className="mt-1 h-8 w-full rounded-lg border border-slate-200 px-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="Active">Active</option>
                      <option value="In Review">In Review</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </>
              )}

              {editTarget.type === 'learning' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Type</label>
                    <input
                      type="text"
                      value={editSubtitle}
                      onChange={e => setEditSubtitle(e.target.value)}
                      className="mt-1 h-8 w-full rounded-lg border border-slate-200 px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Progress (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editNumber}
                      onChange={e => setEditNumber(Number(e.target.value))}
                      className="mt-1 h-8 w-full rounded-lg border border-slate-200 px-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {editTarget.type === 'skill' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Current Level</label>
                    <input
                      type="text"
                      value={editSubtitle}
                      onChange={e => setEditSubtitle(e.target.value)}
                      className="mt-1 h-8 w-full rounded-lg border border-slate-200 px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Target Level</label>
                    <input
                      type="text"
                      value={editExtra}
                      onChange={e => setEditExtra(e.target.value)}
                      className="mt-1 h-8 w-full rounded-lg border border-slate-200 px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {editTarget.type === 'meeting' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Attendees</label>
                    <input
                      type="text"
                      value={editSubtitle}
                      onChange={e => setEditSubtitle(e.target.value)}
                      className="mt-1 h-8 w-full rounded-lg border border-slate-200 px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Date</label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={e => setEditDate(e.target.value)}
                      className="mt-1 h-8 w-full rounded-lg border border-slate-200 px-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
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

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={`Delete ${deleteTarget?.type || 'item'}?`}
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This record will be permanently removed.`
            : ''
        }
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
