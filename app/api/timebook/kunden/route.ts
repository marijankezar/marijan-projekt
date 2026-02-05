import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import timebookPool from '@/db-timebook';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/timebook/kunden - Alle Kunden des Benutzers
export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session.user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const aktiv = searchParams.get('aktiv');

    let query = `
      SELECT id, kundennummer, firmenname, ansprechperson_vorname, ansprechperson_nachname,
             strasse, hausnummer, plz, ort, land, telefon, mobil, email, website,
             uid_nummer, zahlungsziel_tage, aktiv, erstellt_am
      FROM kunden
      WHERE mitarbeiter_id = $1
    `;
    const params: (string | number | boolean)[] = [session.user.id];

    if (search) {
      query += ` AND (
        LOWER(firmenname) LIKE LOWER($${params.length + 1})
        OR LOWER(ansprechperson_vorname) LIKE LOWER($${params.length + 1})
        OR LOWER(ansprechperson_nachname) LIKE LOWER($${params.length + 1})
        OR LOWER(kundennummer) LIKE LOWER($${params.length + 1})
        OR LOWER(email) LIKE LOWER($${params.length + 1})
      )`;
      params.push(`%${search}%`);
    }

    if (aktiv !== null && aktiv !== undefined) {
      query += ` AND aktiv = $${params.length + 1}`;
      params.push(aktiv === 'true');
    }

    query += ' ORDER BY firmenname, ansprechperson_nachname';

    const result = await timebookPool.query(query, params);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Kunden laden Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Kunden' },
      { status: 500 }
    );
  }
}

// POST /api/timebook/kunden - Neuen Kunden erstellen
export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session.user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      firmenname, ansprechperson_vorname, ansprechperson_nachname, geschlecht,
      strasse, hausnummer, plz, ort, land,
      telefon, mobil, email, website,
      uid_nummer, steuernummer, zahlungsziel_tage, notizen
    } = body;

    // Mindestens Firmenname oder Ansprechpartner erforderlich
    if (!firmenname && !ansprechperson_nachname) {
      return NextResponse.json(
        { error: 'Firmenname oder Ansprechpartner-Nachname erforderlich' },
        { status: 400 }
      );
    }

    const result = await timebookPool.query(
      `INSERT INTO kunden (
        mitarbeiter_id, firmenname, ansprechperson_vorname, ansprechperson_nachname,
        geschlecht, strasse, hausnummer, plz, ort, land,
        telefon, mobil, email, website, uid_nummer, steuernummer,
        zahlungsziel_tage, notizen
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        session.user.id, firmenname || null, ansprechperson_vorname || null,
        ansprechperson_nachname || null, geschlecht || null,
        strasse || null, hausnummer || null, plz || null, ort || null, land || 'Österreich',
        telefon || null, mobil || null, email || null, website || null,
        uid_nummer || null, steuernummer || null,
        zahlungsziel_tage || 30, notizen || null
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Kunde erfolgreich erstellt',
      data: result.rows[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Kunde erstellen Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Kunden' },
      { status: 500 }
    );
  }
}
