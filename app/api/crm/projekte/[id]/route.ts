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
    `SELECT p.*, k.name AS kunde_name
     FROM crm_projekte p
     LEFT JOIN crm_kunden k ON p.kunde_id = k.id
     WHERE p.id = $1 AND p.user_id = $2`,
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
  const { titel, kunde_id, beschreibung, status, budget, deadline } = body;

  if (!titel?.trim()) {
    return NextResponse.json({ error: 'Titel ist erforderlich' }, { status: 400 });
  }

  const validStatus = ['offen', 'aktiv', 'abgeschlossen', 'pausiert'];
  const projektStatus = validStatus.includes(status) ? status : 'offen';

  const result = await pool.query(
    `UPDATE crm_projekte
     SET titel = $1, kunde_id = $2, beschreibung = $3, status = $4, budget = $5, deadline = $6, aktualisiert_am = NOW()
     WHERE id = $7 AND user_id = $8
     RETURNING *`,
    [titel.trim(), kunde_id || null, beschreibung?.trim() || null, projektStatus, budget ? parseFloat(budget) : null, deadline || null, id, session.user.id]
  );
  if (result.rows.length === 0) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
  return NextResponse.json(result.rows[0]);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });

  const { id } = await params;
  const result = await pool.query(
    'DELETE FROM crm_projekte WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, session.user.id]
  );
  if (result.rows.length === 0) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
  return NextResponse.json({ success: true });
}
