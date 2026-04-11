'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Square, Clock, TrendingUp, CheckSquare, Calendar, AlertTriangle } from 'lucide-react';
import { translations, type Lang } from '@/lib/worktime-i18n';

interface DayStats {
  actual_minutes: number;
  target_minutes: number;
  progress_pct: number;
  entries: number;
}

interface WeekDay {
  date: string;
  actual_minutes: number;
  target_minutes: number;
}

interface WeekStats {
  actual_minutes: number;
  target_minutes: number;
  days: WeekDay[];
}

interface RunningEntry {
  id: number;
  work_start: string;
  elapsed_minutes: number;
}

function getProgressColor(pct: number) {
  if (pct <= 30) return 'bg-orange-400';
  if (pct <= 50) return 'bg-yellow-400';
  if (pct <= 80) return 'bg-emerald-500';
  if (pct <= 100) return 'bg-blue-500';
  return 'bg-violet-500';
}

function fmtMinutes(min: number) {
  if (!min || min <= 0) return '0:00';
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h}:${m.toString().padStart(2, '0')}`;
}

const dayNames: Record<string, string[]> = {
  de: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
  en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
  it: ['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do'],
};

export default function WorktimeDashboard() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>('de');
  const T = translations[lang];

  const [dayStats, setDayStats] = useState<DayStats | null>(null);
  const [weekStats, setWeekStats] = useState<WeekStats | null>(null);
  const [running, setRunning] = useState<RunningEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [restWarning, setRestWarning] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('wt_lang') as Lang | null;
    if (saved && ['de', 'en', 'it'].includes(saved)) setLang(saved);
  }, []);

  const fetchData = async () => {
    const [dayRes, weekRes, runRes] = await Promise.all([
      fetch('/api/worktime/stats?type=day'),
      fetch('/api/worktime/stats?type=week'),
      fetch('/api/worktime/time-entries/running'),
    ]);
    if (dayRes.ok) setDayStats(await dayRes.json());
    if (weekRes.ok) setWeekStats(await weekRes.json());
    if (runRes.ok) {
      const r = await runRes.json();
      setRunning(r);
      // Ruhezeit prüfen: Arbeit vor <11h?
      if (r && r.work_start) {
        const startMs = new Date(r.work_start).getTime();
        const hoursSince = (Date.now() - startMs) / 3600000;
        if (hoursSince < 0 && hoursSince > -13) setRestWarning(true);
      }
    }
  };

  useEffect(() => { fetchData(); }, []);

  async function startWork() {
    setLoading(true);
    const res = await fetch('/api/worktime/time-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ work_start: new Date().toISOString() }),
    });
    if (res.ok) { await fetchData(); router.push('/worktime/time'); }
    setLoading(false);
  }

  async function stopWork() {
    if (!running) return;
    setLoading(true);
    await fetch(`/api/worktime/time-entries/${running.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ work_end: new Date().toISOString() }),
    });
    await fetchData();
    setLoading(false);
  }

  const pct = dayStats?.progress_pct ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{T.dashboard}</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          {new Date().toLocaleDateString(lang === 'de' ? 'de-AT' : lang === 'en' ? 'en-US' : 'it-IT', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          })}
        </p>
      </div>

      {restWarning && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="text-sm">{T.restWarning}</span>
        </div>
      )}

      {/* Quick Start / Stop */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
              {running ? T.running : T.quickStart}
            </h3>
            {running && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                {T.workStart}: {new Date(running.work_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
          {running ? (
            <button
              onClick={stopWork}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60"
            >
              <Square className="w-5 h-5" />
              {T.stopWork}
            </button>
          ) : (
            <button
              onClick={startWork}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60"
            >
              <Play className="w-5 h-5" />
              {T.startWork}
            </button>
          )}
        </div>
      </div>

      {/* Tagesfortschritt */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-500" />
            {T.dailyProgress}
          </h3>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">{pct}%</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 mb-3">
          <div
            className={`h-3 rounded-full transition-all duration-700 ${getProgressColor(pct)}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>{T.actualHours}: <span className="font-medium text-gray-900 dark:text-white">{fmtMinutes(dayStats?.actual_minutes ?? 0)}h</span></span>
          <span>{T.targetHours}: <span className="font-medium text-gray-900 dark:text-white">{fmtMinutes(dayStats?.target_minutes ?? 480)}h</span></span>
        </div>
        {pct > 100 && (
          <p className="mt-2 text-xs text-violet-600 dark:text-violet-400 font-medium">
            {T.overtime}: +{fmtMinutes((dayStats?.actual_minutes ?? 0) - (dayStats?.target_minutes ?? 480))}h
          </p>
        )}
      </div>

      {/* Stats-Kacheln */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
          label={T.thisWeek}
          value={`${fmtMinutes(weekStats?.actual_minutes ?? 0)}h`}
          sub={`${T.targetHours}: ${fmtMinutes(weekStats?.target_minutes ?? 2400)}h`}
        />
        <StatCard
          icon={<CheckSquare className="w-5 h-5 text-teal-500" />}
          label={T.timeEntries}
          value={String(dayStats?.entries ?? 0)}
          sub={T.today}
        />
        <StatCard
          icon={<Calendar className="w-5 h-5 text-cyan-500" />}
          label={T.thisWeek}
          value={`${weekStats?.days.filter(d => d.actual_minutes > 0).length ?? 0}/7`}
          sub={lang === 'de' ? 'Tage' : lang === 'en' ? 'days' : 'giorni'}
        />
      </div>

      {/* Wochenübersicht */}
      {weekStats && (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-500" />
            {T.weeklyOverview}
          </h3>
          <div className="grid grid-cols-7 gap-2">
            {weekStats.days.map((day, i) => {
              const dpct = day.target_minutes > 0 ? Math.min(100, Math.round((day.actual_minutes / day.target_minutes) * 100)) : 0;
              const isToday = day.date === new Date().toISOString().slice(0, 10);
              return (
                <div key={day.date} className="flex flex-col items-center gap-1">
                  <span className={`text-xs font-medium ${isToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {dayNames[lang][i]}
                  </span>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-20 flex flex-col-reverse overflow-hidden">
                    <div
                      className={`w-full rounded-full transition-all duration-500 ${getProgressColor(dpct)}`}
                      style={{ height: `${dpct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{fmtMinutes(day.actual_minutes)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span></div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}
