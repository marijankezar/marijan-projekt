'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Plus, X, Pencil, Trash2, Mail, Phone, Building2, ChevronRight, Loader2, Search } from 'lucide-react';
import type { CrmKunde } from '@/types/crm';

const emptyForm = { name: '', firma: '', email: '', telefon: '', notizen: '' };

export default function KundenPage() {
  const [kunden, setKunden] = useState<CrmKunde[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const fetchKunden = async () => {
    const res = await fetch('/api/crm/kunden');
    if (res.ok) setKunden(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchKunden(); }, []);

  const filtered = kunden.filter(k =>
    k.name.toLowerCase().includes(search.toLowerCase()) ||
    k.firma?.toLowerCase().includes(search.toLowerCase()) ||
    k.email?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setForm(emptyForm); setEditId(null); setError(''); setShowForm(true); };
  const openEdit = (k: CrmKunde) => {
    setForm({ name: k.name, firma: k.firma || '', email: k.email || '', telefon: k.telefon || '', notizen: k.notizen || '' });
    setEditId(k.id);
    setError('');
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditId(null); setForm(emptyForm); setError(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name ist erforderlich'); return; }
    setSaving(true);
    setError('');
    const url = editId ? `/api/crm/kunden/${editId}` : '/api/crm/kunden';
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setSaving(false);
    if (res.ok) {
      closeForm();
      fetchKunden();
    } else {
      const data = await res.json();
      setError(data.error || 'Fehler beim Speichern');
    }
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/crm/kunden/${id}`, { method: 'DELETE' });
    if (res.ok) { setDeleteConfirm(null); fetchKunden(); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Kunden</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{kunden.length} {kunden.length === 1 ? 'Kunde' : 'Kunden'}</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-semibold shadow-lg shadow-violet-500/25 hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Neuer Kunde</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Kunden suchen…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editId ? 'Kunde bearbeiten' : 'Neuer Kunde'}
              </h3>
              <button onClick={closeForm} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name *</label>
                <input
                  type="text" required autoFocus
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Max Mustermann"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Firma</label>
                <input
                  type="text"
                  value={form.firma} onChange={e => setForm(f => ({ ...f, firma: e.target.value }))}
                  placeholder="Musterfirma GmbH"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">E-Mail</label>
                  <input
                    type="email"
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="max@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Telefon</label>
                  <input
                    type="tel"
                    value={form.telefon} onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))}
                    placeholder="+43 123 456789"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notizen</label>
                <textarea
                  rows={3}
                  value={form.notizen} onChange={e => setForm(f => ({ ...f, notizen: e.target.value }))}
                  placeholder="Optionale Notizen…"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium">
                  Abbrechen
                </button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-semibold shadow-lg shadow-violet-500/25 hover:shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editId ? 'Speichern' : 'Anlegen'}
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
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Kunde löschen?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Diese Aktion kann nicht rückgängig gemacht werden.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Abbrechen
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors">
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50">
          <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">{search ? 'Keine Kunden gefunden' : 'Noch keine Kunden angelegt'}</p>
          {!search && (
            <button onClick={openAdd} className="mt-4 inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 hover:underline">
              <Plus className="w-4 h-4" /> Ersten Kunden anlegen
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(k => (
            <div key={k.id} className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 p-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center shrink-0 shadow-md shadow-violet-500/20">
                  <span className="text-white font-bold text-lg">{k.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{k.name}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                    {k.firma && (
                      <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Building2 className="w-3 h-3" /> {k.firma}
                      </span>
                    )}
                    {k.email && (
                      <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Mail className="w-3 h-3" /> {k.email}
                      </span>
                    )}
                    {k.telefon && (
                      <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Phone className="w-3 h-3" /> {k.telefon}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(k)} className="p-2 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteConfirm(k.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Link href={`/crm/kunden/${k.id}`} className="p-2 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              {k.notizen && (
                <div className="px-4 pb-4">
                  <p className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900/50 rounded-lg px-3 py-2 line-clamp-2">{k.notizen}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
