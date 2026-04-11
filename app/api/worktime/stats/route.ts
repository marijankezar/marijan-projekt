import { NextResponse } from 'next/server';
import worktimePool from '@/db-worktime';
import { getWorktimeSession, requireRole } from '@/lib/worktime-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await getWorktimeSession();
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'day';
  const userId = searchParams.get('user_id');
  const isSupervisor = requireRole(session.user, 'supervisor');

  const targetUserId = (isSupervisor && userId) ? parseInt(userId) : session.user.id;

  // Soll-Stunden des Users
  const userRes = await worktimePool.query(
    'SELECT target_hours FROM wt_users WHERE id = $1',
    [targetUserId]
  );
  const targetHours = userRes.rows[0]?.target_hours || 8.0;

  if (type === 'day') {
    const result = await worktimePool.query(
      `SELECT
         COALESCE(SUM(
           CASE WHEN work_end IS NOT NULL
             THEN EXTRACT(EPOCH FROM (work_end - work_start))/60 - break_minutes
             ELSE EXTRACT(EPOCH FROM (NOW() - work_start))/60 - break_minutes
           END
         ), 0) as actual_minutes,
         COUNT(*) as entries
       FROM wt_time_entries
       WHERE user_id = $1
         AND work_start >= CURRENT_DATE
         AND work_start < CURRENT_DATE + INTERVAL '1 day'`,
      [targetUserId]
    );
    const row = result.rows[0];
    const actualMinutes = parseFloat(row.actual_minutes);
    const targetMinutes = targetHours * 60;
    return NextResponse.json({
      actual_minutes: actualMinutes,
      target_minutes: targetMinutes,
      progress_pct: targetMinutes > 0 ? Math.round((actualMinutes / targetMinutes) * 100) : 0,
      entries: parseInt(row.entries),
    });
  }

  if (type === 'week') {
    const result = await worktimePool.query(
      `SELECT
         DATE(work_start) as date,
         SUM(
           CASE WHEN work_end IS NOT NULL
             THEN EXTRACT(EPOCH FROM (work_end - work_start))/60 - break_minutes
             ELSE 0
           END
         ) as actual_minutes,
         COUNT(*) as entries
       FROM wt_time_entries
       WHERE user_id = $1
         AND work_start >= DATE_TRUNC('week', NOW())
         AND work_start < DATE_TRUNC('week', NOW()) + INTERVAL '7 days'
       GROUP BY DATE(work_start)
       ORDER BY date`,
      [targetUserId]
    );

    // Alle 7 Tage der Woche
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - d.getDay() + 1 + i); // Mo=1
      const dateStr = d.toISOString().slice(0, 10);
      const found = result.rows.find((r: { date: string }) => r.date?.toString().slice(0, 10) === dateStr);
      days.push({
        date: dateStr,
        actual_minutes: found ? parseFloat(found.actual_minutes) : 0,
        target_minutes: targetHours * 60,
        entries: found ? parseInt(found.entries) : 0,
      });
    }

    const totalActual = days.reduce((s, d) => s + d.actual_minutes, 0);
    return NextResponse.json({
      actual_minutes: totalActual,
      target_minutes: targetHours * 60 * 5, // 5 Werktage
      days,
    });
  }

  if (type === 'month') {
    const result = await worktimePool.query(
      `SELECT
         COALESCE(SUM(
           CASE WHEN work_end IS NOT NULL
             THEN EXTRACT(EPOCH FROM (work_end - work_start))/60 - break_minutes
             ELSE 0
           END
         ), 0) as actual_minutes,
         COUNT(*) as entries
       FROM wt_time_entries
       WHERE user_id = $1
         AND work_start >= DATE_TRUNC('month', NOW())
         AND work_start < DATE_TRUNC('month', NOW()) + INTERVAL '1 month'`,
      [targetUserId]
    );
    const row = result.rows[0];
    // Werktage im Monat (grobe Schätzung: Arbeitstage = Kalendertage * 5/7)
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const workdays = Math.round(daysInMonth * 5 / 7);
    return NextResponse.json({
      actual_minutes: parseFloat(row.actual_minutes),
      target_minutes: targetHours * 60 * workdays,
      entries: parseInt(row.entries),
    });
  }

  if (type === 'tasks') {
    const result = await worktimePool.query(
      `SELECT t.title, t.status, COUNT(te.id) as entry_count,
         COALESCE(SUM(
           CASE WHEN te.end_time IS NOT NULL
             THEN EXTRACT(EPOCH FROM (te.end_time - te.start_time))/60
             ELSE 0
           END
         ), 0) as total_minutes
       FROM wt_tasks t
       LEFT JOIN wt_task_entries te ON te.task_id = t.id
       WHERE t.user_id = $1 AND t.active = true
       GROUP BY t.id, t.title, t.status
       ORDER BY total_minutes DESC`,
      [targetUserId]
    );
    return NextResponse.json(result.rows);
  }

  if (type === 'customers' && isSupervisor) {
    const result = await worktimePool.query(
      `SELECT c.name, COUNT(DISTINCT t.id) as task_count,
         COALESCE(SUM(
           CASE WHEN te.end_time IS NOT NULL
             THEN EXTRACT(EPOCH FROM (te.end_time - te.start_time))/60
             ELSE 0
           END
         ), 0) as total_minutes
       FROM wt_customers c
       LEFT JOIN wt_tasks t ON t.customer_id = c.id
       LEFT JOIN wt_task_entries te ON te.task_id = t.id
       WHERE c.company_id = $1 AND c.active = true
       GROUP BY c.id, c.name
       ORDER BY total_minutes DESC`,
      [session.user.company_id]
    );
    return NextResponse.json(result.rows);
  }

  return NextResponse.json({ error: 'Ungültiger Typ' }, { status: 400 });
}
