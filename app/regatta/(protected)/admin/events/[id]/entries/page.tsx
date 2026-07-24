'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface CrewMember {
  firstName: string;
  lastName: string;
  nation: string;
  birthYear: number;
  position: number;
}

interface EntryRow {
  id: string;
  boatClassName: string;
  skipperName: string;
  boatName: string;
  sailNumber: string;
  startNumber: string;
  crew: CrewMember[];
}

interface EventSummary {
  id: string;
  name: string;
}

export default function EventEntriesAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<EventSummary | null>(null);
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [eventRes, entriesRes] = await Promise.all([
      fetch(`/api/regatta/events/${id}`),
      fetch(`/api/regatta/events/${id}/entries`),
    ]);
    if (eventRes.ok) setEvent(await eventRes.json());
    if (entriesRes.ok) {
      const body = await entriesRes.json();
      setEntries(body.rows);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(entryId: string) {
    setDeleting(entryId);
    try {
      await fetch(`/api/regatta/entries/${entryId}`, { method: 'DELETE' });
      load();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      <Link
        href="/regatta/admin/events"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Zurück zu Veranstaltungen
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
        <Users className="w-6 h-6 text-blue-500" />
        Meldungen
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {event?.name} · {entries.length} Boote gemeldet
      </p>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const isOpen = expanded === entry.id;
            return (
              <div
                key={entry.id}
                className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden"
              >
                <div className="flex items-center justify-between p-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
                        #{entry.startNumber}
                      </span>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{entry.boatName}</h3>
                      <span className="text-xs text-gray-400">({entry.boatClassName})</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Segel {entry.sailNumber} · Skipper {entry.skipperName} · {entry.crew.length} Crewmitglied(er)
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setExpanded(isOpen ? null : entry.id)}
                      className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      aria-label="Crew anzeigen"
                    >
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      disabled={deleting === entry.id}
                      className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-600"
                      aria-label="Meldung stornieren"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {isOpen && (
                  <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800 pt-4">
                    {entry.crew.length === 0 ? (
                      <p className="text-sm text-gray-400">Keine weiteren Crewmitglieder gemeldet.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {entry.crew.map((c) => (
                          <li key={c.position} className="text-sm text-gray-600 dark:text-gray-300">
                            {c.firstName} {c.lastName} · {c.nation} · {c.birthYear}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {entries.length === 0 && (
            <div className="text-center py-12 text-gray-400">Noch keine Meldungen für diese Veranstaltung.</div>
          )}
        </div>
      )}
    </div>
  );
}
