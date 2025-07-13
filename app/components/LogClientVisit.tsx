'use client';

import { useEffect } from 'react';

export default function LogClientVisit() {
  useEffect(() => {
    const logVisit = async () => {
      try {
        const res = await fetch('/api/log-client', { method: 'POST' });
        if (!res.ok) {
          const text = await res.text();
          console.error('Fehler beim Logging:', res.status, text);
        }
      } catch (err) {
        console.error('Client-Logging fehlgeschlagen:', err);
      }
    };

    logVisit();
  }, []);

  return null; // keine sichtbare Ausgabe
}
