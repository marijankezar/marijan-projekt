import { NextResponse } from 'next/server';
import regattaPool from '@/db-regatta';
import { getRegattaSession } from '@/lib/regatta-session';
import { entryCreateSchema } from '@/lib/regatta-validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ENTRY_COLUMNS = `
  e.id, e.event_id AS "eventId", e.boat_class_id AS "boatClassId", bc.name AS "boatClassName",
  e.skipper_id AS "skipperId", p.display_name AS "skipperName",
  e.boat_name AS "boatName", e.sail_number AS "sailNumber", e.start_number AS "startNumber",
  e.created_at AS "createdAt"
`;

async function attachCrew(entries: Record<string, unknown>[]) {
  if (entries.length === 0) return entries;
  const ids = entries.map((e) => e.id);
  const crewResult = await regattaPool.query(
    `SELECT entry_id AS "entryId", position, first_name AS "firstName", last_name AS "lastName",
            nation, birth_year AS "birthYear"
     FROM entry_crew WHERE entry_id = ANY($1) ORDER BY position ASC`,
    [ids]
  );
  const crewByEntry = new Map<string, unknown[]>();
  for (const row of crewResult.rows) {
    const list = crewByEntry.get(row.entryId) ?? [];
    list.push(row);
    crewByEntry.set(row.entryId, list);
  }
  return entries.map((e) => ({ ...e, crew: crewByEntry.get(e.id as string) ?? [] }));
}

/** Öffentlich lesbar — Meldeliste, Ergebnistabellen und Live-Ansicht brauchen keinen Login. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await regattaPool.query(
    `SELECT ${ENTRY_COLUMNS}
     FROM entry e
     JOIN boat_class bc ON bc.id = e.boat_class_id
     JOIN person p ON p.id = e.skipper_id
     WHERE e.event_id = $1
     ORDER BY e.start_number ASC`,
    [id]
  );
  const rows = await attachCrew(result.rows);
  return NextResponse.json({ rows });
}

/** Zusätzliches Boot für einen bereits eingeloggten Skipper melden (kein neuer Account). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRegattaSession();
  if (!session.user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const { id } = await params;
  const parsed = entryCreateSchema.safeParse({ ...(await request.json().catch(() => null)), eventId: id });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe', details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const eventResult = await regattaPool.query('SELECT status FROM event WHERE id = $1', [id]);
  if (eventResult.rows.length === 0) {
    return NextResponse.json({ error: 'Veranstaltung nicht gefunden' }, { status: 404 });
  }
  if (eventResult.rows[0].status === 'ended') {
    return NextResponse.json({ error: 'Anmeldung für diese Veranstaltung ist bereits geschlossen' }, { status: 409 });
  }

  const client = await regattaPool.connect();
  try {
    await client.query('BEGIN');
    const entryResult = await client.query(
      `INSERT INTO entry (event_id, boat_class_id, skipper_id, boat_name, sail_number, start_number)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [id, data.boatClassId, session.user.id, data.boatName, data.sailNumber, data.startNumber]
    );
    const entryId = entryResult.rows[0].id;

    for (let i = 0; i < data.crew.length; i++) {
      const c = data.crew[i];
      await client.query(
        `INSERT INTO entry_crew (entry_id, position, first_name, last_name, nation, birth_year)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [entryId, i + 1, c.firstName, c.lastName, c.nation, c.birthYear]
      );
    }
    await client.query('COMMIT');
    return NextResponse.json({ ok: true, entryId }, { status: 201 });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error instanceof Error && 'code' in error && (error as { code?: string }).code === '23505') {
      return NextResponse.json(
        { error: 'Startnummer ist für diese Veranstaltung bereits vergeben' },
        { status: 409 }
      );
    }
    console.error('Regatta-Boot-Anmelden-Fehler:', error);
    return NextResponse.json({ error: 'Anmelden fehlgeschlagen' }, { status: 500 });
  } finally {
    client.release();
  }
}
