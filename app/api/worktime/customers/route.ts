import { NextResponse } from 'next/server';
import worktimePool from '@/db-worktime';
import { getWorktimeSession, requireRole } from '@/lib/worktime-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getWorktimeSession();
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRole(session.user, 'supervisor')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const result = await worktimePool.query(
    'SELECT * FROM wt_customers WHERE company_id = $1 AND active = true ORDER BY name',
    [session.user.company_id]
  );
  return NextResponse.json(result.rows);
}

export async function POST(req: Request) {
  const session = await getWorktimeSession();
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRole(session.user, 'supervisor')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { name, address, email, phone, notes } = body;

  if (!name?.trim()) return NextResponse.json({ error: 'Name erforderlich' }, { status: 400 });

  const result = await worktimePool.query(
    `INSERT INTO wt_customers (company_id, name, address, email, phone, notes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      session.user.company_id,
      name.trim(),
      address?.trim() || null,
      email?.trim() || null,
      phone?.trim() || null,
      notes?.trim() || null,
      session.user.id,
    ]
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
