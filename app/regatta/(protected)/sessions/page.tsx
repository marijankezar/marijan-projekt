'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { History, ChevronLeft, ChevronRight, MapPin, X, Loader2, Trash2 } from 'lucide-react';
import { colorForPersonId } from '@/lib/regatta-colors';

const RegattaMap = dynamic(() => import('../../../components/regatta/RegattaMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />,
});

interface SessionRow {
  id: string;
  personId: string;
  displayName: string;
  startedAt: string;
  stoppedAt: string | null;
  pointCount: number;
}

interface PersonOption {
  id: string;
  displayName: string;
}

/** Ergebnis eines geladenen Tracks für die Vergleichskarte, oder 'error' falls das Laden fehlschlug. */
type TrackCacheEntry = { points: [number, number][]; personId: string; displayName: string } | 'error';

const PAGE_SIZE = 20;
const MAX_SELECTED = 15; // colorForPersonId hat nur 8 unterscheidbare Farben, mehr überlagerte Linien sind ohnehin unlesbar

function formatDuration(startedAt: string, stoppedAt: string | null): string {
  if (!stoppedAt) return '—';
  const seconds = (new Date(stoppedAt).getTime() - new Date(startedAt).getTime()) / 1000;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

export default function SessionsHistoryPage() {
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [persons, setPersons] = useState<PersonOption[]>([]);
  const [personFilter, setPersonFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Vergleichskarte: Auswahl bleibt bewusst über Filter-/Seitenwechsel hinweg bestehen.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [trackCache, setTrackCache] = useState<Record<string, TrackCacheEntry>>({});
  const inFlightRef = useRef<Set<string>>(new Set());

  // Löschen (Admin, mit erneuter Passwort-Bestätigung - unwiderruflich)
  const [deleteTarget, setDeleteTarget] = useState<SessionRow | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Eingeloggte Person laden -> Namensfilter nur für Admins sichtbar (sie sehen ohnehin nur sich selbst)
  useEffect(() => {
    (async () => {
      const res = await fetch('/api/regatta/auth/me');
      if (!res.ok) return;
      const { user } = await res.json();
      setIsAdmin(!!user.isAdmin);
      if (user.isAdmin) {
        const personsRes = await fetch('/api/regatta/persons?pageSize=100&sortBy=displayName');
        if (personsRes.ok) {
          const body = await personsRes.json();
          setPersons(body.rows.map((p: PersonOption) => ({ id: p.id, displayName: p.displayName })));
        }
      }
    })();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (personFilter) params.set('personId', personFilter);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    const res = await fetch(`/api/regatta/sessions/history?${params}`);
    if (res.ok) {
      const body = await res.json();
      setRows(body.rows);
      setTotal(body.total);
    }
    setLoading(false);
  }, [page, personFilter, dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  // Lädt Track-Punkte für neu ausgewählte Sessions. Cache-Hits und bereits laufende
  // Requests werden übersprungen -> Wiederanhaken eines Tracks verursacht keinen Request.
  useEffect(() => {
    selectedIds.forEach((id) => {
      if (trackCache[id] || inFlightRef.current.has(id)) return;
      inFlightRef.current.add(id);
      fetch(`/api/regatta/sessions/${id}/points`)
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((body) => {
          setTrackCache((prev) => ({
            ...prev,
            [id]: {
              points: body.points.map((p: { lat: number; lng: number }) => [p.lat, p.lng] as [number, number]),
              personId: body.session.personId,
              displayName: body.session.displayName,
            },
          }));
        })
        .catch(() => {
          setTrackCache((prev) => ({ ...prev, [id]: 'error' }));
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        })
        .finally(() => {
          inFlightRef.current.delete(id);
        });
    });
  }, [selectedIds, trackCache]);

  function toggleTrack(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX_SELECTED) {
        next.add(id);
      }
      return next;
    });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/regatta/sessions/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Löschen fehlgeschlagen');
      }
      const deletedId = deleteTarget.id;
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deletedId);
        return next;
      });
      setTrackCache((prev) => {
        const next = { ...prev };
        delete next[deletedId];
        return next;
      });
      setDeleteTarget(null);
      setDeletePassword('');
      load();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Löschen fehlgeschlagen');
    } finally {
      setDeleting(false);
    }
  }

  // Nur die tatsächlich geladenen Tracks der Auswahl, als stabiler Inhalts-Schlüssel
  // (nicht die trackCache-Referenz selbst, die sich bei jedem Cache-Write ändert).
  const visibleIds = useMemo(
    () =>
      Array.from(selectedIds)
        .filter((id) => {
          const entry = trackCache[id];
          return typeof entry === 'object' && entry.points.length > 0;
        })
        .sort(),
    [selectedIds, trackCache]
  );
  const visibleKey = visibleIds.join(',');

  const { mapMarkers, mapTrails } = useMemo(() => {
    const trailsMap: Record<string, [number, number][]> = {};
    const markers = visibleIds.map((id) => {
      const entry = trackCache[id] as Exclude<TrackCacheEntry, 'error'>;
      trailsMap[id] = entry.points;
      const last = entry.points[entry.points.length - 1];
      return {
        id,
        lat: last[0],
        lng: last[1],
        color: colorForPersonId(entry.personId),
        label: entry.displayName,
        pulse: false,
      };
    });
    return { mapMarkers: markers, mapTrails: trailsMap };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bewusst über visibleKey (Inhalt) gesteuert, nicht trackCache-Referenz
  }, [visibleKey]);

  const erroredNames = Object.entries(trackCache)
    .filter(([, entry]) => entry === 'error')
    .map(([id]) => rows.find((r) => r.id === id)?.displayName ?? id);

  const hasFilters = personFilter || dateFrom || dateTo;
  function resetFilters() {
    setPersonFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
        <History className="w-6 h-6 text-blue-500" />
        Verlauf
      </h1>

      <div className="flex flex-wrap items-end gap-3 mb-4">
        {isAdmin && (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Person</label>
            <select
              value={personFilter}
              onChange={(e) => {
                setPage(1);
                setPersonFilter(e.target.value);
              }}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Alle Personen</option>
              {persons.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.displayName}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Von</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setPage(1);
              setDateFrom(e.target.value);
            }}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Bis</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setPage(1);
              setDateTo(e.target.value);
            }}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {hasFilters && (
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <X className="w-3.5 h-3.5" />
            Filter zurücksetzen
          </button>
        )}
      </div>

      {erroredNames.length > 0 && (
        <div className="px-4 py-3 mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
          Track{erroredNames.length > 1 ? 's' : ''} konnte{erroredNames.length > 1 ? 'n' : ''} nicht geladen werden:{' '}
          {erroredNames.join(', ')}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700/50">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-left text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium w-10">
                    <span className="sr-only">Auswahl</span>
                  </th>
                  <th className="px-4 py-3 font-medium">Person</th>
                  <th className="px-4 py-3 font-medium">Datum</th>
                  <th className="px-4 py-3 font-medium">Dauer</th>
                  <th className="px-4 py-3 font-medium">Punkte</th>
                  <th className="px-4 py-3 font-medium text-right">Aktion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {rows.map((r) => {
                  const isSelected = selectedIds.has(r.id);
                  const isLoadingTrack = isSelected && !trackCache[r.id];
                  return (
                    <tr key={r.id} className="bg-white dark:bg-gray-800/50">
                      <td className="px-4 py-3">
                        {isLoadingTrack ? (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        ) : (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={r.pointCount === 0 || (!isSelected && selectedIds.size >= MAX_SELECTED)}
                            onChange={() => toggleTrack(r.id)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-30"
                            title={r.pointCount === 0 ? 'Keine GPS-Punkte vorhanden' : undefined}
                            aria-label={`Track von ${r.displayName} auf der Karte anzeigen`}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{r.displayName}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {new Date(r.startedAt).toLocaleString('de-AT', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {formatDuration(r.startedAt, r.stoppedAt)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{r.pointCount}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Link
                            href={`/regatta/sessions/${r.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            Ansehen
                          </Link>
                          {isAdmin && (
                            <button
                              onClick={() => {
                                setDeleteTarget(r);
                                setDeletePassword('');
                                setDeleteError(null);
                              }}
                              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              aria-label={`Track von ${r.displayName} löschen`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      {hasFilters ? 'Keine Sessions für diese Filter gefunden.' : 'Noch keine abgeschlossenen Sessions.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Seite {page} von {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Vergleichskarte <span className="text-gray-400 font-normal">({visibleIds.length})</span>
          </h2>
          {selectedIds.size >= MAX_SELECTED && (
            <span className="text-xs text-gray-400">Maximal {MAX_SELECTED} Tracks gleichzeitig auswählbar</span>
          )}
        </div>

        {visibleIds.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {mapMarkers.map((m) => (
              <button
                key={m.id}
                onClick={() => toggleTrack(m.id)}
                className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                {m.label}
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            ))}
          </div>
        )}

        <div className="h-[50vh] min-h-[320px] rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700/50 shadow-sm">
          {visibleIds.length > 0 ? (
            <RegattaMap markers={mapMarkers} trails={mapTrails} autoFit />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm text-center px-6">
              Wähle Tracks aus der Liste aus, um sie hier zu vergleichen.
            </div>
          )}
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Track löschen?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Der Track von <strong>{deleteTarget.displayName}</strong> vom{' '}
              {new Date(deleteTarget.startedAt).toLocaleString('de-AT', { dateStyle: 'medium', timeStyle: 'short' })}{' '}
              sowie alle zugehörigen GPS-Punkte werden unwiderruflich gelöscht.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleDelete();
              }}
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Admin-Passwort zur Bestätigung
              </label>
              <input
                type="password"
                autoFocus
                required
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent mb-2"
              />

              {deleteError && (
                <div className="px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm mb-2">
                  {deleteError}
                </div>
              )}

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="px-5 py-2.5 rounded-xl font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={deleting || !deletePassword}
                  className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold shadow-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? 'Löscht…' : 'Löschen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
