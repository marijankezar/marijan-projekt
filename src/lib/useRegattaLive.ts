'use client';

import { useEffect, useRef, useState } from 'react';
import type { RegattaPointEvent, RegattaFinishEvent } from '@/lib/regatta-broadcast';

export interface LiveSessionState {
  sessionId: string;
  personId: string;
  displayName: string;
  color: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  lastUpdate: string; // ISO
  trail: [number, number][];
  entryId: string | null;
}

const MAX_TRAIL_POINTS = 200;

function applyPoint(prev: Record<string, LiveSessionState>, point: RegattaPointEvent): Record<string, LiveSessionState> {
  const existing = prev[point.sessionId];
  const trail = [...(existing?.trail ?? []), [point.latitude, point.longitude] as [number, number]].slice(
    -MAX_TRAIL_POINTS
  );
  return {
    ...prev,
    [point.sessionId]: {
      sessionId: point.sessionId,
      personId: point.personId,
      displayName: point.displayName,
      color: point.color,
      lat: point.latitude,
      lng: point.longitude,
      accuracy: point.accuracy,
      speed: point.speed,
      heading: point.heading,
      lastUpdate: point.timestamp,
      trail,
      entryId: point.entryId ?? null,
    },
  };
}

/**
 * Verbindet sich mit dem SSE-Live-Stream und hält den aktuellen Zustand aller aktiven Boote.
 * `endpoint` erlaubt die Wiederverwendung für den öffentlichen event-gescopten Stream
 * (`/api/regatta/events/[id]/live`) statt nur den geschützten `/api/regatta/live`.
 * `onFinish` ist optional (z.B. um die Ergebnistabelle bei einem Zieleinlauf live nachzuladen).
 */
export function useRegattaLive(endpoint = '/api/regatta/live', onFinish?: (event: RegattaFinishEvent) => void) {
  const [sessions, setSessions] = useState<Record<string, LiveSessionState>>({});
  const sourceRef = useRef<EventSource | null>(null);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    const es = new EventSource(endpoint);
    sourceRef.current = es;

    es.addEventListener('snapshot', (e) => {
      const points = JSON.parse((e as MessageEvent).data) as RegattaPointEvent[];
      setSessions((prev) => points.reduce(applyPoint, prev));
    });

    es.addEventListener('point', (e) => {
      const point = JSON.parse((e as MessageEvent).data) as RegattaPointEvent;
      setSessions((prev) => applyPoint(prev, point));
    });

    es.addEventListener('sessionEnd', (e) => {
      const { sessionId } = JSON.parse((e as MessageEvent).data) as { sessionId: string };
      setSessions((prev) => {
        const next = { ...prev };
        delete next[sessionId];
        return next;
      });
    });

    es.addEventListener('finish', (e) => {
      const event = JSON.parse((e as MessageEvent).data) as RegattaFinishEvent;
      onFinishRef.current?.(event);
    });

    return () => es.close();
  }, [endpoint]);

  return sessions;
}
