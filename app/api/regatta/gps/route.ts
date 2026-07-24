import { NextResponse } from 'next/server';
import regattaPool from '@/db-regatta';
import { getRegattaSession } from '@/lib/regatta-session';
import { gpsPointSchema } from '@/lib/regatta-validation';
import { publishPoint, publishFinish, activeSessionSnapshots } from '@/lib/regatta-broadcast';
import { colorForPersonId } from '@/lib/regatta-colors';
import { detectFinishCrossing } from '@/lib/regatta-geo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Prüft, ob der neue Punkt die Ziellinie der Veranstaltung kreuzt, zu der diese Session
 * (über ihre Meldung/entry_id) gehört, und speichert bei Treffer die Zielzeit. Läuft nur
 * für Sessions, die einer Event-Meldung zugeordnet sind (Ad-hoc-Tracking ohne Event bleibt
 * unberührt). `prev` kommt aus dem In-Memory-Snapshot (kein zusätzlicher DB-Query im
 * Hot Path) - fehlt er (z.B. direkt nach Serverneustart), wird die Prüfung beim nächsten
 * Punktepaar nachgeholt.
 */
async function checkFinishCrossing(
  entryId: string,
  trackSessionId: string,
  prevSnapshot: { latitude: number; longitude: number; timestamp: string } | undefined,
  next: { latitude: number; longitude: number; timestamp: string }
) {
  if (!prevSnapshot) return;

  const contextResult = await regattaPool.query(
    `SELECT ev.status,
            fl.point_a_lat AS "pointALat", fl.point_a_lng AS "pointALng",
            fl.point_b_lat AS "pointBLat", fl.point_b_lng AS "pointBLng",
            (ft.id IS NOT NULL) AS "alreadyFinished"
     FROM entry e
     JOIN event ev ON ev.id = e.event_id
     LEFT JOIN finish_line fl ON fl.event_id = ev.id
     LEFT JOIN finish_time ft ON ft.entry_id = e.id
     WHERE e.id = $1`,
    [entryId]
  );
  const ctx = contextResult.rows[0];
  if (!ctx || ctx.status !== 'active' || ctx.pointALat == null || ctx.alreadyFinished) return;

  const result = detectFinishCrossing(
    { lat: prevSnapshot.latitude, lng: prevSnapshot.longitude, timestamp: Date.parse(prevSnapshot.timestamp) },
    { lat: next.latitude, lng: next.longitude, timestamp: Date.parse(next.timestamp) },
    {
      a: { lat: ctx.pointALat, lng: ctx.pointALng },
      b: { lat: ctx.pointBLat, lng: ctx.pointBLng },
    }
  );
  if (!result.crossed || result.finishAt == null) return;

  const finishAtIso = new Date(result.finishAt).toISOString();
  const insertResult = await regattaPool.query(
    `INSERT INTO finish_time (entry_id, track_session_id, finish_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (entry_id) DO NOTHING
     RETURNING id`,
    [entryId, trackSessionId, finishAtIso]
  );
  if (insertResult.rows.length > 0) {
    publishFinish({ sessionId: trackSessionId, entryId, finishAt: finishAtIso });
  }
}

export async function POST(request: Request) {
  const session = await getRegattaSession();
  if (!session.user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const parsed = gpsPointSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültiger GPS-Punkt' }, { status: 400 });
  }
  const p = parsed.data;

  // Autorisierung: die Session muss der eingeloggten Person gehören UND noch aktiv sein.
  // Verhindert nachlaufende Punkte, die nach dem Stop-Button noch in der Queue hingen.
  const sessionRow = await regattaPool.query(
    `SELECT person_id AS "personId", active, entry_id AS "entryId" FROM track_session WHERE id = $1`,
    [p.sessionId]
  );
  if (sessionRow.rows.length === 0) {
    return NextResponse.json({ error: 'Session nicht gefunden' }, { status: 404 });
  }
  const { personId, active, entryId } = sessionRow.rows[0];
  if (personId !== session.user.id) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
  }
  if (!active) {
    return NextResponse.json({ error: 'Session ist bereits beendet' }, { status: 409 });
  }

  const timestampIso = new Date(p.timestamp).toISOString();

  // Vorheriger Punkt für die Zielerkennung: aus dem In-Memory-Snapshot lesen, BEVOR
  // publishPoint() ihn unten mit dem neuen Punkt überschreibt.
  const previousSnapshot = activeSessionSnapshots.get(p.sessionId);

  const insertResult = await regattaPool.query(
    `INSERT INTO gps_point (session_id, latitude, longitude, accuracy, speed, heading, altitude, timestamp)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (session_id, timestamp) DO NOTHING
     RETURNING id`,
    [p.sessionId, p.latitude, p.longitude, p.accuracy ?? null, p.speed ?? null, p.heading ?? null, p.altitude ?? null, timestampIso]
  );

  if (insertResult.rows.length > 0) {
    publishPoint({
      sessionId: p.sessionId,
      personId: session.user.id,
      displayName: session.user.displayName,
      color: colorForPersonId(session.user.id),
      latitude: p.latitude,
      longitude: p.longitude,
      accuracy: p.accuracy ?? null,
      speed: p.speed ?? null,
      heading: p.heading ?? null,
      altitude: p.altitude ?? null,
      timestamp: timestampIso,
      entryId: entryId ?? null,
    });

    if (entryId) {
      try {
        await checkFinishCrossing(
          entryId,
          p.sessionId,
          previousSnapshot ? { latitude: previousSnapshot.latitude, longitude: previousSnapshot.longitude, timestamp: previousSnapshot.timestamp } : undefined,
          { latitude: p.latitude, longitude: p.longitude, timestamp: timestampIso }
        );
      } catch (error) {
        // Zielerkennung darf den GPS-Punkt-Empfang nie blockieren - nur loggen.
        console.error('Regatta-Zielerkennung-Fehler:', error);
      }
    }
  }

  return NextResponse.json({ ok: true, stored: insertResult.rows.length > 0 }, { status: 201 });
}
