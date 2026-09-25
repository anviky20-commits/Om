import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, RotateCcw, Check, Sparkles, Volume2,
  VolumeX, Clock, Target, CheckSquare, Award, ArrowRight
} from 'lucide-react';
import { FocusSession, Task, Goal } from '../types';
import { storage, generateUUID } from '../lib/storage';

interface FocusViewProps {
  sessions: FocusSession[];
  tasks: Task[];
  goals: Goal[];
  onRefresh: () => void;
  onSuccess: (msg: string) => void;
}

// Web Audio API Synthesizer Chime
const playFocusBell = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Fundamental Tibetan bell tone frequencies
    const freqs = [528, 1056, 1584];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const delay = idx * 0.05;
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.3 / (idx + 1), ctx.currentTime + delay + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 2.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 2.5);
    });
  } catch (e) {
    console.error('Audio chime error', e);
  }
};

export const FocusView: React.FC<FocusViewProps> = ({
  sessions,
  tasks,
  goals,
  onRefresh,
  onSuccess
}) => {
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [customMin, setCustomMin] = useState(25);
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [sessionLabel, setSessionLabel] = useState('Deep Work Sprint');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const startTimeRef = useRef<number>(0);
  const elapsedBeforePauseRef = useRef<number>(0);

  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsRunning(false);
            if (soundEnabled) {
              playFocusBell();
            }
            handleFinishSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, totalSeconds, soundEnabled]);

  const handleStart = () => {
    if (!isRunning) {
      startTimeRef.current = Date.now();
      setIsRunning(true);
    }
  };

  const handlePause = () => {
    if (isRunning) {
      setIsRunning(false);
      elapsedBeforePauseRef.current += Math.floor((Date.now() - startTimeRef.current) / 1000);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setRemainingSeconds(totalSeconds);
    elapsedBeforePauseRef.current = 0;
  };

  const handleSetPreset = (minutes: number) => {
    if (isRunning) return;
    const secs = minutes * 60;
    setTotalSeconds(secs);
    setRemainingSeconds(secs);
    setCustomMin(minutes);
  };

  const handleApplyCustom = () => {
    if (isRunning) return;
    const s = Math.max(1, customMin * 60);
    setTotalSeconds(s);
    setRemainingSeconds(s);
  };

  const handleFinishSession = async () => {
    const elapsed = totalSeconds - remainingSeconds || totalSeconds;
    const now = Date.now();
    const newSession: FocusSession = {
      id: generateUUID(),
      taskId: selectedTask || null,
      goalId: selectedGoal || null,
      label: sessionLabel || 'Focus Session',
      durationSeconds: elapsed,
      minutes: Number((elapsed / 60).toFixed(1)),
      date: new Date().toISOString().slice(0, 10),
      startedAt: now - elapsed * 1000,
      endedAt: now,
      createdAt: now,
      updatedAt: now
    };

    await storage.put('focus', newSession);
    onSuccess(`🎯 Focus session logged (${Math.round(elapsed / 60)} minutes)`);
    handleReset();
    onRefresh();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const totalFocusSeconds = sessions.reduce((sum, s) => sum + (Number(s.durationSeconds) || 0), 0);
  const totalFocusHours = (totalFocusSeconds / 3600).toFixed(1);
  const today = new Date().toISOString().slice(0, 10);
  const todaySessions = sessions.filter(s => s.date === today);
  const todayMinutes = Math.round(todaySessions.reduce((sum, s) => sum + (Number(s.durationSeconds) || 0), 0) / 60);

  const progressPercent = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;
  const strokeDashoffset = 565.48 - (565.48 * (100 - progressPercent)) / 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Focus & Deep Work Laboratory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Immersion mode. Acoustic chime alerts, task linking, and measurable deep work telemetry.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            const next = !soundEnabled;
            setSoundEnabled(next);
            if (next) playFocusBell();
            onSuccess(next ? '🔔 Chime enabled' : 'Muted');
          }}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
            soundEnabled
              ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300'
              : 'border-slate-200 text-slate-500 dark:border-slate-800'
          }`}
        >
          {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          <span>{soundEnabled ? 'Chime Active' : 'Chime Muted'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Focus Clock Main Card (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <Sparkles className="h-4 w-4" />
            <span>Active Deep Work Cycle</span>
          </div>

          {/* Circular Countdown Ring */}
          <div className="relative my-6 flex items-center justify-center">
            <svg className="h-56 w-56 sm:h-64 sm:w-64 -rotate-90 transform" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="90"
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="100"
                cy="100"
                r="90"
                className="stroke-indigo-600 dark:stroke-indigo-500 transition-all duration-500"
                strokeWidth="8"
                strokeDasharray="565.48"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            <div className="absolute flex flex-col items-center justify-center">
              <span className="font-mono text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
                {formatTime(remainingSeconds)}
              </span>
              <span className="mt-1 text-xs font-medium text-slate-400 max-w-[140px] truncate">
                {sessionLabel}
              </span>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { m: 25, label: '25m Pomodoro' },
              { m: 50, label: '50m Deep Work' },
              { m: 90, label: '90m Ultra Sprint' },
              { m: 5, label: '5m Short Break' }
            ].map(p => (
              <button
                key={p.m}
                type="button"
                onClick={() => handleSetPreset(p.m)}
                disabled={isRunning}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  totalSeconds === p.m * 60
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Play / Pause / Reset Controls */}
          <div className="mt-6 flex items-center justify-center gap-3">
            {!isRunning ? (
              <button
                type="button"
                onClick={handleStart}
                className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 transition-all"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Start Sprint</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePause}
                className="flex items-center gap-2 rounded-2xl bg-amber-500 px-6 py-3 text-sm font-bold text-white shadow-md shadow-amber-500/30 hover:bg-amber-600 active:scale-95 transition-all"
              >
                <Pause className="h-4 w-4 fill-current" />
                <span>Pause Session</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
              title="Reset Timer"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            {(totalSeconds - remainingSeconds > 60) && (
              <button
                type="button"
                onClick={handleFinishSession}
                className="flex items-center gap-1.5 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                title="Complete & Log Session Now"
              >
                <Check className="h-4 w-4" />
                <span>Log Now</span>
              </button>
            )}
          </div>
        </div>

        {/* Task Linkage & Focus Telemetry (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Link Task Form */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
              Focus Session Target
            </h2>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Session Objective / Topic
              </label>
              <input
                type="text"
                value={sessionLabel}
                onChange={e => setSessionLabel(e.target.value)}
                placeholder="e.g. Write architecture document"
                className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Link to Task
              </label>
              <select
                value={selectedTask}
                onChange={e => setSelectedTask(e.target.value)}
                className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="">No task linked</option>
                {tasks.filter(t => !t.done).map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Link to Strategic Goal
              </label>
              <select
                value={selectedGoal}
                onChange={e => setSelectedGoal(e.target.value)}
                className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="">No goal linked</option>
                {goals.map(g => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            </div>

            {/* Custom Minutes Input */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Custom Duration (Minutes)
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={customMin}
                  onChange={e => setCustomMin(Math.max(1, Number(e.target.value)))}
                  className="h-9 flex-1 rounded-xl border border-slate-200 bg-white px-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleApplyCustom}
                  disabled={isRunning}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                >
                  Set Time
                </button>
              </div>
            </div>
          </div>

          {/* Telemetry Stats Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
              Focus Telemetry
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-indigo-50/60 p-4 dark:bg-indigo-950/30">
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Today's Deep Work
                </div>
                <div className="mt-1 font-mono text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                  {todayMinutes}m
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{todaySessions.length} sprints today</div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  All-Time Hours
                </div>
                <div className="mt-1 font-mono text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                  {totalFocusHours}h
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{sessions.length} total blocks</div>
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="mt-4 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Recent Completed Sprints
              </div>
              {sessions.slice().reverse().slice(0, 3).map(s => (
                <div
                  key={s.id}
                  className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 dark:border-slate-800/40 last:border-0"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">
                    {s.label || 'Deep Work'}
                  </span>
                  <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 tabular-nums shrink-0">
                    {s.minutes} min ({s.date})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
