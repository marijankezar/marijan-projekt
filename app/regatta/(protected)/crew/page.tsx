'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import PersonFormDialog, { type RegattaPerson } from '../../../components/regatta/PersonFormDialog';
import PersonTable from '../../../components/regatta/PersonTable';

const PAGE_SIZE = 20;

export default function CrewPage() {
  const [persons, setPersons] = useState<RegattaPerson[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('displayName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RegattaPerson | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RegattaPerson | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      search,
      sortBy,
      sortDir,
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    const res = await fetch(`/api/regatta/persons?${params}`);
    if (res.ok) {
      const body = await res.json();
      setPersons(body.rows);
      setTotal(body.total);
    }
    setLoading(false);
  }, [search, sortBy, sortDir, page]);

  useEffect(() => {
    const timeout = setTimeout(load, 250); // Debounce, v.a. für Suche
    return () => clearTimeout(timeout);
  }, [load]);

  function handleSort(column: string) {
    if (sortBy === column) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/regatta/persons/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      load();
    } finally {
      setDeleting(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" />
            Crew-Verwaltung
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{total} Personen</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          Neue Person
        </button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Suche nach Name, Startnummer, E-Mail…"
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <PersonTable
            persons={persons}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
            onEdit={(p) => {
              setEditing(p);
              setFormOpen(true);
            }}
            onDelete={setDeleteTarget}
          />

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

      <PersonFormDialog
        open={formOpen}
        person={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          load();
        }}
      />

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Person löschen?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              <strong>{deleteTarget.displayName}</strong> sowie alle zugehörigen Tracking-Sessions und GPS-Punkte
              werden unwiderruflich gelöscht.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-5 py-2.5 rounded-xl font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
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
