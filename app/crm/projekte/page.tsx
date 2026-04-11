'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FolderKanban, Plus, X, Pencil, Trash2, ChevronRight, Loader2, Calendar, Euro, Users } from 'lucide-react';
import type { CrmProjekt, CrmKunde } from '@/types/crm';

const statusLabels: Record<string, string> = {
  offen: 'Offen', aktiv: 'Aktiv', abgeschlossen: 'Abgeschlossen', pausiert: 'Pausiert',
};
const statusColors: Record<string, string> = {
  offen: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  aktiv: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  abgeschlossen: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  pausiert: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
};

const emptyForm = { titel: '', kunde_id: '', beschreibung: '', status: 'offen', budget: '', deadline: '' };

export default function ProjektePage() {
  const [projekte, setProjekte] = useState<CrmProjekt[]>([]);
  const [kunden, setKunden] = useState<CrmKunde[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('alle');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const fetchAll = async () => {
    const [pRes, kRes] = await Promise.all([fetch('/api/crm/projekte'), fetch('/api/crm/kunden')]);
    if (pRes.ok) setProjekte(await pRes.json());
    if (kRes.ok) setKunden(await kRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = filterStatus === 'alle' ? projekte : projekte.filter(p => p.status === filterStatus);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setError(''); setShowForm(true); };
  const openEdit = (p: CrmProjekt) => {
    setForm({ titel: p.titel, kunde_id: p.kunde_id?.toString() || '', beschreibung: p.beschreibung || '', status: p.status, budget: p.budget?.toString() || '', deadline: p.deadline ? p.deadline.split('T')[0] : '' });
    setEditId(p.id); setError(''); setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditId(null); setForm(emptyForm); setError(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titel.trim()) { setError('Titel ist erforderlich'); return; }
    setSaving(true); setError('');
    const url = editId ? `/api/crm/projekte/${editId}` : '/api/crm/projekte';
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, kunde_id: form.kunde_id ? parseInt(form.kunde_id) : null }) });
    setSaving(false);
    if (res.ok) { closeForm(); fetchAll(); }
    else { const d = await res.json(); setError(d.error || 'Fehler'); }
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/crm/projekte/${id}`, { method: 'DELETE' });
    if (res.ok) { setDeleteConfirm(null); fetchAll(); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Projekte</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{projekte.length} {projekte.length === 1 ? 'Projekt' : 'Projekte'}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:scale-105 active:scale-95 transition-all">
          <Plus className="w-4 h-4" /><span className="hidden sm:inline">Neues Projekt</span>
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['alle', 'offen', 'aktiv', 'abgeschlossen', 'pausiert'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterStatus === s ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}>
            {s === 'alle' ? 'Alle' : statusLabels[s]}
          </button>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{editId ? 'Projekt bearbeiten' : 'Neues Projekt'}</h3>
              <button onClick={closeForm} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Titel *</label>
                <input type="text" required autoFocus value={form.titel} onChange={e => setForm(f => ({ ...f, titel: e.target.value }))}
                  placeholder="Projektname" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Kunde</label>
                <select value={form.kunde_id} onChange={e => setForm(f => ({ ...f, kunde_id: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">— Kein Kunde —</option>
                  {kunden.map(k => <option key={k.id} value={k.id}>{k.name}{k.firma ? ` (${k.firma})` : ''}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Budget (€)</label>
                  <input type="number" min="0" step="0.01" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                    placeholder="0.00" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Deadline</label>
                <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Beschreibung</label>
                <textarea rows={3} value={form.beschreibung} onChange={e => setForm(f => ({ ...f, beschreibung: e.target.value }))}
                  placeholder="Optionale Beschreibung…" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium">Abbrechen</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
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
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Projekt löschen?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Diese Aktion kann nicht rückgängig gemacht werden.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Abbrechen</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors">Löschen</button>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50">
          <FolderKanban className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">{filterStatus !== 'alle' ? 'Keine Projekte mit diesem Status' : 'Noch keine Projekte angelegt'}</p>
          {filterStatus === 'alle' && <button onClick={openAdd} className="mt-4 inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"><Plus className="w-4 h-4" /> Erstes Projekt anlegen</button>}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <div key={p.id} className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${statusColors[p.status]}`}>{statusLabels[p.status]}</span>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteConfirm(p.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{p.titel}</h3>
                {p.beschreibung && <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{p.beschreibung}</p>}
                <div className="space-y-1.5">
                  {p.kunde_name && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <Users className="w-3.5 h-3.5" /> {p.kunde_name}
                    </div>
                  )}
                  {p.deadline && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="w-3.5 h-3.5" /> {new Date(p.deadline).toLocaleDateString('de-AT')}
                    </div>
                  )}
                  {p.budget != null && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <Euro className="w-3.5 h-3.5" /> {Number(p.budget).toLocaleString('de-AT', { minimumFractionDigits: 2 })}
                    </div>
                  )}
                </div>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-700/50">
                <Link href={`/crm/projekte/${p.id}`} className="flex items-center justify-center gap-2 py-3 text-sm text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-colors rounded-b-2xl font-medium">
                  Details <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
