import { NextResponse } from 'next/server';
import worktimePool from '@/db-worktime';
import { getWorktimeSession, requireRole } from '@/lib/worktime-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getWorktimeSession();
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRole(session.user, 'admin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const result = await worktimePool.query(
    `SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.role,
            u.active, u.lang, u.target_hours, u.login_attempts, u.locked_until,
            u.last_login, u.created_at
     FROM wt_users u
     WHERE u.company_id = $1
     ORDER BY u.created_at DESC`,
    [session.user.company_id]
  );
  return NextResponse.json(result.rows);
}

export async function PUT(req: Request) {
  const session = await getWorktimeSession();
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRole(session.user, 'admin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { id, active, role, unlock, target_hours } = body;

  if (!id) return NextResponse.json({ error: 'User-ID erforderlich' }, { status: 400 });

  // Sicherstellen dass User zur selben Company gehört
  const existing = await worktimePool.query(
    'SELECT id FROM wt_users WHERE id = $1 AND company_id = $2',
    [id, session.user.company_id]
  );
  if (existing.rows.length === 0) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });

  const updates: string[] = ['updated_at = NOW()'];
  const params: (string | number | boolean | null)[] = [];
  let idx = 1;

  if (active !== undefined) { updates.push(`active = $${idx++}`); params.push(active); }
  if (role !== undefined) { updates.push(`role = $${idx++}`); params.push(role); }
  if (unlock === true) {
    updates.push(`login_attempts = $${idx++}`);
    updates.push(`locked_until = $${idx++}`);
    params.push(0);
    params.push(null);
  }
  if (target_hours !== undefined) { updates.push(`target_hours = $${idx++}`); params.push(target_hours); }

  params.push(id);
  const result = await worktimePool.query(
    `UPDATE wt_users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING
       id, username, email, first_name, last_name, role, active, lang, target_hours,
       login_attempts, locked_until, last_login, created_at`,
    params
  );
  return NextResponse.json(result.rows[0]);
}
