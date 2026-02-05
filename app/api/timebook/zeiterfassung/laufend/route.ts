import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import timebookPool from '@/db-timebook';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/timebook/zeiterfassung/laufend - Aktuelle laufende Zeiterfassung abrufen
export async function GET() {
  const session = await getSession();

  if (!session.user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const result = await timebookPool.query(
      `SELECT d.*,
              k.firmenname, k.kundennummer,
              COALESCE(k.ansprechperson_vorname || ' ' || k.ansprechperson_nachname, k.firmenname) as kunde_name,
              dk.bezeichnung as kategorie_bezeichnung, dk.farbe as kategorie_farbe,
              ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - d.start_timestamp)) / 60) as laufzeit_minuten,
              ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - d.start_timestamp)) / 3600, 2) as laufzeit_stunden
       FROM dienstleistungen d
       LEFT JOIN kunden k ON d.kunde_id = k.id
       LEFT JOIN dienstleistungskategorien dk ON d.kategorie_id = dk.id
       WHERE d.mitarbeiter_id = $1 AND d.ende_datum IS NULL AND d.ende_zeit IS NULL
       ORDER BY d.start_timestamp DESC
       LIMIT 1`,
      [session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: true,
        laeuft: false,
        data: null
      });
    }

    const eintrag = result.rows[0];
    const laufzeitMinuten = parseInt(eintrag.laufzeit_minuten) || 0;
    const stunden = Math.floor(laufzeitMinuten / 60);
    const minuten = laufzeitMinuten % 60;

    return NextResponse.json({
      success: true,
      laeuft: true,
      data: eintrag,
      laufzeit: {
        minuten: laufzeitMinuten,
        stunden: parseFloat(eintrag.laufzeit_stunden) || 0,
        anzeige: `${stunden}:${minuten.toString().padStart(2, '0')}`,
        lang: stunden > 0 ? `${stunden} Std ${minuten} Min` : `${minuten} Min`
      }
    });

  } catch (error) {
    console.error('Laufende Zeiterfassung laden Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der laufenden Zeiterfassung' },
      { status: 500 }
    );
  }
}
