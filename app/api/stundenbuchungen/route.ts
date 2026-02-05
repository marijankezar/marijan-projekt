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

// Hilfsfunktion: Zeit-String validieren (HH:MM Format)
const isValidTimeFormat = (time: string): boolean => {
  if (!time) return false;
  const regex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
  return regex.test(time);
};

// Hilfsfunktion: Zeit zu Minuten konvertieren
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export async function POST(request: Request) {
  const session = await getSession();

  if (!session.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { datum, startzeit, endzeit, dauer_minuten, baustelle, bemerkung } = body;

    // Server-seitige Validierung
    const errors: string[] = [];
    const MAX_DAUER_STUNDEN = 16;
    const MAX_DAUER_MINUTEN = MAX_DAUER_STUNDEN * 60;

    // Datum validieren
    if (!datum) {
      errors.push('Bitte Datum angeben.');
    } else {
      const selectedDate = new Date(datum);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate > today) {
        errors.push('Das Datum darf nicht in der Zukunft liegen.');
      }
    }

    // Startzeit validieren
    if (!startzeit) {
      errors.push('Bitte Startzeit angeben.');
    } else if (!isValidTimeFormat(startzeit)) {
      errors.push('Ungültiges Startzeit-Format. Bitte HH:MM verwenden.');
    }

    // Endzeit validieren
    if (!endzeit) {
      errors.push('Bitte Endzeit angeben.');
    } else if (!isValidTimeFormat(endzeit)) {
      errors.push('Ungültiges Endzeit-Format. Bitte HH:MM verwenden.');
    }

    // Dauer validieren
    if (isValidTimeFormat(startzeit) && isValidTimeFormat(endzeit)) {
      const startMinuten = timeToMinutes(startzeit);
      const endMinuten = timeToMinutes(endzeit);
      const berechneteMinuten = endMinuten - startMinuten;

      if (berechneteMinuten < 0) {
        errors.push('Die Startzeit darf nicht nach der Endzeit liegen.');
      } else if (berechneteMinuten === 0) {
        errors.push('Die Dauer darf nicht 0 sein.');
      } else if (berechneteMinuten > MAX_DAUER_MINUTEN) {
        errors.push(`Die erfasste Dauer überschreitet den erlaubten Maximalwert (${MAX_DAUER_STUNDEN} Stunden).`);
      }

      // Prüfen ob übergebene dauer_minuten mit Berechnung übereinstimmt
      if (dauer_minuten !== undefined && dauer_minuten !== berechneteMinuten) {
        errors.push('Die übergebene Dauer stimmt nicht mit der berechneten Dauer überein.');
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(' '), details: errors }, { status: 400 });
    }

    // Stunden aus Minuten berechnen
    const stundenValue = (timeToMinutes(endzeit) - timeToMinutes(startzeit)) / 60;

    // Eintrag speichern
    const result = await pool.query(
      `INSERT INTO Stundenbuchungen (id_person, id_baustelle, stunden, baustelle, platzhalter_text, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6::timestamp)
       RETURNING *`,
      [session.user.id, 0, stundenValue, baustelle || 'Nicht angegeben', bemerkung || null, datum + ' ' + startzeit + ':00']
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
