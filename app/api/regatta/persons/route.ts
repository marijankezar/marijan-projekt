import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import regattaPool from '@/db-regatta';
import { getRegattaSession } from '@/lib/regatta-session';
import { personCreateSchema } from '@/lib/regatta-validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SORTABLE_COLUMNS: Record<string, string> = {
  displayName: 'display_name',
  firstName: 'first_name',
  lastName: 'last_name',
  startNumber: 'start_number',
  createdAt: 'created_at',
};

const PERSON_COLUMNS = `
  id, start_number AS "startNumber", first_name AS "firstName", last_name AS "lastName",
  display_name AS "displayName", email, is_admin AS "isAdmin",
  (password_hash IS NOT NULL) AS "canLogin", created_at AS "createdAt", updated_at AS "updatedAt"
`;

export async function GET(request: Request) {
  const session = await getRegattaSession();
  if (!session.user?.isAdmin) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.trim() || '';
  const sortBy = SORTABLE_COLUMNS[searchParams.get('sortBy') || ''] || 'display_name';
  const sortDir = searchParams.get('sortDir') === 'desc' ? 'DESC' : 'ASC';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10) || 20));
  const offset = (page - 1) * pageSize;

  const whereClause = search
    ? `WHERE display_name ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1 OR start_number ILIKE $1`
    : '';
  const searchParam = search ? [`%${search}%`] : [];

  const [rowsResult, countResult] = await Promise.all([
    regattaPool.query(
      `SELECT ${PERSON_COLUMNS} FROM person ${whereClause}
       ORDER BY ${sortBy} ${sortDir}
       LIMIT $${searchParam.length + 1} OFFSET $${searchParam.length + 2}`,
      [...searchParam, pageSize, offset]
    ),
    regattaPool.query(`SELECT COUNT(*)::int AS total FROM person ${whereClause}`, searchParam),
  ]);

  return NextResponse.json({
    rows: rowsResult.rows,
    total: countResult.rows[0].total,
    page,
    pageSize,
  });
}

export async function POST(request: Request) {
  const session = await getRegattaSession();
  if (!session.user?.isAdmin) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const parsed = personCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe', details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const passwordHash = data.password ? await bcrypt.hash(data.password, 12) : null;

  try {
    const result = await regattaPool.query(
      `INSERT INTO person (start_number, first_name, last_name, display_name, email, password_hash, is_admin)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${PERSON_COLUMNS}`,
      [
        data.startNumber?.trim() || null,
        data.firstName.trim(),
        data.lastName.trim(),
        data.displayName.trim(),
        data.email?.trim() || null,
        passwordHash,
        data.isAdmin ?? false,
      ]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as { code?: string }).code === '23505') {
      return NextResponse.json({ error: 'E-Mail bereits vergeben' }, { status: 409 });
    }
    console.error('Regatta-Person-Erstellen-Fehler:', error);
    return NextResponse.json({ error: 'Anlegen fehlgeschlagen' }, { status: 500 });
  }
}
