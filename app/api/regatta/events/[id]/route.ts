import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import regattaPool from '@/db-regatta';
import { getRegattaSession } from '@/lib/regatta-session';
import { eventUpdateSchema } from '@/lib/regatta-validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EVENT_COLUMNS = `
  id, name, description, location, event_date::text AS "eventDate", start_time AS "startTime",
  status, gps_interval_seconds AS "gpsIntervalSeconds", created_at AS "createdAt", updated_at AS "updatedAt"
`;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await regattaPool.query(`SELECT ${EVENT_COLUMNS} FROM event WHERE id = $1`, [id]);
  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
  }
  return NextResponse.json(result.rows[0]);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRegattaSession();
  if (!session.user?.isAdmin) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const { id } = await params;
  const parsed = eventUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe', details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const existingResult = await regattaPool.query(
    `SELECT name, description, location, event_date, start_time, status, gps_interval_seconds
     FROM event WHERE id = $1`,
    [id]
  );
  if (existingResult.rows.length === 0) {
    return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
  }
  const existing = existingResult.rows[0];

  const result = await regattaPool.query(
    `UPDATE event
     SET name = $1, description = $2, location = $3, event_date = $4, start_time = $5,
         status = $6, gps_interval_seconds = $7, updated_at = NOW()
     WHERE id = $8
     RETURNING ${EVENT_COLUMNS}`,
    [
      data.name ?? existing.name,
      data.description !== undefined ? data.description : existing.description,
      data.location !== undefined ? data.location : existing.location,
      data.eventDate ?? existing.event_date,
      data.startTime ? new Date(data.startTime).toISOString() : existing.start_time,
      data.status ?? existing.status,
      data.gpsIntervalSeconds ?? existing.gps_interval_seconds,
      id,
    ]
  );
  return NextResponse.json(result.rows[0]);
}

/**
 * Löscht eine Veranstaltung (kaskadiert auf Meldungen/Crew/Ziellinie/Zielzeiten).
 * Admin-Passwort-Reauth wie beim Löschen von Track-Sessions - unwiderruflich.
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRegattaSession();
  if (!session.user?.isAdmin) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!password) {
    return NextResponse.json({ error: 'Passwort erforderlich' }, { status: 400 });
  }

  const adminResult = await regattaPool.query('SELECT password_hash FROM person WHERE id = $1', [session.user.id]);
  const adminHash = adminResult.rows[0]?.password_hash;
  const validPassword = adminHash ? await bcrypt.compare(password, adminHash) : false;
  if (!validPassword) {
    return NextResponse.json({ error: 'Falsches Passwort' }, { status: 403 });
  }

  const { id } = await params;
  const result = await regattaPool.query('DELETE FROM event WHERE id = $1 RETURNING id', [id]);
  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
