import React, { useState } from 'react';
import {
  Plus, Repeat, Clock, Trash2, CheckCircle2,
  Flame, Calendar, Sparkles, Check
} from 'lucide-react';
import { Routine, Habit, HabitLog } from '../types';
import { storage, generateUUID } from '../lib/storage';
import { ConfirmModal } from '../components/ConfirmModal';

interface RoutineViewProps {
  routines: Routine[];
  habits: Habit[];
  habitLogs: HabitLog[];
  onRefresh: () => void;
  onSuccess: (msg: string) => void;
}

export const RoutineView: React.FC<RoutineViewProps> = ({
  routines,
  habits,
  habitLogs,
  onRefresh,
  onSuccess
}) => {
  const today = new Date().toISOString().slice(0, 10);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'routine' | 'habit'; id: string; name: string } | null>(null);

  // New Routine Time Block form
  const [routineName, setRoutineName] = useState('');
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('08:00');
  const [routineFreq, setRoutineFreq] = useState<'daily' | 'weekdays' | 'weekly' | 'custom'>('daily');
  const [routineCat, setRoutineCat] = useState<'personal' | 'work' | 'learning' | 'health' | 'spiritual' | 'social'>('health');
  const [routineNote, setRoutineNote] = useState('');

  // New Habit form
  const [habitName, setHabitName] = useState('');
  const [habitFrequency, setHabitFrequency] = useState('Daily');
  const [timesPerDay, setTimesPerDay] = useState(1);
  const [time1, setTime1] = useState('08:00');
  const [time2, setTime2] = useState('14:00');
  const [time3, setTime3] = useState('20:00');

  // Past 7 days calculation for streak visualization
  const past7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      iso: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('en-US', { weekday: 'narrow' })
    };
  });

  const handleAddRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routineName.trim()) return;

    const now = Date.now();
    const newRoutine: Routine = {
      id: generateUUID(),
      name: routineName.trim(),
      startTime,
      endTime,
      time: startTime,
      frequency: routineFreq,
      category: routineCat,
      note: routineNote.trim() || undefined,
      active: true,
      createdAt: now,
      updatedAt: now
    };

    await storage.put('routines', newRoutine);
    onSuccess('✓ Time block added to routine');
    setRoutineName('');
    setRoutineNote('');
    onRefresh();
  };

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;

    const now = Date.now();
    const times = timesPerDay === 1 ? [time1] : timesPerDay === 2 ? [time1, time2] : [time1, time2, time3];

    const newHabit: Habit = {
      id: generateUUID(),
      name: habitName.trim(),
      frequency: habitFrequency,
      timesPerDay,
      times,
      createdAt: now,
      updatedAt: now
    };

    await storage.put('habits', newHabit);
    onSuccess('✓ New habit created');
    setHabitName('');
    onRefresh();
  };

  const handleLogHabit = async (habitId: string, occurrence = 0, targetDate = today) => {
    const key = `${habitId}|${targetDate}|${occurrence}`;
    const existing = habitLogs.find(l => l.key === key);

    if (existing) {
      await storage.delete('habitLogs', existing.id);
    } else {
      const newLog: HabitLog = {
        id: generateUUID(),
        key,
        habitId,
        date: targetDate,
        occurrence,
        createdAt: Date.now()
      };
      await storage.put('habitLogs', newLog);
    }
    onRefresh();
  };

  const handleDeleteRoutine = (r: Routine) => {
    setDeleteTarget({ type: 'routine', id: r.id, name: r.name });
  };

  const handleDeleteHabit = (h: Habit) => {
    setDeleteTarget({ type: 'habit', id: h.id, name: h.name });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'routine') {
        await storage.delete('routines', deleteTarget.id);
        onSuccess('✓ Routine block deleted');
      } else {
        await storage.delete('habits', deleteTarget.id);
        onSuccess('✓ Habit deleted');
      }
      setDeleteTarget(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  // Compute streak for a habit
  const getStreak = (habitId: string) => {
    let streak = 0;
    const checkDate = new Date();
    // Check backwards from today
    for (let i = 0; i < 60; i++) {
      const dateStr = checkDate.toISOString().slice(0, 10);
      const hasLog = habitLogs.some(l => l.habitId === habitId && l.date === dateStr);
      if (hasLog) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0) {
        // Might not have logged today yet, check yesterday
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Routine & Habits Architecture
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Orchestrate intentional time blocks, recurring rituals, and multi-occurrence habit streaks.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Schedule Routine Block (1st col) */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 text-xs">
              <Clock className="h-3.5 w-3.5" />
            </span>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Schedule Routine Time Block
            </h2>
          </div>

          <form onSubmit={handleAddRoutine} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Block Title / Activity
              </label>
              <input
                type="text"
                required
                value={routineName}
                onChange={e => setRoutineName(e.target.value)}
                placeholder="e.g. Morning Protocol & Meditation"
                className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Category
                </label>
                <select
                  value={routineCat}
                  onChange={e => setRoutineCat(e.target.value as any)}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="health">Health & Vitality</option>
                  <option value="work">Work & Deep Focus</option>
                  <option value="learning">Study & Reflection</option>
                  <option value="spiritual">Spiritual Practice</option>
                  <option value="personal">Personal Operations</option>
                  <option value="social">Social Connection</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Cadence
                </label>
                <select
                  value={routineFreq}
                  onChange={e => setRoutineFreq(e.target.value as any)}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="daily">Daily</option>
                  <option value="weekdays">Weekdays (Mon-Fri)</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Notes / Checklist Instructions
              </label>
              <input
                type="text"
                value={routineNote}
                onChange={e => setRoutineNote(e.target.value)}
                placeholder="Key action steps during this block..."
                className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 active:scale-98 transition-transform"
            >
              ＋ Add Time Block
            </button>
          </form>
        </section>

        {/* Create Habit (2nd col) */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 text-xs">
              <Repeat className="h-3.5 w-3.5" />
            </span>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Create Recurring Habit
            </h2>
          </div>

          <form onSubmit={handleAddHabit} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Habit Name
              </label>
              <input
                type="text"
                required
                value={habitName}
                onChange={e => setHabitName(e.target.value)}
                placeholder="e.g. Read 20 pages, 100 Pushups"
                className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Cadence
                </label>
                <select
                  value={habitFrequency}
                  onChange={e => setHabitFrequency(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekdays">Weekdays</option>
                  <option value="Weekly">Weekly</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Target Occurrences
                </label>
                <select
                  value={timesPerDay}
                  onChange={e => setTimesPerDay(Number(e.target.value))}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value={1}>1 time per day</option>
                  <option value={2}>2 times per day</option>
                  <option value={3}>3 times per day</option>
                </select>
              </div>
            </div>

            {/* Time Slot Presets */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400">Slot 1</label>
                <input
                  type="time"
                  value={time1}
                  onChange={e => setTime1(e.target.value)}
                  className="mt-0.5 h-8 w-full rounded-lg border border-slate-200 px-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              {timesPerDay >= 2 && (
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400">Slot 2</label>
                  <input
                    type="time"
                    value={time2}
                    onChange={e => setTime2(e.target.value)}
                    className="mt-0.5 h-8 w-full rounded-lg border border-slate-200 px-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              )}
              {timesPerDay >= 3 && (
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400">Slot 3</label>
                  <input
                    type="time"
                    value={time3}
                    onChange={e => setTime3(e.target.value)}
                    className="mt-0.5 h-8 w-full rounded-lg border border-slate-200 px-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-amber-500 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-600 active:scale-98 transition-transform"
            >
              ＋ Save Habit Ritual
            </button>
          </form>
        </section>
      </div>

      {/* Routine Time Blocks Display */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
          Daily Routine Timeline ({routines.length} Blocks)
        </h2>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {routines.length === 0 ? (
            <div className="col-span-full py-10 text-center text-xs text-slate-400">
              No routine time blocks defined. Add one above.
            </div>
          ) : (
            routines.map(r => (
              <div
                key={r.id}
                className="relative rounded-2xl border border-slate-100 p-4 transition-all hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                      {r.startTime || r.time} {r.endTime ? `→ ${r.endTime}` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteRoutine(r)}
                      className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                      title="Delete block"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="mt-2 text-xs font-bold text-slate-900 dark:text-white">
                    {r.name}
                  </div>

                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
                    <span className="capitalize">{r.category}</span>
                    <span>·</span>
                    <span className="capitalize">{r.frequency}</span>
                  </div>

                  {r.note && (
                    <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {r.note}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Habit Tracker Table & 7-Day Consistency Grid */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Repeat className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Habit Tracker & 7-Day Consistency (Today: {today})
            </h2>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {habits.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No habits created yet. Define one above.
            </div>
          ) : (
            habits.map(h => {
              const occCount = h.timesPerDay || 1;
              const streak = getStreak(h.id);
              return (
                <div
                  key={h.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between py-3.5 gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{h.name}</div>
                      {streak > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          <Flame className="h-3 w-3 fill-current" />
                          <span>{streak}d</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {h.frequency} · {occCount}x per day
                    </div>
                  </div>

                  {/* 7-Day Mini Dots + Today's Actions */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* 7-day mini bubbles */}
                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      {past7Days.map(day => {
                        const dayLogged = habitLogs.some(l => l.habitId === h.id && l.date === day.iso);
                        const isToday = day.iso === today;
                        return (
                          <div
                            key={day.iso}
                            className="flex flex-col items-center gap-0.5"
                            title={`${day.iso}: ${dayLogged ? 'Completed' : 'Not logged'}`}
                          >
                            <span className="text-[8px] font-medium text-slate-400">{day.label}</span>
                            <div
                              className={`h-4 w-4 rounded-full flex items-center justify-center text-[8px] transition-colors ${
                                dayLogged
                                  ? 'bg-emerald-500 text-white font-bold'
                                  : isToday
                                  ? 'border border-dashed border-slate-400'
                                  : 'bg-slate-200 dark:bg-slate-700'
                              }`}
                            >
                              {dayLogged && '✓'}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Today's log buttons */}
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: occCount }).map((_, idx) => {
                        const key = `${h.id}|${today}|${idx}`;
                        const isDone = habitLogs.some(l => l.key === key);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleLogHabit(h.id, idx)}
                            className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
                              isDone
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>{h.times?.[idx] || `Slot ${idx + 1}`}</span>
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => handleDeleteHabit(h)}
                        className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                        title="Delete habit"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* CONFIRM DELETE ROUTINE/HABIT MODAL */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={deleteTarget?.type === 'routine' ? 'Delete Routine Block?' : 'Delete Habit?'}
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This record will be permanently removed.`
            : ''
        }
        confirmText={deleteTarget?.type === 'routine' ? 'Delete Block' : 'Delete Habit'}
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
