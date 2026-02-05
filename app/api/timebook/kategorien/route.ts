import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import timebookPool from '@/db-timebook';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/timebook/kategorien - Alle Kategorien
export async function GET() {
  const session = await getSession();

  if (!session.user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const result = await timebookPool.query(
      `SELECT dk.*,
              COUNT(d.id) as anzahl_dienstleistungen,
              COALESCE(SUM(d.dauer_stunden), 0) as gesamt_stunden
       FROM dienstleistungskategorien dk
       LEFT JOIN dienstleistungen d ON dk.id = d.kategorie_id
       WHERE dk.mitarbeiter_id = $1
       GROUP BY dk.id
       ORDER BY dk.bezeichnung`,
      [session.user.id]
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Kategorien laden Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Kategorien' },
      { status: 500 }
    );
  }
}

// POST /api/timebook/kategorien - Neue Kategorie erstellen
export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session.user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { bezeichnung, beschreibung, standard_stundensatz, farbe } = body;

    if (!bezeichnung || bezeichnung.trim().length === 0) {
      return NextResponse.json({ error: 'Bezeichnung ist erforderlich' }, { status: 400 });
    }

    // Farbe validieren
    if (farbe && !/^#[0-9A-Fa-f]{6}$/.test(farbe)) {
      return NextResponse.json({ error: 'Ungültiges Farbformat. Bitte Hex-Farbe verwenden (z.B. #FF5733)' }, { status: 400 });
    }

    const result = await timebookPool.query(
      `INSERT INTO dienstleistungskategorien (mitarbeiter_id, bezeichnung, beschreibung, standard_stundensatz, farbe)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [session.user.id, bezeichnung.trim(), beschreibung || null, standard_stundensatz || null, farbe || null]
    );

    return NextResponse.json({
      success: true,
      message: 'Kategorie erfolgreich erstellt',
      data: result.rows[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Kategorie erstellen Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Kategorie' },
      { status: 500 }
    );
  }
}

// PUT /api/timebook/kategorien - Kategorie aktualisieren (mit id im Body)
export async function PUT(request: NextRequest) {
  const session = await getSession();

  if (!session.user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, bezeichnung, beschreibung, standard_stundensatz, farbe, aktiv } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID ist erforderlich' }, { status: 400 });
    }

    const result = await timebookPool.query(
      `UPDATE dienstleistungskategorien SET
        bezeichnung = COALESCE($1, bezeichnung),
        beschreibung = $2,
        standard_stundensatz = $3,
        farbe = $4,
        aktiv = COALESCE($5, aktiv)
      WHERE id = $6 AND mitarbeiter_id = $7
      RETURNING *`,
      [bezeichnung, beschreibung, standard_stundensatz, farbe, aktiv, id, session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Kategorie nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Kategorie erfolgreich aktualisiert',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Kategorie aktualisieren Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Kategorie' },
      { status: 500 }
    );
  }
}

// DELETE /api/timebook/kategorien?id=X - Kategorie löschen
export async function DELETE(request: NextRequest) {
  const session = await getSession();

  if (!session.user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const id = request.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID ist erforderlich' }, { status: 400 });
    }

    const result = await timebookPool.query(
      `DELETE FROM dienstleistungskategorien WHERE id = $1 AND mitarbeiter_id = $2 RETURNING id`,
      [id, session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Kategorie nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Kategorie erfolgreich gelöscht'
    });

  } catch (error) {
    console.error('Kategorie löschen Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen der Kategorie' },
      { status: 500 }
    );
  }
}
