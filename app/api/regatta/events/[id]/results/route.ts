import { NextResponse } from 'next/server';
import regattaPool from '@/db-regatta';
import { computeResults, sortResults, type ResultSortBy } from '@/lib/regatta-results';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Öffentliche Ergebnistabelle (Echtzeit- und Yardstick-Wertung). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const sortByParam = searchParams.get('sortBy');
  const sortBy: ResultSortBy = sortByParam === 'realtime' || sortByParam === 'class' ? sortByParam : 'corrected';

  const eventResult = await regattaPool.query(
    `SELECT name, start_time AS "startTime" FROM event WHERE id = $1`,
    [id]
  );
  if (eventResult.rows.length === 0) {
    return NextResponse.json({ error: 'Veranstaltung nicht gefunden' }, { status: 404 });
  }
  const event = eventResult.rows[0];

  const rowsResult = await regattaPool.query(
    `SELECT e.id AS "entryId", bc.name AS "boatClassName", bc.yardstick::float8 AS yardstick,
            p.display_name AS "skipperName", e.boat_name AS "boatName",
            e.sail_number AS "sailNumber", e.start_number AS "startNumber",
            ft.finish_at AS "finishAt"
     FROM entry e
     JOIN boat_class bc ON bc.id = e.boat_class_id
     JOIN person p ON p.id = e.skipper_id
     LEFT JOIN finish_time ft ON ft.entry_id = e.id
     WHERE e.event_id = $1`,
    [id]
  );

  const results = computeResults(rowsResult.rows, event.startTime);
  const sorted = sortResults(results, sortBy);

  return NextResponse.json({ eventName: event.name, sortBy, rows: sorted });
}
