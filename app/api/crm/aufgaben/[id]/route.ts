import { NextResponse } from 'next/server';
import pool from '@/db';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { titel, projekt_id, beschreibung, prioritaet, status, faellig_am } = body;

  if (!titel?.trim()) {
    return NextResponse.json({ error: 'Titel ist erforderlich' }, { status: 400 });
  }

  const validPriorit = ['niedrig', 'mittel', 'hoch'];
  const validStatus = ['offen', 'in_bearbeitung', 'erledigt'];

  const result = await pool.query(
    `UPDATE crm_aufgaben
     SET titel = $1, projekt_id = $2, beschreibung = $3, prioritaet = $4, status = $5, faellig_am = $6, aktualisiert_am = NOW()
     WHERE id = $7 AND user_id = $8
     RETURNING *`,
    [
      titel.trim(),
      projekt_id || null,
      beschreibung?.trim() || null,
      validPriorit.includes(prioritaet) ? prioritaet : 'mittel',
      validStatus.includes(status) ? status : 'offen',
      faellig_am || null,
      id,
      session.user.id,
    ]
  );
  if (result.rows.length === 0) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
  return NextResponse.json(result.rows[0]);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });

  const { id } = await params;
  const result = await pool.query(
    'DELETE FROM crm_aufgaben WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, session.user.id]
  );
  if (result.rows.length === 0) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
  return NextResponse.json({ success: true });
}
