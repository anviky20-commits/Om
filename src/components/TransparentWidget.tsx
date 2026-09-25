import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, Circle, Clock, Calendar, RefreshCw,
  ExternalLink, Sparkles, X, Minimize2, Move, Eye, Layers, Settings
} from 'lucide-react';
import { Task, Habit, HabitLog, FinanceTransaction, Note, DailyPlanner } from '../types';
import { adToBs, getTodayIso } from '../lib/nepaliDate';
import { storage } from '../lib/storage';

interface TransparentWidgetProps {
  tasks: Task[];
  habits: Habit[];
  habitLogs: HabitLog[];
  finance: FinanceTransaction[];
  notes: Note[];
  dailyPlanner?: DailyPlanner;
  onToggleTask: (id: string) => void;
  onLogHabit: (habitId: string, occurrence?: number) => void;
  onCloseWidget: () => void;
  onOpenApp: () => void;
}

export const TransparentWidget: React.FC<TransparentWidgetProps> = ({
  tasks,
  habits,
  habitLogs,
  finance,
  notes,
  dailyPlanner,
  onToggleTask,
  onLogHabit,
  onCloseWidget,
  onOpenApp,
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'habits' | 'notes' | 'finance'>('today');
  const [opacity, setOpacity] = useState<number>(() => {
    const saved = localStorage.getItem('om_widget_opacity');
    return saved ? Number(saved) : 85;
  });
  const [blurLevel, setBlurLevel] = useState<'none' | 'sm' | 'md' | 'lg'>(() => {
    const saved = localStorage.getItem('om_widget_blur') as any;
    return saved || 'md';
  });
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    const saved = localStorage.getItem('om_widget_position');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return { x: window.innerWidth - 380, y: 70 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPinned, setIsPinned] = useState(true);

  // Live seconds clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const todayIso = getTodayIso();
  const bsDate = adToBs(todayIso);

  // Dragging logic
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag from widget header
    if ((e.target as HTMLElement).closest('.widget-drag-handle')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(10, Math.min(window.innerWidth - 360, e.clientX - dragOffset.x));
        const newY = Math.max(10, Math.min(window.innerHeight - 450, e.clientY - dragOffset.y));
        const newPos = { x: newX, y: newY };
        setPosition(newPos);
        localStorage.setItem('om_widget_position', JSON.stringify(newPos));
      }
    };
    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const openTasks = tasks.filter(t => !t.done);
  const todayTasks = openTasks.filter(t => t.dueAt === todayIso || t.date === todayIso);
  const displayTasks = todayTasks.length > 0 ? todayTasks : openTasks.slice(0, 8);

  const completedTodayHabitsCount = habits.filter(h => {
    const log = habitLogs.find(l => l.habitId === h.id && l.date === todayIso);
    return Boolean(log);
  }).length;

  // Background styling based on transparent opacity and blur
  const bgOpacityValue = opacity / 100;
  const blurClass =
    blurLevel === 'none'
      ? 'backdrop-blur-none'
      : blurLevel === 'sm'
      ? 'backdrop-blur-sm'
      : blurLevel === 'md'
      ? 'backdrop-blur-md'
      : 'backdrop-blur-xl';

  const isDedicated = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('widget_mode') === 'true' ||
    new URLSearchParams(window.location.search).get('view') === 'widget'
  );

  return (
    <div
      style={
        isDedicated
          ? {
              backgroundColor: `rgba(15, 23, 42, ${bgOpacityValue * 0.75})`,
              borderColor: `rgba(255, 255, 255, ${Math.min(0.25, bgOpacityValue * 0.35)})`,
              width: '100%',
              maxWidth: '380px',
              height: '100%',
              maxHeight: '560px',
            }
          : {
              left: `${position.x}px`,
              top: `${position.y}px`,
              backgroundColor: `rgba(15, 23, 42, ${bgOpacityValue * 0.75})`,
              borderColor: `rgba(255, 255, 255, ${Math.min(0.25, bgOpacityValue * 0.35)})`,
            }
      }
      className={`${
        isDedicated ? 'relative' : 'fixed z-9999 w-88'
      } rounded-2xl border text-slate-100 shadow-2xl transition-shadow ${blurClass} select-none overflow-hidden flex flex-col font-sans`}
    >
      {/* Widget Drag Handle / Header */}
      <div
        onMouseDown={handleMouseDown}
        className="widget-drag-handle flex items-center justify-between px-3.5 py-2.5 bg-black/20 border-b border-white/10 cursor-grab active:cursor-grabbing hover:bg-black/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600/90 text-[11px] font-bold shadow-xs">
            ॐ
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold tracking-tight text-white">
              <span>Om-LifeOS Widget</span>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[9px] text-slate-300">
              <span className="text-indigo-300 font-bold">BS {bsDate.iso}</span>
              <span>·</span>
              <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          <button
            type="button"
            onClick={onOpenApp}
            title="Open Full Om-LifeOS App"
            className="p-1 hover:text-white rounded-md hover:bg-white/10 cursor-pointer transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onCloseWidget}
            title="Close / Hide Widget"
            className="p-1 hover:text-rose-400 rounded-md hover:bg-white/10 cursor-pointer transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Widget Quick Nav Tabs */}
      <div className="flex items-center justify-between px-2 pt-2 border-b border-white/5 bg-black/10 text-[11px] font-medium">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('today')}
            className={`px-2.5 py-1 rounded-t-lg transition-colors cursor-pointer ${
              activeTab === 'today'
                ? 'bg-indigo-600/80 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tasks ({displayTasks.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('habits')}
            className={`px-2.5 py-1 rounded-t-lg transition-colors cursor-pointer ${
              activeTab === 'habits'
                ? 'bg-indigo-600/80 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Habits ({completedTodayHabitsCount}/{habits.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`px-2.5 py-1 rounded-t-lg transition-colors cursor-pointer ${
              activeTab === 'notes'
                ? 'bg-indigo-600/80 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Notes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('finance')}
            className={`px-2.5 py-1 rounded-t-lg transition-colors cursor-pointer ${
              activeTab === 'finance'
                ? 'bg-indigo-600/80 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Finance
          </button>
        </div>
      </div>

      {/* Widget Content Area */}
      <div className="p-3 max-h-72 overflow-y-auto space-y-2 text-xs">
        {activeTab === 'today' && (
          <div className="space-y-1.5">
            {displayTasks.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto mb-1.5 opacity-80" />
                <p className="text-[11px]">All tasks completed! Great work.</p>
              </div>
            ) : (
              displayTasks.map(t => (
                <div
                  key={t.id}
                  onClick={() => onToggleTask(t.id)}
                  className="group flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <Circle className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-400 shrink-0" />
                    <span className="text-slate-200 group-hover:text-white truncate text-[11px] font-medium">
                      {t.title}
                    </span>
                  </div>
                  {t.priority && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase shrink-0 ${
                        t.priority === 'High'
                          ? 'bg-rose-500/20 text-rose-300'
                          : t.priority === 'Medium'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-500/20 text-slate-300'
                      }`}
                    >
                      {t.priority}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'habits' && (
          <div className="space-y-1.5">
            {habits.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-[11px]">No habits tracked yet.</div>
            ) : (
              habits.map(h => {
                const log = habitLogs.find(l => l.habitId === h.id && l.date === todayIso);
                const isDone = Boolean(log);
                return (
                  <div
                    key={h.id}
                    onClick={() => onLogHabit(h.id, 0)}
                    className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-slate-400 hover:text-emerald-400 shrink-0" />
                      )}
                      <span className={`truncate text-[11px] font-medium ${isDone ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                        {h.name}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-indigo-300 shrink-0">
                      {isDone ? 'Done' : 'Pending'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-1.5">
            {notes.slice(0, 5).map(n => (
              <div key={n.id} className="p-2 rounded-xl bg-white/5 border border-white/5">
                <div className="font-semibold text-white text-[11px] truncate">{n.title}</div>
                <div className="text-[10px] text-slate-300 line-clamp-2 mt-0.5">{n.body || n.points || ''}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Recent Transactions</div>
            {finance.slice(0, 5).map(f => (
              <div key={f.id} className="flex justify-between items-center p-2 rounded-xl bg-white/5 border border-white/5 text-[11px]">
                <span className="truncate text-slate-200">{f.note || f.category}</span>
                <span className={`font-mono font-bold shrink-0 ${f.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {f.type === 'income' ? '+' : '-'} रू {f.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Widget Transparency & Glass Settings Controller */}
      <div className="px-3 py-2 bg-black/30 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300">
        <div className="flex items-center gap-1.5">
          <Eye className="h-3 w-3 text-indigo-300" />
          <span>Glass Transparency: {100 - opacity}%</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="20"
            max="100"
            value={opacity}
            onChange={e => {
              const val = Number(e.target.value);
              setOpacity(val);
              localStorage.setItem('om_widget_opacity', String(val));
            }}
            className="w-16 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            title="Adjust Widget Transparency"
          />
          <button
            type="button"
            onClick={() => {
              const next = blurLevel === 'none' ? 'sm' : blurLevel === 'sm' ? 'md' : blurLevel === 'md' ? 'lg' : 'none';
              setBlurLevel(next);
              localStorage.setItem('om_widget_blur', next);
            }}
            className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 font-mono text-[9px] uppercase cursor-pointer"
            title="Toggle Acrylic Blur Effect"
          >
            {blurLevel}
          </button>
        </div>
      </div>
    </div>
  );
};
