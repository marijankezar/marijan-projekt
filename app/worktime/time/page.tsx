'use client';

import { useState, useEffect } from 'react';
import { Plus, Play, Square, Pencil, Trash2, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { translations, type Lang } from '@/lib/worktime-i18n';

interface TimeEntry {
  id: number;
  work_start: string;
  work_end?: string;
  break_minutes: number;
  notes?: string;
  approval_status: string;
  duration_minutes?: number;
  username?: string;
}

interface Task {
  id: number;
  title: string;
}

function fmtMin(min: number | undefined) {
  if (!min || min <= 0) return '—';
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h}:${m.toString().padStart(2, '0')}h`;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const statusColors: Record<string, string> = {
  open: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  approved: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  rejected: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

export default function WorktimeTimePage() {
  const [lang, setLang] = useState<Lang>('de');
  const T = translations[lang];

  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [running, setRunning] = useState<TimeEntry | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    work_start: '',
    work_end: '',
    break_minutes: '0',
    notes: '',
  });

  useEffect(() => {
    const saved = localStorage.getItem('wt_lang') as Lang | null;
    if (saved && ['de', 'en', 'it'].includes(saved)) setLang(saved);
    fetchAll();
  }, []);

  async function fetchAll() {
    const [eRes, rRes, tRes] = await Promise.all([
      fetch('/api/worktime/time-entries'),
      fetch('/api/worktime/time-entries/running'),
      fetch('/api/worktime/tasks'),
    ]);
    if (eRes.ok) setEntries(await eRes.json());
    if (rRes.ok) { const r = await rRes.json(); setRunning(r); }
    if (tRes.ok) setTasks(await tRes.json());
  }

  function openNew() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setForm({ work_start: local, work_end: '', break_minutes: '0', notes: '' });
    setEditEntry(null);
    setShowForm(true);
  }

  function openEdit(e: TimeEntry) {
    const toLocal = (iso: string) => {
      const d = new Date(iso);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    };
    setForm({
      work_start: toLocal(e.work_start),
      work_end: e.work_end ? toLocal(e.work_end) : '',
      break_minutes: String(e.break_minutes),
      notes: e.notes || '',
    });
    setEditEntry(e);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const body = {
      work_start: new Date(form.work_start).toISOString(),
      work_end: form.work_end ? new Date(form.work_end).toISOString() : undefined,
      break_minutes: parseInt(form.break_minutes) || 0,
      notes: form.notes,
    };
    const url = editEntry ? `/api/worktime/time-entries/${editEntry.id}` : '/api/worktime/time-entries';
    const method = editEntry ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setShowForm(false);
    await fetchAll();
    setLoading(false);
  }

  async function startWork() {
    setLoading(true);
    await fetch('/api/worktime/time-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ work_start: new Date().toISOString() }),
    });
    await fetchAll();
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
    await fetchAll();
    setLoading(false);
  }

  async function deleteEntry(id: number) {
    if (!confirm(lang === 'de' ? 'Eintrag löschen?' : lang === 'en' ? 'Delete entry?' : 'Eliminare voce?')) return;
    await fetch(`/api/worktime/time-entries/${id}`, { method: 'DELETE' });
    await fetchAll();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{T.timeEntries}</h2>
        <div className="flex gap-2">
          {running ? (
            <button onClick={stopWork} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60">
              <Square className="w-4 h-4" />{T.stopWork}
            </button>
          ) : (
            <button onClick={startWork} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60">
              <Play className="w-4 h-4" />{T.startWork}
            </button>
          )}
          <button onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
            <Plus className="w-4 h-4" />{T.newEntry}
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{editEntry ? T.edit : T.newEntry}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{T.workStart}</label>
              <input type="datetime-local" value={form.work_start} onChange={(e) => setForm({ ...form, work_start: e.target.value })} required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{T.workEnd}</label>
              <input type="datetime-local" value={form.work_end} onChange={(e) => setForm({ ...form, work_end: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{T.breakMinutes}</label>
              <input type="number" min="0" value={form.break_minutes} onChange={(e) => setForm({ ...form, break_minutes: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{T.notes}</label>
              <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium hover:scale-[1.02] transition-all disabled:opacity-60">
                {loading ? T.loading : T.save}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                {T.cancel}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Running entry */}
      {running && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
          <div>
            <p className="font-medium text-emerald-700 dark:text-emerald-400">{T.running}</p>
            <p className="text-sm text-emerald-600 dark:text-emerald-500">{T.workStart}: {fmtTime(running.work_start)}</p>
          </div>
        </div>
      )}

      {/* Entries list */}
      <div className="space-y-3">
        {entries.length === 0 ? (
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-8 text-center text-gray-500 dark:text-gray-400">
            {T.noEntries}
          </div>
        ) : entries.map((entry) => (
          <div key={entry.id} className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {fmtDate(entry.work_start)} · {fmtTime(entry.work_start)}
                    {entry.work_end ? ` – ${fmtTime(entry.work_end)}` : <span className="text-emerald-500 ml-1">●</span>}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {T.duration}: <span className="font-medium">{fmtMin(entry.duration_minutes)}</span>
                    {entry.break_minutes > 0 && ` · ${T.break}: ${entry.break_minutes}min`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[entry.approval_status] || statusColors.open}`}>
                  {T[entry.approval_status as keyof typeof T] || entry.approval_status}
                </span>
                <button onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
                  {expandedId === entry.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <button onClick={() => openEdit(entry)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => deleteEntry(entry.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-500 dark:hover:text-red-400 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {expandedId === entry.id && entry.notes && (
              <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700/50 pt-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">{entry.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
