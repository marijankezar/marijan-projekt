import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import pool from '@/db';

// Explizit Node.js Runtime verwenden
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();

  if (!session.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    // Nur Einträge des eingeloggten Users anzeigen
    const result = await pool.query(
      'SELECT * FROM Stundenbuchungen WHERE id_person = $1 ORDER BY id DESC LIMIT 100',
      [session.user.id]
    );

    const data = result.rows.map((row) => ({
      ...row,
      stunden: row.stunden !== null ? parseFloat(row.stunden) : null,
      platzhalter_double: row.platzhalter_double !== null ? parseFloat(row.platzhalter_double) : null,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error('Fehler beim Abrufen der Stundenbuchungen:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    return NextResponse.json({
      error: 'Fehler beim Laden der Stundenbuchungen',
      details: errorMessage
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { datum, stunden, baustelle, bemerkung } = body;

    // Validierung
    if (!datum || !stunden || !baustelle) {
      return NextResponse.json({ error: 'Datum, Stunden und Baustelle sind erforderlich' }, { status: 400 });
    }

    const stundenValue = parseFloat(stunden);
    if (isNaN(stundenValue) || stundenValue <= 0 || stundenValue > 24) {
      return NextResponse.json({ error: 'Ungültige Stundenzahl' }, { status: 400 });
    }

    // Eintrag speichern - datum wird automatisch aus timestamp generiert
    // id_baustelle auf 0 setzen (oder später eine Baustellen-Tabelle verwenden)
    const result = await pool.query(
      `INSERT INTO Stundenbuchungen (id_person, id_baustelle, stunden, baustelle, platzhalter_text, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6::timestamp)
       RETURNING *`,
      [session.user.id, 0, stundenValue, baustelle, bemerkung || null, datum + ' 12:00:00']
    );

    return NextResponse.json({
      success: true,
      message: 'Eintrag erfolgreich gespeichert',
      data: result.rows[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Fehler beim Speichern der Stundenbuchung:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    return NextResponse.json({
      error: 'Fehler beim Speichern',
      details: errorMessage
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getSession();

  if (!session.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, datum, stunden, baustelle, bemerkung } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID ist erforderlich' }, { status: 400 });
    }

    const stundenValue = parseFloat(stunden);
    if (isNaN(stundenValue) || stundenValue <= 0 || stundenValue > 24) {
      return NextResponse.json({ error: 'Ungültige Stundenzahl' }, { status: 400 });
    }

    const result = await pool.query(
      `UPDATE Stundenbuchungen
       SET stunden = $1, baustelle = $2, platzhalter_text = $3, timestamp = $4::timestamp
       WHERE id = $5 AND id_person = $6
       RETURNING *`,
      [stundenValue, baustelle, bemerkung || null, datum + ' 12:00:00', id, session.user.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Eintrag nicht gefunden oder keine Berechtigung' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Eintrag erfolgreich aktualisiert',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Fehler beim Aktualisieren:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    return NextResponse.json({
      error: 'Fehler beim Aktualisieren',
      details: errorMessage
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();

  if (!session.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID ist erforderlich' }, { status: 400 });
    }

    const result = await pool.query(
      'DELETE FROM Stundenbuchungen WHERE id = $1 AND id_person = $2 RETURNING id',
      [id, session.user.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Eintrag nicht gefunden oder keine Berechtigung' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Eintrag gelöscht' });

  } catch (error) {
    console.error('Fehler beim Löschen:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    return NextResponse.json({
      error: 'Fehler beim Löschen',
      details: errorMessage
    }, { status: 500 });
  }
}
