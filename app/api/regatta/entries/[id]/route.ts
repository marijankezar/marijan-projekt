import { NextResponse } from 'next/server';
import regattaPool from '@/db-regatta';
import { getRegattaSession } from '@/lib/regatta-session';
import { entryCreateSchema } from '@/lib/regatta-validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ENTRY_COLUMNS = `
  id, event_id AS "eventId", boat_class_id AS "boatClassId", skipper_id AS "skipperId",
  boat_name AS "boatName", sail_number AS "sailNumber", start_number AS "startNumber", created_at AS "createdAt"
`;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await regattaPool.query(`SELECT ${ENTRY_COLUMNS} FROM entry WHERE id = $1`, [id]);
  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
  }
  return NextResponse.json(result.rows[0]);
}

/** Eigene Meldung bearbeiten (nur solange die Veranstaltung noch nicht läuft) oder als Admin jederzeit. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRegattaSession();
  if (!session.user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const { id } = await params;
  const existingResult = await regattaPool.query(
    `SELECT e.skipper_id AS "skipperId", e.event_id AS "eventId", ev.status
     FROM entry e JOIN event ev ON ev.id = e.event_id WHERE e.id = $1`,
    [id]
  );
  if (existingResult.rows.length === 0) {
    return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
  }
  const existing = existingResult.rows[0];
  const isOwner = existing.skipperId === session.user.id;
  if (!isOwner && !session.user.isAdmin) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
  }
  if (isOwner && !session.user.isAdmin && existing.status !== 'planned') {
    return NextResponse.json(
      { error: 'Meldung kann nach Start der Veranstaltung nicht mehr selbst geändert werden' },
      { status: 409 }
    );
  }

  const parsed = entryCreateSchema.partial().safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe', details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const currentResult = await regattaPool.query(
    'SELECT boat_class_id, boat_name, sail_number, start_number FROM entry WHERE id = $1',
    [id]
  );
  const current = currentResult.rows[0];

  try {
    const result = await regattaPool.query(
      `UPDATE entry SET boat_class_id = $1, boat_name = $2, sail_number = $3, start_number = $4
       WHERE id = $5
       RETURNING ${ENTRY_COLUMNS}`,
      [
        data.boatClassId ?? current.boat_class_id,
        data.boatName?.trim() ?? current.boat_name,
        data.sailNumber?.trim() ?? current.sail_number,
        data.startNumber?.trim() ?? current.start_number,
        id,
      ]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as { code?: string }).code === '23505') {
      return NextResponse.json(
        { error: 'Startnummer ist für diese Veranstaltung bereits vergeben' },
        { status: 409 }
      );
    }
    console.error('Regatta-Meldung-Update-Fehler:', error);
    return NextResponse.json({ error: 'Speichern fehlgeschlagen' }, { status: 500 });
  }
}

/** Meldung stornieren (kaskadiert auf Crew). Eigene Meldung nur vor Veranstaltungsbeginn, Admin jederzeit. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRegattaSession();
  if (!session.user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const { id } = await params;
  const existingResult = await regattaPool.query(
    `SELECT e.skipper_id AS "skipperId", ev.status
     FROM entry e JOIN event ev ON ev.id = e.event_id WHERE e.id = $1`,
    [id]
  );
  if (existingResult.rows.length === 0) {
    return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
  }
  const existing = existingResult.rows[0];
  const isOwner = existing.skipperId === session.user.id;
  if (!isOwner && !session.user.isAdmin) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
  }
  if (isOwner && !session.user.isAdmin && existing.status !== 'planned') {
    return NextResponse.json(
      { error: 'Meldung kann nach Start der Veranstaltung nicht mehr selbst storniert werden' },
      { status: 409 }
    );
  }

  await regattaPool.query('DELETE FROM entry WHERE id = $1', [id]);
  return NextResponse.json({ success: true });
}
