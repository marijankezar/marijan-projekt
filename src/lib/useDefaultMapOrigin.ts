'use client';

import { useEffect, useState } from 'react';

export interface MapOrigin {
  center: [number, number];
  zoom: number;
}

const GEOLOCATION_TIMEOUT_MS = 6000;
const ORIGIN_ZOOM = 13;

/**
 * Ausgangspunkt für Karten ohne eigene Live-Daten: bevorzugt die aktuelle
 * Live-Position des Geräts; falls diese nicht verfügbar ist (kein Support,
 * Berechtigung verweigert, Timeout), wird der letzte bekannte GPS-Punkt aus
 * dem letzten Track der eingeloggten Person verwendet. Liefert undefined,
 * falls beides fehlschlägt (Aufrufer fällt dann auf den Komponenten-Default zurück).
 */
export function useDefaultMapOrigin(): MapOrigin | undefined {
  const [origin, setOrigin] = useState<MapOrigin | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    async function fallbackToLastTrack() {
      try {
        const res = await fetch('/api/regatta/persons/me/last-position');
        if (!res.ok) return;
        const body = await res.json();
        if (!cancelled && body.position) {
          setOrigin({ center: [body.position.lat, body.position.lng], zoom: ORIGIN_ZOOM });
        }
      } catch {
        // kein Fallback verfügbar -> Aufrufer nutzt eigenen Default
      }
    }

    if (!('geolocation' in navigator)) {
      fallbackToLastTrack();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!cancelled) {
          setOrigin({ center: [pos.coords.latitude, pos.coords.longitude], zoom: ORIGIN_ZOOM });
        }
      },
      () => {
        fallbackToLastTrack();
      },
      { enableHighAccuracy: true, timeout: GEOLOCATION_TIMEOUT_MS, maximumAge: 60000 }
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return origin;
}
