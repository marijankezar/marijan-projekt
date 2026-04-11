'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Save, X, Calendar, Euro, Users, FileText, Loader2, Trash2, CheckSquare, Plus, ChevronRight } from 'lucide-react';
import type { CrmProjekt, CrmKunde, CrmAufgabe } from '@/types/crm';

const statusLabels: Record<string, string> = {
  offen: 'Offen', aktiv: 'Aktiv', abgeschlossen: 'Abgeschlossen', pausiert: 'Pausiert',
};
const statusColors: Record<string, string> = {
  offen: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  aktiv: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  abgeschlossen: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  pausiert: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
};
const prioritaetColors: Record<string, string> = {
  hoch: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  mittel: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
  niedrig: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
};

export default function ProjektDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [projekt, setProjekt] = useState<CrmProjekt | null>(null);
  const [kunden, setKunden] = useState<CrmKunde[]>([]);
  const [aufgaben, setAufgaben] = useState<CrmAufgabe[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ titel: '', kunde_id: '', beschreibung: '', status: 'offen', budget: '', deadline: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const fetchData = async () => {
    const [pRes, kRes, aRes] = await Promise.all([
      fetch(`/api/crm/projekte/${id}`),
      fetch('/api/crm/kunden'),
      fetch(`/api/crm/aufgaben?projekt_id=${id}`),
    ]);
    if (pRes.ok) {
      const p: CrmProjekt = await pRes.json();
      setProjekt(p);
      setForm({ titel: p.titel, kunde_id: p.kunde_id?.toString() || '', beschreibung: p.beschreibung || '', status: p.status, budget: p.budget?.toString() || '', deadline: p.deadline ? p.deadline.split('T')[0] : '' });
    } else { router.push('/crm/projekte'); }
    if (kRes.ok) setKunden(await kRes.json());
    if (aRes.ok) setAufgaben(await aRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleSave = async () => {
    if (!form.titel.trim()) { setError('Titel ist erforderlich'); return; }
    setSaving(true); setError('');
    const res = await fetch(`/api/crm/projekte/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, kunde_id: form.kunde_id ? parseInt(form.kunde_id) : null }),
    });
    setSaving(false);
    if (res.ok) { const p = await res.json(); setProjekt(p); setEditing(false); }
    else { const d = await res.json(); setError(d.error || 'Fehler'); }
  };

  const handleDelete = async () => {
    const res = await fetch(`/api/crm/projekte/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/crm/projekte');
  };

  const toggleAufgabeStatus = async (a: CrmAufgabe) => {
    const nextStatus = a.status === 'offen' ? 'in_bearbeitung' : a.status === 'in_bearbeitung' ? 'erledigt' : 'offen';
    await fetch(`/api/crm/aufgaben/${a.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...a, status: nextStatus }),
    });
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  if (!projekt) return null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Link href="/crm/projekte" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Zurück zu Projekte
      </Link>

      {/* Projekt Card */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{projekt.titel}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[projekt.status]}`}>{statusLabels[projekt.status]}</span>
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
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all disabled:opacity-60 text-sm">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Speichern
                </button>
              </>
            )}
          </div>
        </div>

        <div className="p-6">
          {error && <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">{error}</div>}
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Titel *</label>
                <input type="text" value={form.titel} onChange={e => setForm(f => ({ ...f, titel: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Kunde</label>
                  <select value={form.kunde_id} onChange={e => setForm(f => ({ ...f, kunde_id: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">— Kein Kunde —</option>
                    {kunden.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                  </select>
                </div>
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
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Deadline</label>
                  <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Beschreibung</label>
                <textarea rows={3} value={form.beschreibung} onChange={e => setForm(f => ({ ...f, beschreibung: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {projekt.kunde_name && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                  <Users className="w-4 h-4 text-gray-400 shrink-0" />
                  <div><p className="text-xs text-gray-400">Kunde</p>
                    <Link href="/crm/kunden" className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline">{projekt.kunde_name}</Link>
                  </div>
                </div>
              )}
              {projekt.deadline && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                  <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                  <div><p className="text-xs text-gray-400">Deadline</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{new Date(projekt.deadline).toLocaleDateString('de-AT')}</p>
                  </div>
                </div>
              )}
              {projekt.budget != null && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                  <Euro className="w-4 h-4 text-gray-400 shrink-0" />
                  <div><p className="text-xs text-gray-400">Budget</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{Number(projekt.budget).toLocaleString('de-AT', { style: 'currency', currency: 'EUR' })}</p>
                  </div>
                </div>
              )}
              {projekt.beschreibung && (
                <div className="sm:col-span-2 flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                  <FileText className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <div><p className="text-xs text-gray-400">Beschreibung</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{projekt.beschreibung}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Aufgaben */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Aufgaben ({aufgaben.length})</h3>
          </div>
          <Link href="/crm/aufgaben" className="text-sm text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Neue Aufgabe
          </Link>
        </div>
        {aufgaben.length === 0 ? (
          <p className="p-6 text-sm text-gray-400 dark:text-gray-500 text-center italic">Noch keine Aufgaben für dieses Projekt</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {aufgaben.map(a => (
              <li key={a.id} className="flex items-center gap-3 px-5 py-3.5">
                <button onClick={() => toggleAufgabeStatus(a)} title="Status wechseln"
                  className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${a.status === 'erledigt' ? 'bg-green-500 border-green-500' : a.status === 'in_bearbeitung' ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'}`}>
                  {a.status !== 'offen' && <div className="w-2 h-2 rounded-full bg-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm truncate ${a.status === 'erledigt' ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>{a.titel}</p>
                  {a.faellig_am && <p className="text-xs text-gray-400">{new Date(a.faellig_am).toLocaleDateString('de-AT')}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${prioritaetColors[a.prioritaet]}`}>{a.prioritaet}</span>
                  <Link href="/crm/aufgaben" className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Projekt löschen?</h3>
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
