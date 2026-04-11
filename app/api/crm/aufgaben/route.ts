import { NextResponse } from 'next/server';
import pool from '@/db';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projektId = searchParams.get('projekt_id');

  let query = `
    SELECT a.*, p.titel AS projekt_titel
    FROM crm_aufgaben a
    LEFT JOIN crm_projekte p ON a.projekt_id = p.id
    WHERE a.user_id = $1`;
  const queryParams: (number | string)[] = [session.user.id];

  if (projektId) {
    queryParams.push(projektId);
    query += ` AND a.projekt_id = $${queryParams.length}`;
  }

  query += ' ORDER BY a.erstellt_am DESC';

  const result = await pool.query(query, queryParams);
  return NextResponse.json(result.rows);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });

  const body = await request.json();
  const { titel, projekt_id, beschreibung, prioritaet, status, faellig_am } = body;

  if (!titel?.trim()) {
    return NextResponse.json({ error: 'Titel ist erforderlich' }, { status: 400 });
  }

  const validPriorit = ['niedrig', 'mittel', 'hoch'];
  const validStatus = ['offen', 'in_bearbeitung', 'erledigt'];

  const result = await pool.query(
    `INSERT INTO crm_aufgaben (user_id, projekt_id, titel, beschreibung, prioritaet, status, faellig_am)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      session.user.id,
      projekt_id || null,
      titel.trim(),
      beschreibung?.trim() || null,
      validPriorit.includes(prioritaet) ? prioritaet : 'mittel',
      validStatus.includes(status) ? status : 'offen',
      faellig_am || null,
    ]
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
