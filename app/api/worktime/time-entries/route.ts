import { NextResponse } from 'next/server';
import worktimePool from '@/db-worktime';
import { getWorktimeSession, requireRole } from '@/lib/worktime-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await getWorktimeSession();
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const userId = searchParams.get('user_id');

  const isSupervisor = requireRole(session.user, 'supervisor');

  let query = `
    SELECT te.*, u.username, u.first_name, u.last_name,
      CASE WHEN te.work_end IS NOT NULL
        THEN EXTRACT(EPOCH FROM (te.work_end - te.work_start))/60 - te.break_minutes
        ELSE NULL
      END as duration_minutes
    FROM wt_time_entries te
    JOIN wt_users u ON u.id = te.user_id
    WHERE te.company_id = $1
  `;
  const params: (string | number)[] = [session.user.company_id];
  let idx = 2;

  if (!isSupervisor || !userId) {
    query += ` AND te.user_id = $${idx++}`;
    params.push(session.user.id);
  } else if (userId && userId !== 'all') {
    query += ` AND te.user_id = $${idx++}`;
    params.push(parseInt(userId));
  }

  if (from) { query += ` AND te.work_start >= $${idx++}`; params.push(from); }
  if (to)   { query += ` AND te.work_start <= $${idx++}`; params.push(to); }

  query += ' ORDER BY te.work_start DESC LIMIT 200';

  const result = await worktimePool.query(query, params);
  return NextResponse.json(result.rows);
}

export async function POST(req: Request) {
  const session = await getWorktimeSession();
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { work_start, work_end, break_minutes, notes } = body;

  if (!work_start) {
    return NextResponse.json({ error: 'Startzeit erforderlich' }, { status: 400 });
  }

  // Laufenden Eintrag prüfen
  const running = await worktimePool.query(
    'SELECT id FROM wt_time_entries WHERE user_id = $1 AND work_end IS NULL',
    [session.user.id]
  );
  if (running.rows.length > 0 && !work_end) {
    return NextResponse.json({ error: 'Es läuft bereits ein Eintrag' }, { status: 409 });
  }

  const result = await worktimePool.query(
    `INSERT INTO wt_time_entries (user_id, company_id, work_start, work_end, break_minutes, notes)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      session.user.id,
      session.user.company_id,
      work_start,
      work_end || null,
      break_minutes || 0,
      notes?.trim() || null,
    ]
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
