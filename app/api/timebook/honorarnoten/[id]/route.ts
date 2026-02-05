import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import timebookPool from '@/db-timebook';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/timebook/honorarnoten/[id] - Einzelne Rechnung mit Positionen
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

    // Rechnung laden
    const result = await timebookPool.query(
      `SELECT h.*,
              k.firmenname, k.kundennummer, k.email as kunde_email,
              k.strasse, k.hausnummer, k.plz, k.ort, k.land,
              k.uid_nummer,
              COALESCE(k.ansprechperson_vorname || ' ' || k.ansprechperson_nachname, k.firmenname) as kunde_name
       FROM honorarnoten h
       LEFT JOIN kunden k ON h.kunde_id = k.id
       WHERE h.id = $1 AND h.mitarbeiter_id = $2`,
      [id, session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Rechnung nicht gefunden' }, { status: 404 });
    }

    // Positionen laden
    const positionen = await timebookPool.query(
      `SELECT hp.*, d.titel as dienstleistung_titel, d.start_datum, d.dauer_stunden
       FROM honorarnoten_positionen hp
       LEFT JOIN dienstleistungen d ON hp.dienstleistung_id = d.id
       WHERE hp.honorarnote_id = $1
       ORDER BY hp.position_nr`,
      [id]
    );

    return NextResponse.json({
      success: true,
      data: {
        ...result.rows[0],
        positionen: positionen.rows
      }
    });

  } catch (error) {
    console.error('Honorarnote laden Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Rechnung' },
      { status: 500 }
    );
  }
}

// PUT /api/timebook/honorarnoten/[id] - Rechnung aktualisieren
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
      leistungsdatum_von, leistungsdatum_bis, faelligkeitsdatum,
      nettobetrag, steuersatz, notizen,
      bezahlt, bezahlt_am, zahlungsmethode
    } = body;

    // Prüfen ob bereits bezahlt oder storniert
    const checkResult = await timebookPool.query(
      `SELECT bezahlt, storniert FROM honorarnoten WHERE id = $1 AND mitarbeiter_id = $2`,
      [id, session.user.id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Rechnung nicht gefunden' }, { status: 404 });
    }

    if (checkResult.rows[0].storniert) {
      return NextResponse.json({ error: 'Stornierte Rechnungen können nicht bearbeitet werden' }, { status: 409 });
    }

    const result = await timebookPool.query(
      `UPDATE honorarnoten SET
        leistungsdatum_von = COALESCE($1, leistungsdatum_von),
        leistungsdatum_bis = COALESCE($2, leistungsdatum_bis),
        faelligkeitsdatum = COALESCE($3, faelligkeitsdatum),
        nettobetrag = COALESCE($4, nettobetrag),
        steuersatz = COALESCE($5, steuersatz),
        notizen = $6,
        bezahlt = COALESCE($7, bezahlt),
        bezahlt_am = $8,
        zahlungsmethode = $9
      WHERE id = $10 AND mitarbeiter_id = $11
      RETURNING *`,
      [
        leistungsdatum_von, leistungsdatum_bis, faelligkeitsdatum,
        nettobetrag, steuersatz, notizen,
        bezahlt, bezahlt_am || (bezahlt ? new Date().toISOString().split('T')[0] : null),
        zahlungsmethode,
        id, session.user.id
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Rechnung erfolgreich aktualisiert',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Honorarnote aktualisieren Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Rechnung' },
      { status: 500 }
    );
  }
}

// DELETE /api/timebook/honorarnoten/[id] - Rechnung stornieren (nicht löschen!)
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
    const body = await request.json().catch(() => ({}));
    const storno_grund = body.storno_grund || 'Storniert';

    // Prüfen ob bereits storniert
    const checkResult = await timebookPool.query(
      `SELECT storniert, bezahlt FROM honorarnoten WHERE id = $1 AND mitarbeiter_id = $2`,
      [id, session.user.id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Rechnung nicht gefunden' }, { status: 404 });
    }

    if (checkResult.rows[0].storniert) {
      return NextResponse.json({ error: 'Rechnung ist bereits storniert' }, { status: 409 });
    }

    if (checkResult.rows[0].bezahlt) {
      return NextResponse.json(
        { error: 'Bezahlte Rechnungen können nicht storniert werden. Bitte erstellen Sie eine Gutschrift.' },
        { status: 409 }
      );
    }

    // Stornieren (nicht löschen wegen Buchhaltung)
    const result = await timebookPool.query(
      `UPDATE honorarnoten SET
        storniert = true,
        storniert_am = CURRENT_TIMESTAMP,
        storno_grund = $1
      WHERE id = $2 AND mitarbeiter_id = $3
      RETURNING *`,
      [storno_grund, id, session.user.id]
    );

    // Dienstleistungen wieder als nicht abgerechnet markieren
    await timebookPool.query(
      `UPDATE dienstleistungen SET abgerechnet = false, abgerechnet_am = NULL
       WHERE id IN (
         SELECT dienstleistung_id FROM honorarnoten_positionen
         WHERE honorarnote_id = $1 AND dienstleistung_id IS NOT NULL
       )`,
      [id]
    );

    return NextResponse.json({
      success: true,
      message: 'Rechnung erfolgreich storniert',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Honorarnote stornieren Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler beim Stornieren der Rechnung' },
      { status: 500 }
    );
  }
}
