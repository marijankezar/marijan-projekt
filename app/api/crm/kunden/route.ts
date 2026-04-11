import { NextResponse } from 'next/server';
import pool from '@/db';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });

  const result = await pool.query(
    'SELECT * FROM crm_kunden WHERE user_id = $1 ORDER BY erstellt_am DESC',
    [session.user.id]
  );
  return NextResponse.json(result.rows);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });

  const body = await request.json();
  const { name, firma, email, telefon, notizen } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name ist erforderlich' }, { status: 400 });
  }

  const result = await pool.query(
    `INSERT INTO crm_kunden (user_id, name, firma, email, telefon, notizen)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [session.user.id, name.trim(), firma?.trim() || null, email?.trim() || null, telefon?.trim() || null, notizen?.trim() || null]
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
