import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import timebookPool from '@/db-timebook';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/timebook/kunden/[id] - Einzelnen Kunden laden
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
      `SELECT * FROM kunden WHERE id = $1 AND mitarbeiter_id = $2`,
      [id, session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Kunde nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Kunde laden Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden des Kunden' },
      { status: 500 }
    );
  }
}

// PUT /api/timebook/kunden/[id] - Kunden aktualisieren
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
      firmenname, ansprechperson_vorname, ansprechperson_nachname, geschlecht,
      strasse, hausnummer, plz, ort, land,
      telefon, mobil, email, website,
      uid_nummer, steuernummer, zahlungsziel_tage, notizen, aktiv
    } = body;

    const result = await timebookPool.query(
      `UPDATE kunden SET
        firmenname = COALESCE($1, firmenname),
        ansprechperson_vorname = COALESCE($2, ansprechperson_vorname),
        ansprechperson_nachname = COALESCE($3, ansprechperson_nachname),
        geschlecht = COALESCE($4, geschlecht),
        strasse = COALESCE($5, strasse),
        hausnummer = COALESCE($6, hausnummer),
        plz = COALESCE($7, plz),
        ort = COALESCE($8, ort),
        land = COALESCE($9, land),
        telefon = COALESCE($10, telefon),
        mobil = COALESCE($11, mobil),
        email = COALESCE($12, email),
        website = COALESCE($13, website),
        uid_nummer = COALESCE($14, uid_nummer),
        steuernummer = COALESCE($15, steuernummer),
        zahlungsziel_tage = COALESCE($16, zahlungsziel_tage),
        notizen = COALESCE($17, notizen),
        aktiv = COALESCE($18, aktiv)
      WHERE id = $19 AND mitarbeiter_id = $20
      RETURNING *`,
      [
        firmenname, ansprechperson_vorname, ansprechperson_nachname, geschlecht,
        strasse, hausnummer, plz, ort, land,
        telefon, mobil, email, website,
        uid_nummer, steuernummer, zahlungsziel_tage, notizen, aktiv,
        id, session.user.id
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Kunde nicht gefunden oder keine Berechtigung' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Kunde erfolgreich aktualisiert',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Kunde aktualisieren Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Kunden' },
      { status: 500 }
    );
  }
}

// DELETE /api/timebook/kunden/[id] - Kunden löschen
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

    // Prüfen ob Kunde Dienstleistungen hat
    const checkResult = await timebookPool.query(
      `SELECT COUNT(*) as count FROM dienstleistungen WHERE kunde_id = $1`,
      [id]
    );

    if (parseInt(checkResult.rows[0].count) > 0) {
      return NextResponse.json(
        { error: 'Kunde kann nicht gelöscht werden, da noch Dienstleistungen existieren. Kunde stattdessen deaktivieren.' },
        { status: 409 }
      );
    }

    const result = await timebookPool.query(
      `DELETE FROM kunden WHERE id = $1 AND mitarbeiter_id = $2 RETURNING id`,
      [id, session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Kunde nicht gefunden oder keine Berechtigung' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Kunde erfolgreich gelöscht'
    });

  } catch (error) {
    console.error('Kunde löschen Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Kunden' },
      { status: 500 }
    );
  }
}
