'use client';

import { useState, useEffect } from 'react';
import { BarChart2, Clock, TrendingUp, CheckSquare, Users } from 'lucide-react';
import { translations, type Lang } from '@/lib/worktime-i18n';

interface DayStat { actual_minutes: number; target_minutes: number; progress_pct: number; entries: number; }
interface WeekStat { actual_minutes: number; target_minutes: number; days: { date: string; actual_minutes: number; target_minutes: number; entries: number; }[]; }
interface MonthStat { actual_minutes: number; target_minutes: number; entries: number; }
interface TaskStat { title: string; status: string; entry_count: number; total_minutes: number; }

function fmtMin(min: number) {
  if (!min || min <= 0) return '0:00';
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h}:${m.toString().padStart(2, '0')}`;
}

function getProgressColor(pct: number) {
  if (pct <= 30) return 'bg-orange-400';
  if (pct <= 50) return 'bg-yellow-400';
  if (pct <= 80) return 'bg-emerald-500';
  if (pct <= 100) return 'bg-blue-500';
  return 'bg-violet-500';
}

const dayNames: Record<string, string[]> = {
  de: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
  en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
  it: ['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do'],
};

export default function WorktimeStatsPage() {
  const [lang, setLang] = useState<Lang>('de');
  const T = translations[lang];

  const [day, setDay] = useState<DayStat | null>(null);
  const [week, setWeek] = useState<WeekStat | null>(null);
  const [month, setMonth] = useState<MonthStat | null>(null);
  const [taskStats, setTaskStats] = useState<TaskStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('wt_lang') as Lang | null;
    if (saved && ['de', 'en', 'it'].includes(saved)) setLang(saved);
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    const [dRes, wRes, mRes, tRes] = await Promise.all([
      fetch('/api/worktime/stats?type=day'),
      fetch('/api/worktime/stats?type=week'),
      fetch('/api/worktime/stats?type=month'),
      fetch('/api/worktime/stats?type=tasks'),
    ]);
    if (dRes.ok) setDay(await dRes.json());
    if (wRes.ok) setWeek(await wRes.json());
    if (mRes.ok) setMonth(await mRes.json());
    if (tRes.ok) setTaskStats(await tRes.json());
    setLoading(false);
  }

  if (loading) return <div className="text-center py-12 text-gray-500 dark:text-gray-400">{T.loading}</div>;

  const periodCards = [
    { label: T.today, stat: day, icon: <Clock className="w-5 h-5 text-emerald-500" /> },
    { label: T.thisWeek, stat: week ? { actual_minutes: week.actual_minutes, target_minutes: week.target_minutes, progress_pct: week.target_minutes > 0 ? Math.round(week.actual_minutes / week.target_minutes * 100) : 0, entries: week.days.reduce((s, d) => s + d.entries, 0) } : null, icon: <TrendingUp className="w-5 h-5 text-teal-500" /> },
    { label: T.thisMonth, stat: month ? { ...month, progress_pct: month.target_minutes > 0 ? Math.round(month.actual_minutes / month.target_minutes * 100) : 0 } : null, icon: <BarChart2 className="w-5 h-5 text-cyan-500" /> },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{T.stats}</h2>

      {/* Period cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {periodCards.map(({ label, stat, icon }) => {
          const pct = stat?.progress_pct ?? 0;
          return (
            <div key={label} className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">{icon}<span className="font-medium text-gray-700 dark:text-gray-300">{label}</span></div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{fmtMin(stat?.actual_minutes ?? 0)}h</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{T.targetHours}: {fmtMin(stat?.target_minutes ?? 0)}h</p>
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-1">
                <div className={`h-2 rounded-full ${getProgressColor(pct)}`} style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 text-right">{pct}%</p>
            </div>
          );
        })}
      </div>

      {/* Weekly bar chart */}
      {week && (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />{T.thisWeek}
          </h3>
          <div className="grid grid-cols-7 gap-3">
            {week.days.map((day, i) => {
              const pct = day.target_minutes > 0 ? Math.min(100, Math.round(day.actual_minutes / day.target_minutes * 100)) : 0;
              const isToday = day.date === new Date().toISOString().slice(0, 10);
              return (
                <div key={day.date} className="flex flex-col items-center gap-1">
                  <span className={`text-xs font-medium ${isToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {dayNames[lang][i]}
                  </span>
                  <div className="relative w-full bg-gray-100 dark:bg-gray-700 rounded-lg h-24 flex items-end overflow-hidden">
                    <div className={`w-full ${getProgressColor(pct)} transition-all duration-500`} style={{ height: `${Math.max(pct, 2)}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{fmtMin(day.actual_minutes)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Task stats */}
      {taskStats.length > 0 && (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-500" />{T.tasks}
          </h3>
          <div className="space-y-3">
            {taskStats.slice(0, 10).map((t, i) => {
              const maxMin = Math.max(...taskStats.map(s => s.total_minutes), 1);
              const barPct = Math.round((t.total_minutes / maxMin) * 100);
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium truncate max-w-[60%]">{t.title}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">{fmtMin(t.total_minutes)}h</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${barPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
