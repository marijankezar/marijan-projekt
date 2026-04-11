import { NextResponse } from 'next/server';
import worktimePool from '@/db-worktime';
import { getWorktimeSession, requireRole } from '@/lib/worktime-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getWorktimeSession();
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRole(session.user, 'supervisor')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { name, address, email, phone, notes, active } = body;

  const result = await worktimePool.query(
    `UPDATE wt_customers SET
       name = COALESCE($1, name),
       address = COALESCE($2, address),
       email = COALESCE($3, email),
       phone = COALESCE($4, phone),
       notes = COALESCE($5, notes),
       active = COALESCE($6, active),
       updated_at = NOW()
     WHERE id = $7 AND company_id = $8 RETURNING *`,
    [
      name?.trim() || null,
      address?.trim() || null,
      email?.trim() || null,
      phone?.trim() || null,
      notes?.trim() || null,
      active !== undefined ? active : null,
      id,
      session.user.company_id,
    ]
  );
  if (result.rows.length === 0) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
  return NextResponse.json(result.rows[0]);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getWorktimeSession();
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRole(session.user, 'admin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  await worktimePool.query(
    'UPDATE wt_customers SET active = false, updated_at = NOW() WHERE id = $1 AND company_id = $2',
    [id, session.user.company_id]
  );
  return NextResponse.json({ ok: true });
}
