'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
  const router = useRouter(); // ✅ wichtig!

  useEffect(() => {
    async function fetchBuchungen() {
      try {
        const res = await fetch("/api/stundenbuchungen");

        if (res.status === 401) {
          console.warn("Nicht eingeloggt – Weiterleitung zur Login-Seite");
          router.push("/login");
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

  if (loading) return <p className="p-4">⏳ Lade Daten...</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">📋 Stundenbuchungen</h2>

      <table className="w-full border border-gray-300 text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1">ID</th>
            <th className="border px-2 py-1">Person</th>
            <th className="border px-2 py-1">Baustelle-ID</th>
            <th className="border px-2 py-1">Datum</th>
            <th className="border px-2 py-1">Stunden</th>
            <th className="border px-2 py-1">Baustelle</th>
            <th className="border px-2 py-1">Text</th>
            <th className="border px-2 py-1">Int</th>
            <th className="border px-2 py-1">Double</th>
          </tr>
        </thead>
        <tbody>
          {buchungen.map((b) => (
            <tr key={b.id} className="hover:bg-gray-50">
              <td className="border px-2 py-1">{b.id}</td>
              <td className="border px-2 py-1">{b.id_person ?? '-'}</td>
              <td className="border px-2 py-1">{b.id_baustelle}</td>
              <td className="border px-2 py-1">
                {new Date(b.timestamp).toLocaleDateString('de-DE')}
              </td>
              <td className="border px-2 py-1">
                {typeof b.stunden === 'number' ? b.stunden.toFixed(1) : '-'}
              </td>
              <td className="border px-2 py-1">{b.baustelle}</td>
              <td className="border px-2 py-1">{b.platzhalter_text ?? '-'}</td>
              <td className="border px-2 py-1">{b.platzhalter_int ?? '-'}</td>
              <td className="border px-2 py-1">
                {typeof b.platzhalter_double === 'number'
                  ? b.platzhalter_double.toFixed(2)
                  : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
