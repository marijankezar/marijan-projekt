import { NextResponse } from 'next/server';
import regattaPool from '@/db-regatta';
import { getRegattaSession } from '@/lib/regatta-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Letzter bekannter GPS-Punkt der eingeloggten Person (aus ihrem letzten Track). */
export async function GET() {
  const session = await getRegattaSession();
  if (!session.user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const result = await regattaPool.query(
    `SELECT gp.latitude AS "lat", gp.longitude AS "lng", gp.timestamp
     FROM gps_point gp
     JOIN track_session ts ON ts.id = gp.session_id
     WHERE ts.person_id = $1
     ORDER BY gp.timestamp DESC
     LIMIT 1`,
    [session.user.id]
  );

  return NextResponse.json({ position: result.rows[0] ?? null });
}
