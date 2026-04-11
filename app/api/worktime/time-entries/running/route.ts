import { NextResponse } from 'next/server';
import worktimePool from '@/db-worktime';
import { getWorktimeSession } from '@/lib/worktime-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getWorktimeSession();
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await worktimePool.query(
    `SELECT te.*,
      EXTRACT(EPOCH FROM (NOW() - te.work_start))/60 - te.break_minutes as elapsed_minutes
     FROM wt_time_entries te
     WHERE te.user_id = $1 AND te.work_end IS NULL
     ORDER BY te.work_start DESC LIMIT 1`,
    [session.user.id]
  );

  return NextResponse.json(result.rows[0] || null);
}
