'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy } from 'lucide-react';

interface ResultRow {
  entryId: string;
  boatClassName: string;
  yardstick: number;
  skipperName: string;
  boatName: string;
  sailNumber: string;
  startNumber: string;
  finishAt: string | null;
  sailedSeconds: number | null;
  correctedSeconds: number | null;
  place: number | null;
  placeCorrected: number | null;
}

type SortBy = 'realtime' | 'corrected' | 'class';

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'corrected', label: 'Yardstick' },
  { value: 'realtime', label: 'Echtzeit' },
  { value: 'class', label: 'Klasse' },
];

function formatDuration(seconds: number | null): string {
  if (seconds == null) return '—';
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

function formatClock(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [eventName, setEventName] = useState('');
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>('corrected');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/regatta/events/${id}/results?sortBy=${sortBy}`)
      .then((res) => res.json())
      .then((body) => {
        setRows(body.rows ?? []);
        setEventName(body.eventName ?? '');
      })
      .finally(() => setLoading(false));
  }, [id, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/regatta/events"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Übersicht
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Ergebnisse</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{eventName}</p>
            </div>
          </div>

          <div className="flex gap-1 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50 p-1">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === opt.value
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-gray-800 text-left text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Platz</th>
                  <th className="px-4 py-3 font-medium">Startnr.</th>
                  <th className="px-4 py-3 font-medium">Segelnr.</th>
                  <th className="px-4 py-3 font-medium">Boot</th>
                  <th className="px-4 py-3 font-medium">Klasse</th>
                  <th className="px-4 py-3 font-medium">Skipper</th>
                  <th className="px-4 py-3 font-medium">Zielzeit</th>
                  <th className="px-4 py-3 font-medium">Gesegelte Zeit</th>
                  <th className="px-4 py-3 font-medium">Yardstick</th>
                  <th className="px-4 py-3 font-medium">Berechnete Zeit</th>
                  <th className="px-4 py-3 font-medium">Platz (Yardstick)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {rows.map((r) => (
                  <tr key={r.entryId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{r.place ?? 'DNF'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">#{r.startNumber}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.sailNumber}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{r.boatName}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.boatClassName}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.skipperName}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 tabular-nums">{formatClock(r.finishAt)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 tabular-nums">{formatDuration(r.sailedSeconds)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 tabular-nums">{r.yardstick}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 tabular-nums">{formatDuration(r.correctedSeconds)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{r.placeCorrected ?? 'DNF'}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-gray-400">
                      Noch keine Meldungen für diese Veranstaltung.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
