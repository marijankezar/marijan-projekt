import { NextResponse } from 'next/server';
import regattaPool from '@/db-regatta';
import { getRegattaSession } from '@/lib/regatta-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Aktuell aktive Session der eingeloggten Person (für Resume nach Seiten-Reload). */
export async function GET() {
  const session = await getRegattaSession();
  if (!session.user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const result = await regattaPool.query(
    `SELECT ts.id, ts.started_at AS "startedAt", ts.entry_id AS "entryId",
            ev.gps_interval_seconds AS "gpsIntervalSeconds",
            COUNT(gp.id)::int AS "pointCount"
     FROM track_session ts
     LEFT JOIN gps_point gp ON gp.session_id = ts.id
     LEFT JOIN entry e ON e.id = ts.entry_id
     LEFT JOIN event ev ON ev.id = e.event_id
     WHERE ts.person_id = $1 AND ts.active = true
     GROUP BY ts.id, ev.gps_interval_seconds`,
    [session.user.id]
  );
  return NextResponse.json({ activeSession: result.rows[0] ?? null });
}

/**
 * Start einer neuen Tracking-Session für die eingeloggte Person.
 * Optionaler Body `{ entryId }` verknüpft die Session mit einer Event-Meldung (Boot) -
 * nötig für Zielerkennung/Ergebnisse. Ohne entryId bleibt es beim bisherigen Ad-hoc-Tracking.
 */
export async function POST(request: Request) {
  const session = await getRegattaSession();
  if (!session.user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const entryId = typeof body?.entryId === 'string' ? body.entryId : null;

  if (entryId) {
    const entryResult = await regattaPool.query(
      `SELECT e.skipper_id AS "skipperId", ev.status
       FROM entry e JOIN event ev ON ev.id = e.event_id WHERE e.id = $1`,
      [entryId]
    );
    if (entryResult.rows.length === 0) {
      return NextResponse.json({ error: 'Meldung nicht gefunden' }, { status: 404 });
    }
    const entry = entryResult.rows[0];
    if (entry.skipperId !== session.user.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
    }
    if (entry.status !== 'active') {
      return NextResponse.json({ error: 'Veranstaltung ist aktuell nicht aktiv' }, { status: 409 });
    }
  }

  try {
    const result = await regattaPool.query(
      `INSERT INTO track_session (person_id, entry_id) VALUES ($1, $2)
       RETURNING id, started_at AS "startedAt", entry_id AS "entryId"`,
      [session.user.id, entryId]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    // Unique-Violation: es existiert bereits eine aktive Session dieser Person.
    // Statt zu fehlern, geben wir die bestehende Session zurück, damit der Client
    // (z.B. nach Doppelklick oder Reload) einfach dort weiterträgt.
    if (error instanceof Error && 'code' in error && (error as { code?: string }).code === '23505') {
      const existing = await regattaPool.query(
        `SELECT id, started_at AS "startedAt", entry_id AS "entryId" FROM track_session WHERE person_id = $1 AND active = true`,
        [session.user.id]
      );
      return NextResponse.json(existing.rows[0], { status: 409 });
    }
    console.error('Regatta-Session-Start-Fehler:', error);
    return NextResponse.json({ error: 'Start fehlgeschlagen' }, { status: 500 });
  }
}
