import { EventEmitter } from 'events';

export interface RegattaPointEvent {
  sessionId: string;
  personId: string;
  displayName: string;
  color: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  altitude: number | null;
  timestamp: string; // ISO
  /** Gesetzt, wenn diese Session einer Event-Meldung (Boot) zugeordnet ist. */
  entryId?: string | null;
}

export interface RegattaSessionEndEvent {
  sessionId: string;
  personId: string;
}

export interface RegattaFinishEvent {
  sessionId: string;
  entryId: string;
  finishAt: string; // ISO
}

/**
 * Singleton über globalThis: übersteht Turbopack-HMR-Modulneuevaluierung
 * im Dev-Server, damit SSE-Clients keinen zweiten (leeren) Emitter bekommen.
 */
const g = globalThis as unknown as {
  __regattaBus?: EventEmitter;
  __regattaActiveSessions?: Map<string, RegattaPointEvent>;
};

export const regattaBus: EventEmitter =
  g.__regattaBus ?? (g.__regattaBus = new EventEmitter());
regattaBus.setMaxListeners(50);

/** Letzter bekannter Punkt pro aktiver Session — Snapshot für neu verbindende SSE-Clients. */
export const activeSessionSnapshots: Map<string, RegattaPointEvent> =
  g.__regattaActiveSessions ?? (g.__regattaActiveSessions = new Map());

export function publishPoint(event: RegattaPointEvent) {
  activeSessionSnapshots.set(event.sessionId, event);
  regattaBus.emit('point', event);
}

export function publishSessionEnd(sessionId: string, personId: string) {
  activeSessionSnapshots.delete(sessionId);
  regattaBus.emit('sessionEnd', { sessionId, personId } satisfies RegattaSessionEndEvent);
}

export function publishFinish(event: RegattaFinishEvent) {
  regattaBus.emit('finish', event);
}

/** Formatiert ein Server-Sent-Event-Frame. Von allen Regatta-Live-Routen genutzt. */
export function sseMessage(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}
