'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, CalendarDays, Pencil, Trash2, MapPinned, Users, Trophy } from 'lucide-react';
import EventFormDialog, { type RegattaEvent } from '../../../../components/regatta/EventFormDialog';

const STATUS_LABEL: Record<RegattaEvent['status'], string> = {
  planned: 'Geplant',
  active: 'Aktiv',
  ended: 'Beendet',
};

const STATUS_CLASS: Record<RegattaEvent['status'], string> = {
  planned: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  ended: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
};

export default function EventsAdminPage() {
  const [events, setEvents] = useState<RegattaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RegattaEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RegattaEvent | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/regatta/events');
    if (res.ok) {
      const body = await res.json();
      setEvents(body.rows);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/regatta/events/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Löschen fehlgeschlagen');
      }
      setDeleteTarget(null);
      setDeletePassword('');
      load();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Löschen fehlgeschlagen');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-blue-500" />
            Veranstaltungen
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{events.length} Veranstaltungen</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          Neue Veranstaltung
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{ev.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASS[ev.status]}`}>
                      {STATUS_LABEL[ev.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {ev.eventDate} · {ev.location || 'Ort nicht angegeben'} · GPS-Intervall {ev.gpsIntervalSeconds}s
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/regatta/admin/events/${ev.id}/finish-line`}
                    className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600"
                    aria-label="Ziellinie"
                    title="Ziellinie definieren"
                  >
                    <MapPinned className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/regatta/admin/events/${ev.id}/entries`}
                    className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600"
                    aria-label="Meldungen"
                    title="Meldungen"
                  >
                    <Users className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/regatta/events/${ev.id}/results`}
                    className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600"
                    aria-label="Ergebnisse"
                    title="Ergebnisse ansehen"
                  >
                    <Trophy className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => {
                      setEditing(ev);
                      setFormOpen(true);
                    }}
                    className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600"
                    aria-label="Bearbeiten"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setDeleteTarget(ev);
                      setDeleteError(null);
                      setDeletePassword('');
                    }}
                    className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-600"
                    aria-label="Löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <div className="text-center py-12 text-gray-400">Noch keine Veranstaltungen angelegt.</div>
          )}
        </div>
      )}

      <EventFormDialog
        open={formOpen}
        event={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          load();
        }}
      />

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Veranstaltung löschen?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              <strong>{deleteTarget.name}</strong> sowie alle Meldungen, Crew-Daten, Ziellinie und Zielzeiten werden
              unwiderruflich gelöscht. Bitte bestätige mit deinem Admin-Passwort.
            </p>
            <input
              type="password"
              autoFocus
              required
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Admin-Passwort"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent mb-2"
            />
            {deleteError && (
              <div className="px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm mb-2">
                {deleteError}
              </div>
            )}
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-5 py-2.5 rounded-xl font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || !deletePassword}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold shadow-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Löscht…' : 'Löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
