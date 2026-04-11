'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Star, CheckSquare } from 'lucide-react';
import { translations, type Lang } from '@/lib/worktime-i18n';

interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'planned' | 'in_progress' | 'completed';
  customer_id?: number;
  customer_name?: string;
  hourly_value_euro?: number;
  hourly_value_points?: number;
  active: boolean;
}

interface Customer {
  id: number;
  name: string;
}

const statusColors = {
  planned: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  in_progress: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  completed: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
};

export default function WorktimeTasksPage() {
  const [lang, setLang] = useState<Lang>('de');
  const T = translations[lang];

  const [tasks, setTasks] = useState<Task[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    customer_id: '',
    status: 'planned',
    hourly_value_euro: '',
    hourly_value_points: '',
  });

  useEffect(() => {
    const saved = localStorage.getItem('wt_lang') as Lang | null;
    if (saved && ['de', 'en', 'it'].includes(saved)) setLang(saved);
    const favs = JSON.parse(localStorage.getItem('wt_fav_tasks') || '[]');
    setFavorites(favs);
    fetchData();
  }, []);

  async function fetchData() {
    const [tRes, cRes] = await Promise.all([
      fetch('/api/worktime/tasks'),
      fetch('/api/worktime/customers').catch(() => ({ ok: false } as Response)),
    ]);
    if (tRes.ok) setTasks(await tRes.json());
    if (cRes.ok) { try { setCustomers(await cRes.json()); } catch { /* supervisor not available */ } }
  }

  function toggleFavorite(id: number) {
    const next = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
    setFavorites(next);
    localStorage.setItem('wt_fav_tasks', JSON.stringify(next));
  }

  function openNew() {
    setForm({ title: '', description: '', customer_id: '', status: 'planned', hourly_value_euro: '', hourly_value_points: '' });
    setEditTask(null);
    setShowForm(true);
  }

  function openEdit(t: Task) {
    setForm({
      title: t.title,
      description: t.description || '',
      customer_id: t.customer_id ? String(t.customer_id) : '',
      status: t.status,
      hourly_value_euro: t.hourly_value_euro ? String(t.hourly_value_euro) : '',
      hourly_value_points: t.hourly_value_points ? String(t.hourly_value_points) : '',
    });
    setEditTask(t);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const body = {
      title: form.title,
      description: form.description,
      customer_id: form.customer_id ? parseInt(form.customer_id) : null,
      status: form.status,
      hourly_value_euro: form.hourly_value_euro ? parseFloat(form.hourly_value_euro) : null,
      hourly_value_points: form.hourly_value_points ? parseFloat(form.hourly_value_points) : null,
    };
    const url = editTask ? `/api/worktime/tasks/${editTask.id}` : '/api/worktime/tasks';
    const method = editTask ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setShowForm(false);
    await fetchData();
    setLoading(false);
  }

  async function deleteTask(id: number) {
    if (!confirm(lang === 'de' ? 'Aufgabe löschen?' : lang === 'en' ? 'Delete task?' : 'Eliminare attività?')) return;
    await fetch(`/api/worktime/tasks/${id}`, { method: 'DELETE' });
    await fetchData();
  }

  const filtered = tasks.filter(t => filterStatus === 'all' || t.status === filterStatus);
  const favTasks = filtered.filter(t => favorites.includes(t.id));
  const otherTasks = filtered.filter(t => !favorites.includes(t.id));
  const displayTasks = [...favTasks, ...otherTasks];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{T.tasks}</h2>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold hover:scale-[1.02] transition-all">
          <Plus className="w-4 h-4" />{T.newTask}
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'planned', 'in_progress', 'completed'].map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              filterStatus === s
                ? 'bg-emerald-500 text-white shadow'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-emerald-300'
            }`}>
            {s === 'all' ? T.all : T[s as keyof typeof T] || s}
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{editTask ? T.edit : T.newTask}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{T.title} *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{T.description}</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none" />
              </div>
              {customers.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{T.customer}</label>
                  <select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                    <option value="">—</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{T.status}</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                  <option value="planned">{T.planned}</option>
                  <option value="in_progress">{T.inProgress}</option>
                  <option value="completed">{T.completed}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{T.hourlyEuro}</label>
                <input type="number" step="0.01" min="0" value={form.hourly_value_euro} onChange={(e) => setForm({ ...form, hourly_value_euro: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{T.hourlyPoints}</label>
                <input type="number" step="0.01" min="0" value={form.hourly_value_points} onChange={(e) => setForm({ ...form, hourly_value_points: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>
            </div>
            <div className="flex gap-3">
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

      {/* Tasks */}
      <div className="space-y-3">
        {displayTasks.length === 0 ? (
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-8 text-center text-gray-500 dark:text-gray-400">
            <CheckSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
            {T.noEntries}
          </div>
        ) : displayTasks.map((task) => (
          <div key={task.id} className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900 dark:text-white">{task.title}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
                    {T[task.status as keyof typeof T] || task.status}
                  </span>
                  {favorites.includes(task.id) && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                </div>
                {task.customer_name && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{task.customer_name}</p>
                )}
                {task.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{task.description}</p>
                )}
                {(task.hourly_value_euro || task.hourly_value_points) && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {task.hourly_value_euro && `€${task.hourly_value_euro}/h`}
                    {task.hourly_value_euro && task.hourly_value_points && ' · '}
                    {task.hourly_value_points && `${task.hourly_value_points}pt/h`}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggleFavorite(task.id)}
                  className={`p-1.5 rounded-lg transition-all ${favorites.includes(task.id) ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600 hover:text-amber-400'}`}>
                  <Star className={`w-4 h-4 ${favorites.includes(task.id) ? 'fill-amber-400' : ''}`} />
                </button>
                <button onClick={() => openEdit(task)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => deleteTask(task.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-500 dark:hover:text-red-400 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
