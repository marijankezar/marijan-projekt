import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import timebookPool from '@/db-timebook';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/timebook/zeiterfassung/start - Neue Zeiterfassung starten
export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session.user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { kunde_id, kategorie_id, titel, beschreibung, stundensatz } = body;

    // Validierung
    if (!kunde_id) {
      return NextResponse.json({ error: 'Kunde ist erforderlich' }, { status: 400 });
    }

    if (!beschreibung) {
      return NextResponse.json({ error: 'Beschreibung ist erforderlich' }, { status: 400 });
    }

    // Prüfen ob bereits eine laufende Zeiterfassung existiert
    const laufendCheck = await timebookPool.query(
      `SELECT id, titel FROM dienstleistungen
       WHERE mitarbeiter_id = $1 AND ende_datum IS NULL AND ende_zeit IS NULL`,
      [session.user.id]
    );

    if (laufendCheck.rows.length > 0) {
      return NextResponse.json({
        error: 'Es läuft bereits eine Zeiterfassung. Bitte beende diese zuerst.',
        laufende_id: laufendCheck.rows[0].id,
        laufende_titel: laufendCheck.rows[0].titel
      }, { status: 409 });
    }

    // Prüfen ob Kunde existiert
    const kundeCheck = await timebookPool.query(
      'SELECT id FROM kunden WHERE id = $1 AND mitarbeiter_id = $2',
      [kunde_id, session.user.id]
    );

    if (kundeCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Kunde nicht gefunden' }, { status: 404 });
    }

    // Aktuelle Zeit ermitteln
    const now = new Date();
    const start_datum = now.toISOString().split('T')[0];
    const start_zeit = now.toTimeString().slice(0, 5); // HH:MM

    const result = await timebookPool.query(
      `INSERT INTO dienstleistungen (
        mitarbeiter_id, kunde_id, kategorie_id,
        start_datum, start_zeit,
        titel, beschreibung, stundensatz, abgeschlossen
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false)
      RETURNING *`,
      [
        session.user.id, kunde_id, kategorie_id || null,
        start_datum, start_zeit,
        titel || null, beschreibung, stundensatz || null
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Zeiterfassung gestartet',
      data: result.rows[0],
      gestartet_um: `${start_datum} ${start_zeit}`
    }, { status: 201 });

  } catch (error) {
    console.error('Zeiterfassung starten Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler beim Starten der Zeiterfassung' },
      { status: 500 }
    );
  }
}
