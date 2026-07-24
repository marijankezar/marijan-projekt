import { NextResponse } from 'next/server';
import regattaPool from '@/db-regatta';
import { getRegattaSession } from '@/lib/regatta-session';
import { boatClassUpdateSchema } from '@/lib/regatta-validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOAT_CLASS_COLUMNS = `id, name, yardstick, created_at AS "createdAt"`;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRegattaSession();
  if (!session.user?.isAdmin) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const { id } = await params;
  const parsed = boatClassUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe', details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const existingResult = await regattaPool.query('SELECT name, yardstick FROM boat_class WHERE id = $1', [id]);
  if (existingResult.rows.length === 0) {
    return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
  }
  const existing = existingResult.rows[0];

  try {
    const result = await regattaPool.query(
      `UPDATE boat_class SET name = $1, yardstick = $2 WHERE id = $3 RETURNING ${BOAT_CLASS_COLUMNS}`,
      [data.name ?? existing.name, data.yardstick ?? existing.yardstick, id]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as { code?: string }).code === '23505') {
      return NextResponse.json({ error: 'Bootsklasse existiert bereits' }, { status: 409 });
    }
    console.error('Bootsklasse-Update-Fehler:', error);
    return NextResponse.json({ error: 'Speichern fehlgeschlagen' }, { status: 500 });
  }
}

/** Löschen wird verweigert, solange die Klasse noch von Meldungen referenziert wird (FK-Schutz). */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRegattaSession();
  if (!session.user?.isAdmin) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const result = await regattaPool.query('DELETE FROM boat_class WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as { code?: string }).code === '23503') {
      return NextResponse.json(
        { error: 'Bootsklasse wird noch von Meldungen verwendet und kann nicht gelöscht werden' },
        { status: 409 }
      );
    }
    console.error('Bootsklasse-Löschen-Fehler:', error);
    return NextResponse.json({ error: 'Löschen fehlgeschlagen' }, { status: 500 });
  }
}
