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
  const { title, description, customer_id, status, hourly_value_euro, hourly_value_points, active } = body;

  const existing = await worktimePool.query(
    'SELECT * FROM wt_tasks WHERE id = $1 AND company_id = $2',
    [id, session.user.company_id]
  );
  if (existing.rows.length === 0) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });

  const result = await worktimePool.query(
    `UPDATE wt_tasks SET
       title = COALESCE($1, title),
       description = COALESCE($2, description),
       customer_id = $3,
       status = COALESCE($4, status),
       hourly_value_euro = $5,
       hourly_value_points = $6,
       active = COALESCE($7, active),
       updated_at = NOW()
     WHERE id = $8 RETURNING *`,
    [
      title?.trim() || null,
      description?.trim() || null,
      customer_id !== undefined ? customer_id : existing.rows[0].customer_id,
      status || null,
      hourly_value_euro !== undefined ? hourly_value_euro : existing.rows[0].hourly_value_euro,
      hourly_value_points !== undefined ? hourly_value_points : existing.rows[0].hourly_value_points,
      active !== undefined ? active : null,
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
    'SELECT * FROM wt_tasks WHERE id = $1 AND company_id = $2',
    [id, session.user.company_id]
  );
  if (existing.rows.length === 0) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
  if (existing.rows[0].user_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await worktimePool.query('UPDATE wt_tasks SET active = false, updated_at = NOW() WHERE id = $1', [id]);
  return NextResponse.json({ ok: true });
}
