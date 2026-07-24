'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sailboat, CalendarDays, MapPin } from 'lucide-react';

interface RegattaEventSummary {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  eventDate: string;
  status: 'planned' | 'active' | 'ended';
}

const STATUS_LABEL: Record<RegattaEventSummary['status'], string> = {
  planned: 'Geplant',
  active: 'Aktiv',
  ended: 'Beendet',
};

const STATUS_CLASS: Record<RegattaEventSummary['status'], string> = {
  planned: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  ended: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
};

export default function PublicEventsPage() {
  const [events, setEvents] = useState<RegattaEventSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/regatta/events')
      .then((res) => res.json())
      .then((body) => setEvents(body.rows ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Sailboat className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Regatta-Veranstaltungen</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Zur Anmeldung eine Veranstaltung auswählen</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-semibold text-gray-900 dark:text-white">{ev.name}</h2>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASS[ev.status]}`}>
                      {STATUS_LABEL[ev.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {ev.eventDate}
                    </span>
                    {ev.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {ev.location}
                      </span>
                    )}
                  </p>
                  {ev.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{ev.description}</p>
                  )}
                </div>
                <div className="shrink-0 flex flex-col sm:flex-row gap-2">
                  {ev.status !== 'ended' && (
                    <Link
                      href={`/regatta/events/${ev.id}/register`}
                      className="text-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
                    >
                      Jetzt anmelden
                    </Link>
                  )}
                  {ev.status === 'active' && (
                    <Link
                      href={`/regatta/events/${ev.id}/live`}
                      className="text-center px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                    >
                      Live
                    </Link>
                  )}
                  {ev.status !== 'planned' && (
                    <Link
                      href={`/regatta/events/${ev.id}/results`}
                      className="text-center px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                    >
                      Ergebnisse
                    </Link>
                  )}
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="text-center py-12 text-gray-400">Aktuell sind keine Veranstaltungen angelegt.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
