import { NextResponse } from 'next/server';
import worktimePool from '@/db-worktime';
import { getWorktimeSession } from '@/lib/worktime-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getWorktimeSession();
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { task_id, end_time, description, status } = body;

  const existing = await worktimePool.query(
    'SELECT * FROM wt_task_entries WHERE id = $1 AND user_id = $2',
    [id, session.user.id]
  );
  if (existing.rows.length === 0) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });

  const result = await worktimePool.query(
    `UPDATE wt_task_entries SET
       task_id = COALESCE($1, task_id),
       end_time = COALESCE($2, end_time),
       description = COALESCE($3, description),
       status = COALESCE($4, status),
       updated_at = NOW()
     WHERE id = $5 RETURNING *`,
    [
      task_id || null,
      end_time || null,
      description?.trim() || null,
      status || null,
      id,
    ]
  );
  return NextResponse.json(result.rows[0]);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getWorktimeSession();
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await worktimePool.query(
    'DELETE FROM wt_task_entries WHERE id = $1 AND user_id = $2',
    [id, session.user.id]
  );
  return NextResponse.json({ ok: true });
}
