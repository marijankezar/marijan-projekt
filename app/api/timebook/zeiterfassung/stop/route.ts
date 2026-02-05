import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import timebookPool from '@/db-timebook';
import { formatiereMinutenAlsZeit, formatiereMinutenLang } from '@/types/db-timebook';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/timebook/zeiterfassung/stop - Laufende Zeiterfassung beenden
export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session.user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ende_datum, ende_zeit, notizen } = body;

    // Aktuelle Zeit als Standard
    const now = new Date();
    const finalEndeDatum = ende_datum || now.toISOString().split('T')[0];
    const finalEndeZeit = ende_zeit || now.toTimeString().slice(0, 5);

    let query: string;
    let params: (string | number | boolean | null)[];

    if (id) {
      // Bestimmte Zeiterfassung beenden
      query = `
        UPDATE dienstleistungen
        SET ende_datum = $1, ende_zeit = $2, abgeschlossen = true, notizen = COALESCE($3, notizen)
        WHERE id = $4 AND mitarbeiter_id = $5 AND ende_datum IS NULL
        RETURNING *
      `;
      params = [finalEndeDatum, finalEndeZeit, notizen || null, id, session.user.id];
    } else {
      // Letzte laufende Zeiterfassung beenden
      query = `
        UPDATE dienstleistungen
        SET ende_datum = $1, ende_zeit = $2, abgeschlossen = true, notizen = COALESCE($3, notizen)
        WHERE id = (
          SELECT id FROM dienstleistungen
          WHERE mitarbeiter_id = $4 AND ende_datum IS NULL
          ORDER BY start_timestamp DESC
          LIMIT 1
        )
        RETURNING *
      `;
      params = [finalEndeDatum, finalEndeZeit, notizen || null, session.user.id];
    }

    const result = await timebookPool.query(query, params);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Keine laufende Zeiterfassung gefunden' },
        { status: 404 }
      );
    }

    const eintrag = result.rows[0];

    // Dauer formatieren
    const dauerAnzeige = eintrag.dauer_minuten
      ? formatiereMinutenAlsZeit(eintrag.dauer_minuten)
      : null;
    const dauerLang = eintrag.dauer_minuten
      ? formatiereMinutenLang(eintrag.dauer_minuten)
      : null;

    return NextResponse.json({
      success: true,
      message: 'Zeiterfassung beendet',
      data: eintrag,
      dauer: {
        minuten: eintrag.dauer_minuten,
        stunden: eintrag.dauer_stunden,
        anzeige: dauerAnzeige,
        lang: dauerLang
      }
    });

  } catch (error) {
    console.error('Zeiterfassung beenden Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler beim Beenden der Zeiterfassung' },
      { status: 500 }
    );
  }
}
