import { NextResponse } from 'next/server';
import worktimePool from '@/db-worktime';
import { getWorktimeSession, requireRole } from '@/lib/worktime-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await getWorktimeSession();
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const all = searchParams.get('all') === '1' && requireRole(session.user, 'supervisor');

  const query = all
    ? `SELECT t.*, c.name as customer_name, u.username FROM wt_tasks t
       LEFT JOIN wt_customers c ON c.id = t.customer_id
       LEFT JOIN wt_users u ON u.id = t.user_id
       WHERE t.company_id = $1 AND t.active = true ORDER BY t.created_at DESC`
    : `SELECT t.*, c.name as customer_name FROM wt_tasks t
       LEFT JOIN wt_customers c ON c.id = t.customer_id
       WHERE t.user_id = $1 AND t.active = true ORDER BY t.created_at DESC`;

  const params = all ? [session.user.company_id] : [session.user.id];
  const result = await worktimePool.query(query, params);
  return NextResponse.json(result.rows);
}

export async function POST(req: Request) {
  const session = await getWorktimeSession();
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { title, description, customer_id, status, hourly_value_euro, hourly_value_points } = body;

  if (!title?.trim()) return NextResponse.json({ error: 'Titel erforderlich' }, { status: 400 });

  const result = await worktimePool.query(
    `INSERT INTO wt_tasks (user_id, company_id, customer_id, title, description, status, hourly_value_euro, hourly_value_points)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      session.user.id,
      session.user.company_id,
      customer_id || null,
      title.trim(),
      description?.trim() || null,
      status || 'planned',
      hourly_value_euro || null,
      hourly_value_points || null,
    ]
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
