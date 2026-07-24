import { NextResponse } from 'next/server';
import regattaPool from '@/db-regatta';
import { getRegattaSession } from '@/lib/regatta-session';
import { eventCreateSchema } from '@/lib/regatta-validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EVENT_COLUMNS = `
  id, name, description, location, event_date::text AS "eventDate", start_time AS "startTime",
  status, gps_interval_seconds AS "gpsIntervalSeconds", created_at AS "createdAt", updated_at AS "updatedAt"
`;

/** Öffentlich lesbar (Registrierung, Live-/Ergebnisseiten brauchen keinen Login). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const validStatus = status === 'planned' || status === 'active' || status === 'ended' ? status : null;

  const result = await regattaPool.query(
    validStatus
      ? `SELECT ${EVENT_COLUMNS} FROM event WHERE status = $1 ORDER BY start_time DESC`
      : `SELECT ${EVENT_COLUMNS} FROM event ORDER BY start_time DESC`,
    validStatus ? [validStatus] : []
  );
  return NextResponse.json({ rows: result.rows });
}

export async function POST(request: Request) {
  const session = await getRegattaSession();
  if (!session.user?.isAdmin) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const parsed = eventCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe', details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const result = await regattaPool.query(
    `INSERT INTO event (name, description, location, event_date, start_time, status, gps_interval_seconds)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${EVENT_COLUMNS}`,
    [
      data.name,
      data.description ?? null,
      data.location ?? null,
      data.eventDate,
      new Date(data.startTime).toISOString(),
      data.status ?? 'planned',
      data.gpsIntervalSeconds ?? 5,
    ]
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
