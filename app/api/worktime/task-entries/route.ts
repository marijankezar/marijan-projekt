import { NextResponse } from 'next/server';
import worktimePool from '@/db-worktime';
import { getWorktimeSession } from '@/lib/worktime-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await getWorktimeSession();
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const timeEntryId = searchParams.get('time_entry_id');

  let query = `SELECT te.*, t.title as task_title, u.username FROM wt_task_entries te
     LEFT JOIN wt_tasks t ON t.id = te.task_id
     LEFT JOIN wt_users u ON u.id = te.user_id
     WHERE te.company_id = $1 AND te.user_id = $2`;
  const params: (string | number)[] = [session.user.company_id, session.user.id];

  if (timeEntryId) {
    query += ` AND te.time_entry_id = $3`;
    params.push(parseInt(timeEntryId));
  }

  query += ' ORDER BY te.start_time DESC';
  const result = await worktimePool.query(query, params);
  return NextResponse.json(result.rows);
}

export async function POST(req: Request) {
  const session = await getWorktimeSession();
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { time_entry_id, task_id, start_time, end_time, description, status } = body;

  if (!start_time) return NextResponse.json({ error: 'Startzeit erforderlich' }, { status: 400 });

  const result = await worktimePool.query(
    `INSERT INTO wt_task_entries (time_entry_id, task_id, user_id, company_id, start_time, end_time, description, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      time_entry_id || null,
      task_id || null,
      session.user.id,
      session.user.company_id,
      start_time,
      end_time || null,
      description?.trim() || null,
      status || 'in_progress',
    ]
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
