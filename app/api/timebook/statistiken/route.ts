import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import timebookPool from '@/db-timebook';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/timebook/statistiken - Übersicht Statistiken
export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session.user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'uebersicht';
    const jahr = parseInt(searchParams.get('jahr') || new Date().getFullYear().toString());
    const monat = searchParams.get('monat') ? parseInt(searchParams.get('monat')!) : null;

    if (type === 'uebersicht') {
      // Allgemeine Übersicht
      const heute = new Date();
      const wochenStart = new Date(heute);
      wochenStart.setDate(heute.getDate() - heute.getDay() + 1);
      const monatsStart = new Date(heute.getFullYear(), heute.getMonth(), 1);

      // Stunden heute
      const heuteResult = await timebookPool.query(
        `SELECT COALESCE(SUM(dauer_stunden), 0) as stunden
         FROM dienstleistungen
         WHERE mitarbeiter_id = $1 AND start_datum = CURRENT_DATE AND dauer_stunden IS NOT NULL`,
        [session.user.id]
      );

      // Stunden diese Woche
      const wocheResult = await timebookPool.query(
        `SELECT COALESCE(SUM(dauer_stunden), 0) as stunden
         FROM dienstleistungen
         WHERE mitarbeiter_id = $1 AND start_datum >= $2 AND dauer_stunden IS NOT NULL`,
        [session.user.id, wochenStart.toISOString().split('T')[0]]
      );

      // Stunden diesen Monat
      const monatResult = await timebookPool.query(
        `SELECT COALESCE(SUM(dauer_stunden), 0) as stunden
         FROM dienstleistungen
         WHERE mitarbeiter_id = $1 AND start_datum >= $2 AND dauer_stunden IS NOT NULL`,
        [session.user.id, monatsStart.toISOString().split('T')[0]]
      );

      // Stunden dieses Jahr
      const jahrResult = await timebookPool.query(
        `SELECT COALESCE(SUM(dauer_stunden), 0) as stunden
         FROM dienstleistungen
         WHERE mitarbeiter_id = $1 AND EXTRACT(YEAR FROM start_datum) = $2 AND dauer_stunden IS NOT NULL`,
        [session.user.id, heute.getFullYear()]
      );

      // Anzahl Kunden
      const kundenResult = await timebookPool.query(
        `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE aktiv) as aktiv
         FROM kunden WHERE mitarbeiter_id = $1`,
        [session.user.id]
      );

      // Laufende Zeiterfassung
      const laufendResult = await timebookPool.query(
        `SELECT COUNT(*) as count FROM dienstleistungen
         WHERE mitarbeiter_id = $1 AND ende_datum IS NULL`,
        [session.user.id]
      );

      return NextResponse.json({
        success: true,
        data: {
          stunden: {
            heute: parseFloat(heuteResult.rows[0].stunden) || 0,
            woche: parseFloat(wocheResult.rows[0].stunden) || 0,
            monat: parseFloat(monatResult.rows[0].stunden) || 0,
            jahr: parseFloat(jahrResult.rows[0].stunden) || 0
          },
          kunden: {
            total: parseInt(kundenResult.rows[0].total) || 0,
            aktiv: parseInt(kundenResult.rows[0].aktiv) || 0
          },
          laufende_erfassungen: parseInt(laufendResult.rows[0].count) || 0
        }
      });

    } else if (type === 'monatlich') {
      // Monatliche Statistik
      const result = await timebookPool.query(
        `SELECT
           EXTRACT(MONTH FROM start_datum)::INTEGER as monat,
           COUNT(*) as anzahl_eintraege,
           ROUND(COALESCE(SUM(dauer_stunden), 0)::numeric, 2) as stunden,
           COUNT(DISTINCT kunde_id) as anzahl_kunden,
           COUNT(DISTINCT start_datum) as anzahl_tage
         FROM dienstleistungen
         WHERE mitarbeiter_id = $1 AND EXTRACT(YEAR FROM start_datum) = $2 AND dauer_stunden IS NOT NULL
         GROUP BY EXTRACT(MONTH FROM start_datum)
         ORDER BY monat`,
        [session.user.id, jahr]
      );

      return NextResponse.json({
        success: true,
        jahr,
        data: result.rows
      });

    } else if (type === 'taeglich') {
      // Tägliche Statistik für einen Monat
      if (!monat) {
        return NextResponse.json({ error: 'Monat ist erforderlich für tägliche Statistik' }, { status: 400 });
      }

      const result = await timebookPool.query(
        `SELECT
           start_datum as datum,
           TO_CHAR(start_datum, 'Day') as wochentag,
           COUNT(*) as anzahl_eintraege,
           ROUND(COALESCE(SUM(dauer_stunden), 0)::numeric, 2) as stunden
         FROM dienstleistungen
         WHERE mitarbeiter_id = $1
           AND EXTRACT(YEAR FROM start_datum) = $2
           AND EXTRACT(MONTH FROM start_datum) = $3
           AND dauer_stunden IS NOT NULL
         GROUP BY start_datum
         ORDER BY start_datum`,
        [session.user.id, jahr, monat]
      );

      return NextResponse.json({
        success: true,
        jahr,
        monat,
        data: result.rows
      });

    } else if (type === 'kunden') {
      // Statistik pro Kunde
      const result = await timebookPool.query(
        `SELECT
           k.id as kunde_id,
           k.kundennummer,
           COALESCE(k.firmenname, k.ansprechperson_vorname || ' ' || k.ansprechperson_nachname) as kunde_name,
           COUNT(d.id) as anzahl_eintraege,
           ROUND(COALESCE(SUM(d.dauer_stunden), 0)::numeric, 2) as stunden,
           MIN(d.start_datum) as erster_eintrag,
           MAX(d.start_datum) as letzter_eintrag
         FROM kunden k
         LEFT JOIN dienstleistungen d ON k.id = d.kunde_id AND d.dauer_stunden IS NOT NULL
         WHERE k.mitarbeiter_id = $1
         GROUP BY k.id, k.kundennummer, k.firmenname, k.ansprechperson_vorname, k.ansprechperson_nachname
         ORDER BY stunden DESC NULLS LAST`,
        [session.user.id]
      );

      return NextResponse.json({
        success: true,
        data: result.rows
      });

    } else if (type === 'kategorien') {
      // Statistik pro Kategorie
      const result = await timebookPool.query(
        `SELECT
           dk.id as kategorie_id,
           dk.bezeichnung,
           dk.farbe,
           COUNT(d.id) as anzahl_eintraege,
           ROUND(COALESCE(SUM(d.dauer_stunden), 0)::numeric, 2) as stunden
         FROM dienstleistungskategorien dk
         LEFT JOIN dienstleistungen d ON dk.id = d.kategorie_id AND d.dauer_stunden IS NOT NULL
         WHERE dk.mitarbeiter_id = $1
         GROUP BY dk.id, dk.bezeichnung, dk.farbe
         ORDER BY stunden DESC NULLS LAST`,
        [session.user.id]
      );

      // Auch Einträge ohne Kategorie
      const ohneKategorie = await timebookPool.query(
        `SELECT COUNT(*) as anzahl, ROUND(COALESCE(SUM(dauer_stunden), 0)::numeric, 2) as stunden
         FROM dienstleistungen
         WHERE mitarbeiter_id = $1 AND kategorie_id IS NULL AND dauer_stunden IS NOT NULL`,
        [session.user.id]
      );

      return NextResponse.json({
        success: true,
        data: result.rows,
        ohne_kategorie: {
          anzahl_eintraege: parseInt(ohneKategorie.rows[0].anzahl) || 0,
          stunden: parseFloat(ohneKategorie.rows[0].stunden) || 0
        }
      });

    } else {
      return NextResponse.json({ error: 'Ungültiger Statistik-Typ' }, { status: 400 });
    }

  } catch (error) {
    console.error('Statistiken laden Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Statistiken' },
      { status: 500 }
    );
  }
}
