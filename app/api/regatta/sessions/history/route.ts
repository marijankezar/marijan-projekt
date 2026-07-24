import { NextResponse } from 'next/server';
import regattaPool from '@/db-regatta';
import { getRegattaSession } from '@/lib/regatta-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Liste abgeschlossener Sessions (Verlauf). Admins sehen alle, sonst nur die eigenen. */
export async function GET(request: Request) {
  const session = await getRegattaSession();
  if (!session.user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10) || 20));
  const offset = (page - 1) * pageSize;

  const personId = session.user.isAdmin ? searchParams.get('personId') : session.user.id;
  const dateFromRaw = searchParams.get('dateFrom');
  const dateToRaw = searchParams.get('dateTo');
  const isValidDate = (v: string | null): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);

  const whereClauses = ['ts.active = false'];
  const params: (string | number)[] = [];
  if (personId) {
    params.push(personId);
    whereClauses.push(`ts.person_id = $${params.length}`);
  }
  if (isValidDate(dateFromRaw)) {
    params.push(dateFromRaw);
    whereClauses.push(`ts.started_at >= $${params.length}::date`);
  }
  if (isValidDate(dateToRaw)) {
    params.push(dateToRaw);
    whereClauses.push(`ts.started_at < ($${params.length}::date + interval '1 day')`);
  }
  const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

  const [rowsResult, countResult] = await Promise.all([
    regattaPool.query(
      `SELECT ts.id, ts.person_id AS "personId", p.display_name AS "displayName",
              ts.started_at AS "startedAt", ts.stopped_at AS "stoppedAt",
              COUNT(gp.id)::int AS "pointCount"
       FROM track_session ts
       JOIN person p ON p.id = ts.person_id
       LEFT JOIN gps_point gp ON gp.session_id = ts.id
       ${whereSql}
       GROUP BY ts.id, p.display_name
       ORDER BY ts.started_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageSize, offset]
    ),
    regattaPool.query(`SELECT COUNT(*)::int AS total FROM track_session ts ${whereSql}`, params),
  ]);

  return NextResponse.json({ rows: rowsResult.rows, total: countResult.rows[0].total, page, pageSize });
}
