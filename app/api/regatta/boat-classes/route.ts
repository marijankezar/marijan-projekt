import { NextResponse } from 'next/server';
import regattaPool from '@/db-regatta';
import { getRegattaSession } from '@/lib/regatta-session';
import { boatClassSchema } from '@/lib/regatta-validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOAT_CLASS_COLUMNS = `id, name, yardstick, created_at AS "createdAt"`;

/** Öffentlich lesbar — wird für Registrierungsformular und Ergebnistabellen ohne Login gebraucht. */
export async function GET() {
  const result = await regattaPool.query(
    `SELECT ${BOAT_CLASS_COLUMNS} FROM boat_class ORDER BY name ASC`
  );
  return NextResponse.json({ rows: result.rows });
}

export async function POST(request: Request) {
  const session = await getRegattaSession();
  if (!session.user?.isAdmin) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const parsed = boatClassSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe', details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  try {
    const result = await regattaPool.query(
      `INSERT INTO boat_class (name, yardstick) VALUES ($1, $2) RETURNING ${BOAT_CLASS_COLUMNS}`,
      [data.name, data.yardstick]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as { code?: string }).code === '23505') {
      return NextResponse.json({ error: 'Bootsklasse existiert bereits' }, { status: 409 });
    }
    console.error('Bootsklasse-Erstellen-Fehler:', error);
    return NextResponse.json({ error: 'Anlegen fehlgeschlagen' }, { status: 500 });
  }
}
