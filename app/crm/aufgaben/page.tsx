'use client';

import { useState, useEffect } from 'react';
import { CheckSquare, Plus, X, Pencil, Trash2, Loader2, Calendar, FolderKanban } from 'lucide-react';
import type { CrmAufgabe, CrmProjekt } from '@/types/crm';

const statusLabels: Record<string, string> = {
  offen: 'Offen', in_bearbeitung: 'In Bearbeitung', erledigt: 'Erledigt',
};
const statusColors: Record<string, string> = {
  offen: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  in_bearbeitung: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  erledigt: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
};
const prioritaetColors: Record<string, string> = {
  hoch: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  mittel: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
  niedrig: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
};

const emptyForm = { titel: '', projekt_id: '', beschreibung: '', prioritaet: 'mittel', status: 'offen', faellig_am: '' };

export default function AufgabenPage() {
  const [aufgaben, setAufgaben] = useState<CrmAufgabe[]>([]);
  const [projekte, setProjekte] = useState<CrmProjekt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('aktiv');
  const [filterPrio, setFilterPrio] = useState('alle');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const fetchAll = async () => {
    const [aRes, pRes] = await Promise.all([fetch('/api/crm/aufgaben'), fetch('/api/crm/projekte')]);
    if (aRes.ok) setAufgaben(await aRes.json());
    if (pRes.ok) setProjekte(await pRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = aufgaben.filter(a => {
    const statusMatch = filterStatus === 'alle' || (filterStatus === 'aktiv' ? a.status !== 'erledigt' : a.status === filterStatus);
    const prioMatch = filterPrio === 'alle' || a.prioritaet === filterPrio;
    return statusMatch && prioMatch;
  });

  const openAdd = () => { setForm(emptyForm); setEditId(null); setError(''); setShowForm(true); };
  const openEdit = (a: CrmAufgabe) => {
    setForm({ titel: a.titel, projekt_id: a.projekt_id?.toString() || '', beschreibung: a.beschreibung || '', prioritaet: a.prioritaet, status: a.status, faellig_am: a.faellig_am ? a.faellig_am.split('T')[0] : '' });
    setEditId(a.id); setError(''); setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditId(null); setForm(emptyForm); setError(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titel.trim()) { setError('Titel ist erforderlich'); return; }
    setSaving(true); setError('');
    const url = editId ? `/api/crm/aufgaben/${editId}` : '/api/crm/aufgaben';
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, projekt_id: form.projekt_id ? parseInt(form.projekt_id) : null }) });
    setSaving(false);
    if (res.ok) { closeForm(); fetchAll(); }
    else { const d = await res.json(); setError(d.error || 'Fehler'); }
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/crm/aufgaben/${id}`, { method: 'DELETE' });
    if (res.ok) { setDeleteConfirm(null); fetchAll(); }
  };

  const toggleStatus = async (a: CrmAufgabe) => {
    const nextStatus = a.status === 'offen' ? 'in_bearbeitung' : a.status === 'in_bearbeitung' ? 'erledigt' : 'offen';
    await fetch(`/api/crm/aufgaben/${a.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...a, projekt_id: a.projekt_id, status: nextStatus }),
    });
    fetchAll();
  };

  const offeneCount = aufgaben.filter(a => a.status !== 'erledigt').length;
  const ueberfaelligCount = aufgaben.filter(a => a.status !== 'erledigt' && a.faellig_am && new Date(a.faellig_am) < new Date()).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Aufgaben</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {offeneCount} offen{ueberfaelligCount > 0 && <span className="text-red-500 ml-2">· {ueberfaelligCount} überfällig</span>}
          </p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:scale-105 active:scale-95 transition-all">
          <Plus className="w-4 h-4" /><span className="hidden sm:inline">Neue Aufgabe</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1.5 flex-wrap">
          {[{ v: 'aktiv', l: 'Offen' }, { v: 'alle', l: 'Alle' }, { v: 'offen', l: 'Neu' }, { v: 'in_bearbeitung', l: 'In Bearbeitung' }, { v: 'erledigt', l: 'Erledigt' }].map(({ v, l }) => (
            <button key={v} onClick={() => setFilterStatus(v)}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${filterStatus === v ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-indigo-300'}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap ml-auto">
          {[{ v: 'alle', l: 'Alle Prio.' }, { v: 'hoch', l: 'Hoch' }, { v: 'mittel', l: 'Mittel' }, { v: 'niedrig', l: 'Niedrig' }].map(({ v, l }) => (
            <button key={v} onClick={() => setFilterPrio(v)}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${filterPrio === v ? 'bg-gray-700 dark:bg-gray-200 text-white dark:text-gray-800 shadow-md' : 'bg-white dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-gray-400'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{editId ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'}</h3>
              <button onClick={closeForm} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Titel *</label>
                <input type="text" required autoFocus value={form.titel} onChange={e => setForm(f => ({ ...f, titel: e.target.value }))}
                  placeholder="Was ist zu tun?" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Projekt</label>
                <select value={form.projekt_id} onChange={e => setForm(f => ({ ...f, projekt_id: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                  <option value="">— Kein Projekt —</option>
                  {projekte.map(p => <option key={p.id} value={p.id}>{p.titel}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Priorität</label>
                  <select value={form.prioritaet} onChange={e => setForm(f => ({ ...f, prioritaet: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                    <option value="niedrig">Niedrig</option>
                    <option value="mittel">Mittel</option>
                    <option value="hoch">Hoch</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                    {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Fällig am</label>
                  <input type="date" value={form.faellig_am} onChange={e => setForm(f => ({ ...f, faellig_am: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Beschreibung</label>
                <textarea rows={3} value={form.beschreibung} onChange={e => setForm(f => ({ ...f, beschreibung: e.target.value }))}
                  placeholder="Optionale Details…" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium">Abbrechen</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}{editId ? 'Speichern' : 'Anlegen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Aufgabe löschen?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Diese Aktion kann nicht rückgängig gemacht werden.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Abbrechen</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors">Löschen</button>
            </div>
          </div>
        </div>
      )}

      {/* Task List */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50">
          <CheckSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Keine Aufgaben gefunden</p>
          <button onClick={openAdd} className="mt-4 inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline">
            <Plus className="w-4 h-4" /> Aufgabe anlegen
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden">
          <ul className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {filtered.map(a => {
              const isUeberfaellig = a.faellig_am && a.status !== 'erledigt' && new Date(a.faellig_am) < new Date();
              return (
                <li key={a.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors group">
                  {/* Status Toggle */}
                  <button onClick={() => toggleStatus(a)} title={`Status: ${statusLabels[a.status]} → wechseln`}
                    className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-all hover:scale-110 ${
                      a.status === 'erledigt' ? 'bg-green-500 border-green-500' :
                      a.status === 'in_bearbeitung' ? 'bg-blue-500 border-blue-500' :
                      'border-gray-300 dark:border-gray-600 hover:border-indigo-400'
                    }`}>
                    {a.status !== 'offen' && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${a.status === 'erledigt' ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                      {a.titel}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                      {a.projekt_titel && (
                        <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                          <FolderKanban className="w-3 h-3" /> {a.projekt_titel}
                        </span>
                      )}
                      {a.faellig_am && (
                        <span className={`flex items-center gap-1 text-xs ${isUeberfaellig ? 'text-red-500 dark:text-red-400 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
                          <Calendar className="w-3 h-3" />
                          {new Date(a.faellig_am).toLocaleDateString('de-AT')}
                          {isUeberfaellig && ' · überfällig'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`hidden sm:block px-2 py-0.5 rounded-full text-xs font-medium ${prioritaetColors[a.prioritaet]}`}>{a.prioritaet}</span>
                    <span className={`hidden md:block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[a.status]}`}>{statusLabels[a.status]}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteConfirm(a.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
