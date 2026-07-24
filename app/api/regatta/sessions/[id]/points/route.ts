import { NextResponse } from 'next/server';
import regattaPool from '@/db-regatta';
import { getRegattaSession } from '@/lib/regatta-session';
import { computeTrackStats } from '@/lib/regatta-geo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Alle GPS-Punkte einer (typischerweise abgeschlossenen) Session, für die Track-Ansicht. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRegattaSession();
  if (!session.user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const { id } = await params;

  const sessionRow = await regattaPool.query(
    `SELECT ts.id, ts.person_id AS "personId", p.display_name AS "displayName",
            ts.started_at AS "startedAt", ts.stopped_at AS "stoppedAt", ts.active
     FROM track_session ts JOIN person p ON p.id = ts.person_id
     WHERE ts.id = $1`,
    [id]
  );
  if (sessionRow.rows.length === 0) {
    return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
  }
  const trackSession = sessionRow.rows[0];
  if (trackSession.personId !== session.user.id && !session.user.isAdmin) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
  }

  const pointsResult = await regattaPool.query(
    `SELECT latitude AS "lat", longitude AS "lng", accuracy, speed, heading, altitude,
            timestamp
     FROM gps_point WHERE session_id = $1 ORDER BY timestamp ASC`,
    [id]
  );

  const stats = computeTrackStats(pointsResult.rows);

  return NextResponse.json({ session: trackSession, points: pointsResult.rows, stats });
}
