import { NextResponse } from 'next/server';
import worktimePool from '@/db-worktime';
import { getWorktimeSession, requireRole } from '@/lib/worktime-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getWorktimeSession();
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const result = await worktimePool.query(
    `SELECT te.*, u.username, u.first_name, u.last_name FROM wt_time_entries te
     JOIN wt_users u ON u.id = te.user_id
     WHERE te.id = $1 AND te.company_id = $2`,
    [id, session.user.company_id]
  );

  if (result.rows.length === 0) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });

  const entry = result.rows[0];
  if (entry.user_id !== session.user.id && !requireRole(session.user, 'supervisor')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(entry);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getWorktimeSession();
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { work_start, work_end, break_minutes, notes, approval_status } = body;

  const existing = await worktimePool.query(
    'SELECT * FROM wt_time_entries WHERE id = $1 AND company_id = $2',
    [id, session.user.company_id]
  );
  if (existing.rows.length === 0) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });

  const entry = existing.rows[0];
  if (entry.user_id !== session.user.id && !requireRole(session.user, 'supervisor')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const result = await worktimePool.query(
    `UPDATE wt_time_entries
     SET work_start = COALESCE($1, work_start),
         work_end = $2,
         break_minutes = COALESCE($3, break_minutes),
         notes = COALESCE($4, notes),
         approval_status = COALESCE($5, approval_status),
         updated_at = NOW()
     WHERE id = $6 RETURNING *`,
    [
      work_start || null,
      work_end !== undefined ? work_end : entry.work_end,
      break_minutes !== undefined ? break_minutes : null,
      notes !== undefined ? notes?.trim() || null : null,
      approval_status || null,
      id,
    ]
  );
  return NextResponse.json(result.rows[0]);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getWorktimeSession();
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const existing = await worktimePool.query(
    'SELECT * FROM wt_time_entries WHERE id = $1 AND company_id = $2',
    [id, session.user.company_id]
  );
  if (existing.rows.length === 0) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });

  const entry = existing.rows[0];
  if (entry.user_id !== session.user.id && !requireRole(session.user, 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await worktimePool.query('DELETE FROM wt_time_entries WHERE id = $1', [id]);
  return NextResponse.json({ ok: true });
}
