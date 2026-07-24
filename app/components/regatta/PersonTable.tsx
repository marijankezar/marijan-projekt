'use client';

import { ArrowDown, ArrowUp, Pencil, Trash2, ShieldCheck, LogIn } from 'lucide-react';
import type { RegattaPerson } from './PersonFormDialog';

interface PersonTableProps {
  persons: RegattaPerson[];
  sortBy: string;
  sortDir: 'asc' | 'desc';
  onSort: (column: string) => void;
  onEdit: (person: RegattaPerson) => void;
  onDelete: (person: RegattaPerson) => void;
}

const COLUMNS: { key: string; label: string }[] = [
  { key: 'startNumber', label: 'Nr.' },
  { key: 'displayName', label: 'Name' },
  { key: 'email', label: 'E-Mail' },
];

export default function PersonTable({ persons, sortBy, sortDir, onSort, onEdit, onDelete }: PersonTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700/50">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800/50 text-left text-gray-500 dark:text-gray-400">
          <tr>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                onClick={() => onSort(col.key)}
                className="px-4 py-3 font-medium cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200"
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {sortBy === col.key && (sortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />)}
                </span>
              </th>
            ))}
            <th className="px-4 py-3 font-medium">Rolle</th>
            <th className="px-4 py-3 font-medium text-right">Aktionen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {persons.map((p) => (
            <tr key={p.id} className="bg-white dark:bg-gray-800/50">
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{p.startNumber || '—'}</td>
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{p.displayName}</td>
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{p.email || '—'}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  {p.isAdmin && (
                    <span title="Admin" className="text-blue-500">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                  )}
                  {p.canLogin && (
                    <span title="Login möglich" className="text-emerald-500">
                      <LogIn className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => onEdit(p)}
                    className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    aria-label="Bearbeiten"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(p)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    aria-label="Löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {persons.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                Keine Personen gefunden.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
