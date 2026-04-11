import { NextResponse } from 'next/server';
import pool from '@/db';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });

  const result = await pool.query(
    `SELECT p.*, k.name AS kunde_name
     FROM crm_projekte p
     LEFT JOIN crm_kunden k ON p.kunde_id = k.id
     WHERE p.user_id = $1
     ORDER BY p.erstellt_am DESC`,
    [session.user.id]
  );
  return NextResponse.json(result.rows);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });

  const body = await request.json();
  const { titel, kunde_id, beschreibung, status, budget, deadline } = body;

  if (!titel?.trim()) {
    return NextResponse.json({ error: 'Titel ist erforderlich' }, { status: 400 });
  }

  const validStatus = ['offen', 'aktiv', 'abgeschlossen', 'pausiert'];
  const projektStatus = validStatus.includes(status) ? status : 'offen';

  const result = await pool.query(
    `INSERT INTO crm_projekte (user_id, kunde_id, titel, beschreibung, status, budget, deadline)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      session.user.id,
      kunde_id || null,
      titel.trim(),
      beschreibung?.trim() || null,
      projektStatus,
      budget ? parseFloat(budget) : null,
      deadline || null,
    ]
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
