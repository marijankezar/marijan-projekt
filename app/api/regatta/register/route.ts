import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import regattaPool from '@/db-regatta';
import { getRegattaSession } from '@/lib/regatta-session';
import { registerSchema } from '@/lib/regatta-validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Vollständige Registrierung (öffentlich, kein Login nötig): legt den Skipper-Account an,
 * meldet Boot + Crew für eine konkrete Veranstaltung an. Transaktional (person + entry +
 * entry_crew), damit bei einem Fehler (z.B. Startnummer bereits vergeben) nichts halb
 * angelegt bleibt. Loggt den neuen Skipper direkt ein.
 */
export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe', details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const eventResult = await regattaPool.query('SELECT id, status FROM event WHERE id = $1', [data.eventId]);
  if (eventResult.rows.length === 0) {
    return NextResponse.json({ error: 'Veranstaltung nicht gefunden' }, { status: 404 });
  }
  if (eventResult.rows[0].status === 'ended') {
    return NextResponse.json({ error: 'Anmeldung für diese Veranstaltung ist bereits geschlossen' }, { status: 409 });
  }

  const boatClassResult = await regattaPool.query('SELECT id FROM boat_class WHERE id = $1', [data.boatClassId]);
  if (boatClassResult.rows.length === 0) {
    return NextResponse.json({ error: 'Bootsklasse nicht gefunden' }, { status: 404 });
  }

  const existingPerson = await regattaPool.query('SELECT id FROM person WHERE email = $1', [data.email]);
  if (existingPerson.rows.length > 0) {
    return NextResponse.json(
      { error: 'Für diese E-Mail existiert bereits ein Account. Bitte einloggen und Boot von dort aus anmelden.' },
      { status: 409 }
    );
  }

  const client = await regattaPool.connect();
  try {
    await client.query('BEGIN');

    const passwordHash = await bcrypt.hash(data.password, 12);
    const displayName = `${data.firstName} ${data.lastName}`.trim();

    const personResult = await client.query(
      `INSERT INTO person (first_name, last_name, display_name, email, password_hash, nation, birth_year)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [data.firstName, data.lastName, displayName, data.email, passwordHash, data.nation, data.birthYear]
    );
    const personId = personResult.rows[0].id;

    const entryResult = await client.query(
      `INSERT INTO entry (event_id, boat_class_id, skipper_id, boat_name, sail_number, start_number)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [data.eventId, data.boatClassId, personId, data.boatName, data.sailNumber, data.startNumber]
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

    const session = await getRegattaSession();
    session.user = { id: personId, displayName, email: data.email, isAdmin: false };
    await session.save();

    return NextResponse.json({ ok: true, entryId }, { status: 201 });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error instanceof Error && 'code' in error && (error as { code?: string }).code === '23505') {
      const constraint = (error as { constraint?: string }).constraint;
      if (constraint === 'entry_event_start_number_idx') {
        return NextResponse.json(
          { error: 'Startnummer ist für diese Veranstaltung bereits vergeben' },
          { status: 409 }
        );
      }
      if (constraint === 'person_email_key') {
        return NextResponse.json(
          { error: 'Für diese E-Mail existiert bereits ein Account. Bitte einloggen.' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: 'Eintrag existiert bereits' }, { status: 409 });
    }
    console.error('Regatta-Registrierung-Fehler:', error);
    return NextResponse.json({ error: 'Registrierung fehlgeschlagen' }, { status: 500 });
  } finally {
    client.release();
  }
}
