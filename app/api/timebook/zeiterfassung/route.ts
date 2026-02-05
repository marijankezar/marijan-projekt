import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import timebookPool from '@/db-timebook';
import { validiereZeiterfassung } from '@/types/db-timebook';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/timebook/zeiterfassung - Alle Zeiterfassungen
export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session.user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const kunde_id = searchParams.get('kunde_id');
    const von = searchParams.get('von');
    const bis = searchParams.get('bis');
    const abgeschlossen = searchParams.get('abgeschlossen');
    const laufend = searchParams.get('laufend');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = `
      SELECT d.*, k.firmenname, k.kundennummer,
             COALESCE(k.ansprechperson_vorname || ' ' || k.ansprechperson_nachname, k.firmenname) as kunde_name,
             dk.bezeichnung as kategorie_bezeichnung, dk.farbe as kategorie_farbe
      FROM dienstleistungen d
      LEFT JOIN kunden k ON d.kunde_id = k.id
      LEFT JOIN dienstleistungskategorien dk ON d.kategorie_id = dk.id
      WHERE d.mitarbeiter_id = $1
    `;
    const params: (string | number | boolean)[] = [session.user.id];

    if (kunde_id) {
      params.push(kunde_id);
      query += ` AND d.kunde_id = $${params.length}`;
    }

    if (von) {
      params.push(von);
      query += ` AND d.start_datum >= $${params.length}`;
    }

    if (bis) {
      params.push(bis);
      query += ` AND d.start_datum <= $${params.length}`;
    }

    if (abgeschlossen !== null && abgeschlossen !== undefined) {
      params.push(abgeschlossen === 'true');
      query += ` AND d.abgeschlossen = $${params.length}`;
    }

    if (laufend === 'true') {
      query += ` AND d.ende_datum IS NULL AND d.ende_zeit IS NULL`;
    }

    query += ` ORDER BY d.start_datum DESC, d.start_zeit DESC`;
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await timebookPool.query(query, params);

    // Gesamtanzahl für Pagination
    let countQuery = `
      SELECT COUNT(*) FROM dienstleistungen d WHERE d.mitarbeiter_id = $1
    `;
    const countParams: (string | number | boolean)[] = [session.user.id];

    if (kunde_id) {
      countParams.push(kunde_id);
      countQuery += ` AND d.kunde_id = $${countParams.length}`;
    }
    if (von) {
      countParams.push(von);
      countQuery += ` AND d.start_datum >= $${countParams.length}`;
    }
    if (bis) {
      countParams.push(bis);
      countQuery += ` AND d.start_datum <= $${countParams.length}`;
    }

    const countResult = await timebookPool.query(countQuery, countParams);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset
    });

  } catch (error) {
    console.error('Zeiterfassung laden Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Zeiterfassungen' },
      { status: 500 }
    );
  }
}

// POST /api/timebook/zeiterfassung - Neue Zeiterfassung erstellen
export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session.user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      kunde_id, kategorie_id,
      start_datum, start_zeit, ende_datum, ende_zeit,
      titel, beschreibung, stundensatz
    } = body;

    // Validierung
    if (!kunde_id) {
      return NextResponse.json({ error: 'Kunde ist erforderlich' }, { status: 400 });
    }

    if (!beschreibung) {
      return NextResponse.json({ error: 'Beschreibung ist erforderlich' }, { status: 400 });
    }

    // Zeit-Validierung wenn Ende angegeben
    if (ende_datum && ende_zeit) {
      const validation = validiereZeiterfassung({
        datum: start_datum,
        startzeit: start_zeit,
        endzeit: ende_zeit
      });

      if (!validation.valid) {
        return NextResponse.json({
          error: validation.errors.map(e => e.message).join(' '),
          details: validation.errors
        }, { status: 400 });
      }
    }

    // Prüfen ob Kunde existiert und dem Benutzer gehört
    const kundeCheck = await timebookPool.query(
      'SELECT id FROM kunden WHERE id = $1 AND mitarbeiter_id = $2',
      [kunde_id, session.user.id]
    );

    if (kundeCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Kunde nicht gefunden' }, { status: 404 });
    }

    const result = await timebookPool.query(
      `INSERT INTO dienstleistungen (
        mitarbeiter_id, kunde_id, kategorie_id,
        start_datum, start_zeit, ende_datum, ende_zeit,
        titel, beschreibung, stundensatz, abgeschlossen
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        session.user.id, kunde_id, kategorie_id || null,
        start_datum, start_zeit, ende_datum || null, ende_zeit || null,
        titel || null, beschreibung, stundensatz || null,
        !!(ende_datum && ende_zeit) // abgeschlossen wenn Ende angegeben
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Zeiterfassung erfolgreich erstellt',
      data: result.rows[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Zeiterfassung erstellen Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Zeiterfassung' },
      { status: 500 }
    );
  }
}
