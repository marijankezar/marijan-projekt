import { NextResponse } from 'next/server';
import pool from '@/db';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });

  const { id } = await params;
  const result = await pool.query(
    'SELECT * FROM crm_kunden WHERE id = $1 AND user_id = $2',
    [id, session.user.id]
  );
  if (result.rows.length === 0) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
  return NextResponse.json(result.rows[0]);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { name, firma, email, telefon, notizen } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name ist erforderlich' }, { status: 400 });
  }

  const result = await pool.query(
    `UPDATE crm_kunden
     SET name = $1, firma = $2, email = $3, telefon = $4, notizen = $5, aktualisiert_am = NOW()
     WHERE id = $6 AND user_id = $7
     RETURNING *`,
    [name.trim(), firma?.trim() || null, email?.trim() || null, telefon?.trim() || null, notizen?.trim() || null, id, session.user.id]
  );
  if (result.rows.length === 0) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
  return NextResponse.json(result.rows[0]);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });

  const { id } = await params;
  const result = await pool.query(
    'DELETE FROM crm_kunden WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, session.user.id]
  );
  if (result.rows.length === 0) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
  return NextResponse.json({ success: true });
}
