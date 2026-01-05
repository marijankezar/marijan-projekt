// pages/stundenbuchungen.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LogoutButton from '../components/LogoutButton'; // Pfad anpassen

// Interface für Stundenbuchung
export interface Stundenbuchung {
  id: number;
  id_person: number;
  id_baustelle: number;
  timestamp: string;
  datum: string;
  stunden: number | null;
  baustelle: string;
  platzhalter_text: string | null;
  platzhalter_int: number | null;
  platzhalter_double: number | null;
}

export default function StundenbuchungenList() {
  const [buchungen, setBuchungen] = useState<Stundenbuchung[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchBuchungen() {
      try {
        const res = await fetch('/api/stundenbuchungen');

        if (res.status === 401) {
          console.warn('Nicht eingeloggt – Weiterleitung zur Login-Seite');
          router.push('/login');
          return;
        }

        const data: Stundenbuchung[] = await res.json();
        setBuchungen(data);
      } catch (error) {
        console.error('Fehler beim Laden der Stundenbuchungen:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchBuchungen();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center bg-gradient-to-b from-gray-100 via-gray-200 to-gray-300 dark:from-black dark:via-gray-900 dark:to-gray-800 p-4 mt-8">
        <p className="text-lg text-indigo-600 dark:text-indigo-400 sm:text-xl">Lade Daten...</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-gray-100 via-gray-200 to-gray-300 dark:from-black dark:via-gray-900 dark:to-gray-800 p-4 mt-8">
      <div className="w-full max-w-4xl mx-auto space-y-8 rounded-xl bg-white/90 dark:bg-gray-900/80 p-6 shadow-2xl shadow-indigo-500/20 sm:p-8">
        <div className="flex justify-between items-center">
          <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Stundenbuchungen
          </h2>
          <LogoutButton />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-900 dark:text-white sm:text-base">
            <thead className="bg-gray-200/80 dark:bg-gray-800/80">
              <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                <th className="px-4 py-3 text-left font-medium text-indigo-600 dark:text-indigo-400 sm:px-6">ID</th>
                <th className="px-4 py-3 text-left font-medium text-indigo-600 dark:text-indigo-400 sm:px-6">Person</th>
                <th className="px-4 py-3 text-left font-medium text-indigo-600 dark:text-indigo-400 sm:px-6">Baustelle-ID</th>
                <th className="px-4 py-3 text-left font-medium text-indigo-600 dark:text-indigo-400 sm:px-6">Datum</th>
                <th className="px-4 py-3 text-left font-medium text-indigo-600 dark:text-indigo-400 sm:px-6">Stunden</th>
                <th className="px-4 py-3 text-left font-medium text-indigo-600 dark:text-indigo-400 sm:px-6">Baustelle</th>
                <th className="px-4 py-3 text-left font-medium text-indigo-600 dark:text-indigo-400 sm:px-6">Text</th>
                <th className="px-4 py-3 text-left font-medium text-indigo-600 dark:text-indigo-400 sm:px-6">Int</th>
                <th className="px-4 py-3 text-left font-medium text-indigo-600 dark:text-indigo-400 sm:px-6">Double</th>
              </tr>
            </thead>
            <tbody>
              {buchungen.map((b) => (
                <tr
                  key={b.id}
                  className="border-b border-gray-300/50 dark:border-gray-600/50 transition-all duration-300 hover:bg-gray-200/50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-4 py-3 sm:px-6">{b.id}</td>
                  <td className="px-4 py-3 sm:px-6">{b.id_person ?? '-'}</td>
                  <td className="px-4 py-3 sm:px-6">{b.id_baustelle}</td>
                  <td className="px-4 py-3 sm:px-6">
                    {new Date(b.datum).toLocaleDateString('de-DE')}
                  </td>
                  <td className="px-4 py-3 sm:px-6">
                    {typeof b.stunden === 'number' ? b.stunden.toFixed(1) : '-'}
                  </td>
                  <td className="px-4 py-3 sm:px-6">{b.baustelle}</td>
                  <td className="px-4 py-3 sm:px-6">{b.platzhalter_text ?? '-'}</td>
                  <td className="px-4 py-3 sm:px-6">{b.platzhalter_int ?? '-'}</td>
                  <td className="px-4 py-3 sm:px-6">
                    {typeof b.platzhalter_double === 'number'
                      ? b.platzhalter_double.toFixed(2)
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}