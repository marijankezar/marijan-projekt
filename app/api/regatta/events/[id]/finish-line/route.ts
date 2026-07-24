import { NextResponse } from 'next/server';
import regattaPool from '@/db-regatta';
import { getRegattaSession } from '@/lib/regatta-session';
import { finishLineSchema } from '@/lib/regatta-validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FINISH_LINE_COLUMNS = `
  id, event_id AS "eventId",
  point_a_lat AS "pointALat", point_a_lng AS "pointALng",
  point_b_lat AS "pointBLat", point_b_lng AS "pointBLng",
  created_at AS "createdAt"
`;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await regattaPool.query(`SELECT ${FINISH_LINE_COLUMNS} FROM finish_line WHERE event_id = $1`, [id]);
  return NextResponse.json({ finishLine: result.rows[0] ?? null });
}

/**
 * Ziellinie definieren/aktualisieren (1 pro Veranstaltung).
 * Konvention: Punkt A/B stecken die Linie quer zum Kurs ab; als Zieleinlauf zählt eine
 * Kreuzung von rechts nach links bezogen auf den Blick von A nach B
 * (siehe src/lib/regatta-geo.ts detectFinishCrossing).
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRegattaSession();
  if (!session.user?.isAdmin) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const { id } = await params;
  const parsed = finishLineSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe', details: parsed.error.flatten() }, { status: 400 });
  }
  const { pointA, pointB } = parsed.data;

  const eventResult = await regattaPool.query('SELECT id FROM event WHERE id = $1', [id]);
  if (eventResult.rows.length === 0) {
    return NextResponse.json({ error: 'Veranstaltung nicht gefunden' }, { status: 404 });
  }

  const result = await regattaPool.query(
    `INSERT INTO finish_line (event_id, point_a_lat, point_a_lng, point_b_lat, point_b_lng)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (event_id) DO UPDATE
       SET point_a_lat = EXCLUDED.point_a_lat, point_a_lng = EXCLUDED.point_a_lng,
           point_b_lat = EXCLUDED.point_b_lat, point_b_lng = EXCLUDED.point_b_lng
     RETURNING ${FINISH_LINE_COLUMNS}`,
    [id, pointA.lat, pointA.lng, pointB.lat, pointB.lng]
  );
  return NextResponse.json(result.rows[0]);
}
