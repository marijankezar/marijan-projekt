'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Save, X, Mail, Phone, Building2, StickyNote, FolderKanban, Loader2, Trash2, ChevronRight } from 'lucide-react';
import type { CrmKunde, CrmProjekt } from '@/types/crm';

const statusColors: Record<string, string> = {
  offen: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  aktiv: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  abgeschlossen: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  pausiert: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
};

export default function KundeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [kunde, setKunde] = useState<CrmKunde | null>(null);
  const [projekte, setProjekte] = useState<CrmProjekt[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', firma: '', email: '', telefon: '', notizen: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const fetchData = async () => {
    const [kundeRes, projekteRes] = await Promise.all([
      fetch(`/api/crm/kunden/${id}`),
      fetch(`/api/crm/projekte`),
    ]);
    if (kundeRes.ok) {
      const k: CrmKunde = await kundeRes.json();
      setKunde(k);
      setForm({ name: k.name, firma: k.firma || '', email: k.email || '', telefon: k.telefon || '', notizen: k.notizen || '' });
    } else {
      router.push('/crm/kunden');
    }
    if (projekteRes.ok) {
      const allProjekte: CrmProjekt[] = await projekteRes.json();
      setProjekte(allProjekte.filter(p => p.kunde_id === parseInt(id)));
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name ist erforderlich'); return; }
    setSaving(true);
    setError('');
    const res = await fetch(`/api/crm/kunden/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      const updated = await res.json();
      setKunde(updated);
      setEditing(false);
    } else {
      const data = await res.json();
      setError(data.error || 'Fehler beim Speichern');
    }
  };

  const handleDelete = async () => {
    const res = await fetch(`/api/crm/kunden/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/crm/kunden');
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
    </div>
  );
  if (!kunde) return null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back */}
      <Link href="/crm/kunden" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Zurück zu Kunden
      </Link>

      {/* Kunde Card */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <span className="text-white font-bold text-2xl">{kunde.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{kunde.name}</h2>
              {kunde.firma && <p className="text-gray-500 dark:text-gray-400">{kunde.firma}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!editing ? (
              <>
                <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium">
                  <Pencil className="w-4 h-4" /> Bearbeiten
                </button>
                <button onClick={() => setDeleteConfirm(true)} className="p-2 rounded-xl border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { setEditing(false); setError(''); }} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium">
                  <X className="w-4 h-4" /> Abbrechen
                </button>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-medium shadow-lg shadow-violet-500/25 hover:shadow-xl transition-all disabled:opacity-60 text-sm">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Speichern
                </button>
              </>
            )}
          </div>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">{error}</div>
          )}

          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Firma</label>
                  <input type="text" value={form.firma} onChange={e => setForm(f => ({ ...f, firma: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">E-Mail</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Telefon</label>
                  <input type="tel" value={form.telefon} onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notizen</label>
                <textarea rows={3} value={form.notizen} onChange={e => setForm(f => ({ ...f, notizen: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none" />
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {kunde.email && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">E-Mail</p>
                    <a href={`mailto:${kunde.email}`} className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline">{kunde.email}</a>
                  </div>
                </div>
              )}
              {kunde.telefon && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Telefon</p>
                    <a href={`tel:${kunde.telefon}`} className="text-sm font-medium text-gray-800 dark:text-gray-200">{kunde.telefon}</a>
                  </div>
                </div>
              )}
              {kunde.firma && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                  <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Firma</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{kunde.firma}</p>
                  </div>
                </div>
              )}
              {kunde.notizen && (
                <div className="sm:col-span-2 flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                  <StickyNote className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400">Notizen</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{kunde.notizen}</p>
                  </div>
                </div>
              )}
              {!kunde.email && !kunde.telefon && !kunde.firma && !kunde.notizen && (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic sm:col-span-2">Keine weiteren Infos hinterlegt.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Projekte */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Projekte ({projekte.length})</h3>
          </div>
          <Link href="/crm/projekte" className="text-sm text-violet-600 dark:text-violet-400 hover:underline">+ Neues Projekt</Link>
        </div>
        {projekte.length === 0 ? (
          <p className="p-6 text-sm text-gray-400 dark:text-gray-500 text-center italic">Noch keine Projekte für diesen Kunden</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {projekte.map(p => (
              <li key={p.id}>
                <Link href={`/crm/projekte/${p.id}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{p.titel}</p>
                    {p.deadline && <p className="text-xs text-gray-500 dark:text-gray-400">Deadline: {new Date(p.deadline).toLocaleDateString('de-AT')}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[p.status]}`}>{p.status}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Kunde löschen?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Diese Aktion kann nicht rückgängig gemacht werden.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Abbrechen</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors">Löschen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
