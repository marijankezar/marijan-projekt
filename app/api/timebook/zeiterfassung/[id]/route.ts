import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import timebookPool from '@/db-timebook';
import { validiereZeiterfassung } from '@/types/db-timebook';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/timebook/zeiterfassung/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session.user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const result = await timebookPool.query(
      `SELECT d.*, k.firmenname, k.kundennummer,
              COALESCE(k.ansprechperson_vorname || ' ' || k.ansprechperson_nachname, k.firmenname) as kunde_name,
              dk.bezeichnung as kategorie_bezeichnung, dk.farbe as kategorie_farbe
       FROM dienstleistungen d
       LEFT JOIN kunden k ON d.kunde_id = k.id
       LEFT JOIN dienstleistungskategorien dk ON d.kategorie_id = dk.id
       WHERE d.id = $1 AND d.mitarbeiter_id = $2`,
      [id, session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Zeiterfassung nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Zeiterfassung laden Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Zeiterfassung' },
      { status: 500 }
    );
  }
}

// PUT /api/timebook/zeiterfassung/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session.user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const {
      kunde_id, kategorie_id,
      start_datum, start_zeit, ende_datum, ende_zeit,
      titel, beschreibung, stundensatz, abgeschlossen, notizen
    } = body;

    // Zeit-Validierung wenn beide Zeiten angegeben
    if (start_datum && start_zeit && ende_zeit) {
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

    // Wenn Endzeit gesetzt wird, ist der Eintrag abgeschlossen
    const isAbgeschlossen = abgeschlossen !== undefined ? abgeschlossen : (ende_zeit ? true : false);

    const result = await timebookPool.query(
      `UPDATE dienstleistungen SET
        kunde_id = COALESCE($1, kunde_id),
        kategorie_id = $2,
        start_datum = COALESCE($3, start_datum),
        start_zeit = COALESCE($4, start_zeit),
        ende_datum = $5,
        ende_zeit = $6,
        titel = $7,
        beschreibung = COALESCE($8, beschreibung),
        stundensatz = $9,
        abgeschlossen = $10,
        notizen = $11,
        aktualisiert_am = CURRENT_TIMESTAMP
      WHERE id = $12 AND mitarbeiter_id = $13
      RETURNING *`,
      [
        kunde_id, kategorie_id || null,
        start_datum, start_zeit, ende_datum || null, ende_zeit || null,
        titel || null, beschreibung, stundensatz || null,
        isAbgeschlossen, notizen || null,
        id, session.user.id
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Zeiterfassung nicht gefunden oder keine Berechtigung' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Zeiterfassung erfolgreich aktualisiert',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Zeiterfassung aktualisieren Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Zeiterfassung' },
      { status: 500 }
    );
  }
}

// DELETE /api/timebook/zeiterfassung/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session.user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Prüfen ob bereits abgerechnet
    const checkResult = await timebookPool.query(
      `SELECT abgerechnet FROM dienstleistungen WHERE id = $1 AND mitarbeiter_id = $2`,
      [id, session.user.id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Zeiterfassung nicht gefunden' }, { status: 404 });
    }

    if (checkResult.rows[0].abgerechnet) {
      return NextResponse.json(
        { error: 'Bereits abgerechnete Zeiterfassungen können nicht gelöscht werden' },
        { status: 409 }
      );
    }

    const result = await timebookPool.query(
      `DELETE FROM dienstleistungen WHERE id = $1 AND mitarbeiter_id = $2 RETURNING id`,
      [id, session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Zeiterfassung nicht gefunden oder keine Berechtigung' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Zeiterfassung erfolgreich gelöscht'
    });

  } catch (error) {
    console.error('Zeiterfassung löschen Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen der Zeiterfassung' },
      { status: 500 }
    );
  }
}
