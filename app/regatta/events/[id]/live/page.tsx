'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Radio, Trophy, Flag } from 'lucide-react';
import { useRegattaLive } from '@/lib/useRegattaLive';
import type { RegattaLatLng } from '../../../../components/regatta/RegattaMap';

const RegattaMap = dynamic(() => import('../../../../components/regatta/RegattaMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />,
});

interface EventSummary {
  id: string;
  name: string;
  status: 'planned' | 'active' | 'ended';
}

interface EntrySummary {
  id: string;
  boatName: string;
  startNumber: string;
  boatClassName: string;
  skipperName: string;
}

interface ResultRow {
  entryId: string;
  place: number | null;
  placeCorrected: number | null;
}

export default function PublicLivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<EventSummary | null>(null);
  const [entries, setEntries] = useState<EntrySummary[]>([]);
  const [finishLine, setFinishLine] = useState<{ a: RegattaLatLng; b: RegattaLatLng } | null>(null);
  const [results, setResults] = useState<ResultRow[]>([]);

  const loadResults = useCallback(() => {
    fetch(`/api/regatta/events/${id}/results`)
      .then((res) => res.json())
      .then((body) => setResults(body.rows ?? []));
  }, [id]);

  useEffect(() => {
    (async () => {
      const [eventRes, entriesRes, lineRes] = await Promise.all([
        fetch(`/api/regatta/events/${id}`),
        fetch(`/api/regatta/events/${id}/entries`),
        fetch(`/api/regatta/events/${id}/finish-line`),
      ]);
      if (eventRes.ok) setEvent(await eventRes.json());
      if (entriesRes.ok) {
        const body = await entriesRes.json();
        setEntries(body.rows);
      }
      if (lineRes.ok) {
        const body = await lineRes.json();
        if (body.finishLine) {
          setFinishLine({
            a: { lat: body.finishLine.pointALat, lng: body.finishLine.pointALng },
            b: { lat: body.finishLine.pointBLat, lng: body.finishLine.pointBLng },
          });
        }
      }
    })();
    loadResults();
  }, [id, loadResults]);

  const liveSessions = useRegattaLive(`/api/regatta/events/${id}/live`, loadResults);

  const entryById = useMemo(() => new Map(entries.map((e) => [e.id, e])), [entries]);
  const resultByEntryId = useMemo(() => new Map(results.map((r) => [r.entryId, r])), [results]);
  const liveEntryIds = useMemo(
    () => new Set(Object.values(liveSessions).map((s) => s.entryId).filter((v): v is string => !!v)),
    [liveSessions]
  );

  const markers = Object.values(liveSessions).map((s) => {
    const entry = s.entryId ? entryById.get(s.entryId) : undefined;
    return {
      id: s.sessionId,
      lat: s.lat,
      lng: s.lng,
      color: s.color,
      label: entry ? `#${entry.startNumber} ${entry.boatName}` : s.displayName,
    };
  });
  const trails = Object.fromEntries(Object.values(liveSessions).map((s) => [s.sessionId, s.trail]));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/regatta/events"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Übersicht
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Live</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{event?.name}</p>
            </div>
          </div>
          <Link
            href={`/regatta/events/${id}/results`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Trophy className="w-4 h-4" />
            Ergebnisse
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-4 max-h-[70vh] overflow-y-auto">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">
              Teilnehmer ({entries.length})
            </h2>
            <ul className="space-y-1">
              {entries.map((entry) => {
                const isLive = liveEntryIds.has(entry.id);
                const result = resultByEntryId.get(entry.id);
                return (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        #{entry.startNumber} {entry.boatName}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {entry.boatClassName} · {entry.skipperName}
                      </p>
                    </div>
                    {result?.place ? (
                      <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                        <Flag className="w-3 h-3" />
                        {result.place}.
                      </span>
                    ) : isLive ? (
                      <span className="shrink-0 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    ) : null}
                  </li>
                );
              })}
              {entries.length === 0 && <p className="text-sm text-gray-400 px-3 py-2">Keine Meldungen.</p>}
            </ul>
          </div>

          <div className="h-[50vh] lg:h-[70vh] rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700/50 shadow-sm">
            <RegattaMap markers={markers} trails={trails} finishLine={finishLine} defaultZoom={13} autoFit />
          </div>
        </div>
      </div>
    </div>
  );
}
