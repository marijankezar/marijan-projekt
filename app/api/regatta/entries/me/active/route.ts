import { NextResponse } from 'next/server';
import regattaPool from '@/db-regatta';
import { getRegattaSession } from '@/lib/regatta-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Meldungen (Boote) der eingeloggten Person als Skipper, für die gerade eine Veranstaltung
 * aktiv ist — d.h. für die jetzt getrackt werden kann. Treibt die Event-Auswahl auf der
 * Tracking-Seite (0 = Ad-hoc-Tracking ohne Event, 1 = automatisch auswählen, >1 = Auswahl).
 */
export async function GET() {
  const session = await getRegattaSession();
  if (!session.user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const result = await regattaPool.query(
    `SELECT e.id AS "entryId", e.boat_name AS "boatName", e.start_number AS "startNumber",
            ev.id AS "eventId", ev.name AS "eventName", ev.gps_interval_seconds AS "gpsIntervalSeconds"
     FROM entry e
     JOIN event ev ON ev.id = e.event_id
     WHERE e.skipper_id = $1 AND ev.status = 'active'
     ORDER BY ev.start_time ASC`,
    [session.user.id]
  );
  return NextResponse.json({ rows: result.rows });
}
