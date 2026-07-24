import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import regattaPool from '@/db-regatta';
import { getRegattaSession } from '@/lib/regatta-session';
import { personUpdateSchema } from '@/lib/regatta-validation';
import { publishSessionEnd } from '@/lib/regatta-broadcast';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PERSON_COLUMNS = `
  id, start_number AS "startNumber", first_name AS "firstName", last_name AS "lastName",
  display_name AS "displayName", email, is_admin AS "isAdmin",
  (password_hash IS NOT NULL) AS "canLogin", created_at AS "createdAt", updated_at AS "updatedAt"
`;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRegattaSession();
  if (!session.user?.isAdmin) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const { id } = await params;
  const parsed = personUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe', details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const existingResult = await regattaPool.query(
    'SELECT start_number, first_name, last_name, display_name, email, password_hash, is_admin FROM person WHERE id = $1',
    [id]
  );
  if (existingResult.rows.length === 0) {
    return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
  }
  const existing = existingResult.rows[0];

  const passwordHash = data.password ? await bcrypt.hash(data.password, 12) : existing.password_hash;

  try {
    const result = await regattaPool.query(
      `UPDATE person
       SET start_number = $1, first_name = $2, last_name = $3, display_name = $4,
           email = $5, password_hash = $6, is_admin = $7, updated_at = NOW()
       WHERE id = $8
       RETURNING ${PERSON_COLUMNS}`,
      [
        data.startNumber !== undefined ? data.startNumber?.trim() || null : existing.start_number,
        data.firstName?.trim() ?? existing.first_name,
        data.lastName?.trim() ?? existing.last_name,
        data.displayName?.trim() ?? existing.display_name,
        data.email !== undefined ? data.email?.trim() || null : existing.email,
        passwordHash,
        data.isAdmin ?? existing.is_admin,
        id,
      ]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as { code?: string }).code === '23505') {
      return NextResponse.json({ error: 'E-Mail bereits vergeben' }, { status: 409 });
    }
    console.error('Regatta-Person-Update-Fehler:', error);
    return NextResponse.json({ error: 'Speichern fehlgeschlagen' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRegattaSession();
  if (!session.user?.isAdmin) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const { id } = await params;

  // Falls die Person gerade aktiv trackt: Live-Status bereinigen, bevor die
  // DB-Kaskade die Session löscht (sonst bleibt ein Geister-Marker auf /live).
  const activeSession = await regattaPool.query(
    'SELECT id FROM track_session WHERE person_id = $1 AND active = true',
    [id]
  );

  const result = await regattaPool.query('DELETE FROM person WHERE id = $1 RETURNING id', [id]);
  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
  }

  if (activeSession.rows.length > 0) {
    publishSessionEnd(activeSession.rows[0].id, id);
  }

  return NextResponse.json({ success: true });
}
