import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import timebookPool from '@/db-timebook';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/timebook/honorarnoten - Alle Rechnungen
export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session.user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const kunde_id = searchParams.get('kunde_id');
    const bezahlt = searchParams.get('bezahlt');
    const jahr = searchParams.get('jahr');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = `
      SELECT h.*,
             k.firmenname, k.kundennummer,
             COALESCE(k.ansprechperson_vorname || ' ' || k.ansprechperson_nachname, k.firmenname) as kunde_name,
             k.email as kunde_email,
             CASE
               WHEN h.bezahlt THEN 'bezahlt'
               WHEN h.storniert THEN 'storniert'
               WHEN h.faelligkeitsdatum < CURRENT_DATE THEN 'überfällig'
               ELSE 'offen'
             END as status
      FROM honorarnoten h
      LEFT JOIN kunden k ON h.kunde_id = k.id
      WHERE h.mitarbeiter_id = $1
    `;
    const params: (string | number | boolean)[] = [session.user.id];

    if (kunde_id) {
      params.push(kunde_id);
      query += ` AND h.kunde_id = $${params.length}`;
    }

    if (bezahlt !== null && bezahlt !== undefined) {
      params.push(bezahlt === 'true');
      query += ` AND h.bezahlt = $${params.length}`;
    }

    if (jahr) {
      params.push(parseInt(jahr));
      query += ` AND EXTRACT(YEAR FROM h.rechnungsdatum) = $${params.length}`;
    }

    query += ` ORDER BY h.rechnungsdatum DESC, h.rechnungsnummer DESC`;
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await timebookPool.query(query, params);

    // Summen berechnen
    const summenResult = await timebookPool.query(
      `SELECT
         COUNT(*) as gesamt,
         COUNT(*) FILTER (WHERE bezahlt = true) as bezahlt_anzahl,
         COUNT(*) FILTER (WHERE bezahlt = false AND storniert = false) as offen_anzahl,
         COALESCE(SUM(bruttobetrag), 0) as summe_gesamt,
         COALESCE(SUM(bruttobetrag) FILTER (WHERE bezahlt = true), 0) as summe_bezahlt,
         COALESCE(SUM(bruttobetrag) FILTER (WHERE bezahlt = false AND storniert = false), 0) as summe_offen
       FROM honorarnoten WHERE mitarbeiter_id = $1`,
      [session.user.id]
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      summen: {
        gesamt: parseInt(summenResult.rows[0].gesamt),
        bezahlt_anzahl: parseInt(summenResult.rows[0].bezahlt_anzahl),
        offen_anzahl: parseInt(summenResult.rows[0].offen_anzahl),
        summe_gesamt: parseFloat(summenResult.rows[0].summe_gesamt),
        summe_bezahlt: parseFloat(summenResult.rows[0].summe_bezahlt),
        summe_offen: parseFloat(summenResult.rows[0].summe_offen)
      }
    });

  } catch (error) {
    console.error('Honorarnoten laden Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Rechnungen' },
      { status: 500 }
    );
  }
}

// POST /api/timebook/honorarnoten - Neue Rechnung erstellen
export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session.user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      kunde_id, rechnungsdatum, leistungsdatum_von, leistungsdatum_bis,
      faelligkeitsdatum, nettobetrag, steuersatz, notizen, positionen
    } = body;

    if (!kunde_id) {
      return NextResponse.json({ error: 'Kunde ist erforderlich' }, { status: 400 });
    }

    if (nettobetrag === undefined || nettobetrag < 0) {
      return NextResponse.json({ error: 'Gültiger Nettobetrag ist erforderlich' }, { status: 400 });
    }

    // Prüfen ob Kunde existiert
    const kundeCheck = await timebookPool.query(
      'SELECT id, zahlungsziel_tage FROM kunden WHERE id = $1 AND mitarbeiter_id = $2',
      [kunde_id, session.user.id]
    );

    if (kundeCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Kunde nicht gefunden' }, { status: 404 });
    }

    // Fälligkeitsdatum berechnen wenn nicht angegeben
    const rechnungsDatum = rechnungsdatum || new Date().toISOString().split('T')[0];
    let faellig = faelligkeitsdatum;
    if (!faellig) {
      const zahlungsziel = kundeCheck.rows[0].zahlungsziel_tage || 30;
      const datum = new Date(rechnungsDatum);
      datum.setDate(datum.getDate() + zahlungsziel);
      faellig = datum.toISOString().split('T')[0];
    }

    // Transaktion starten
    const client = await timebookPool.connect();
    try {
      await client.query('BEGIN');

      // Rechnung erstellen
      const result = await client.query(
        `INSERT INTO honorarnoten (
          mitarbeiter_id, kunde_id, rechnungsdatum, leistungsdatum_von, leistungsdatum_bis,
          faelligkeitsdatum, nettobetrag, steuersatz, notizen
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          session.user.id, kunde_id, rechnungsDatum,
          leistungsdatum_von || null, leistungsdatum_bis || null,
          faellig, nettobetrag, steuersatz || 20.00, notizen || null
        ]
      );

      const rechnung = result.rows[0];

      // Positionen hinzufügen wenn vorhanden
      if (positionen && Array.isArray(positionen) && positionen.length > 0) {
        for (let i = 0; i < positionen.length; i++) {
          const pos = positionen[i];
          await client.query(
            `INSERT INTO honorarnoten_positionen (
              honorarnote_id, position_nr, beschreibung, menge, einheit, einzelpreis, dienstleistung_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              rechnung.id, i + 1, pos.beschreibung,
              pos.menge || 1, pos.einheit || 'Stunden', pos.einzelpreis,
              pos.dienstleistung_id || null
            ]
          );

          // Dienstleistung als abgerechnet markieren
          if (pos.dienstleistung_id) {
            await client.query(
              `UPDATE dienstleistungen SET abgerechnet = true, abgerechnet_am = CURRENT_TIMESTAMP
               WHERE id = $1 AND mitarbeiter_id = $2`,
              [pos.dienstleistung_id, session.user.id]
            );
          }
        }
      }

      await client.query('COMMIT');

      // Vollständige Rechnung laden
      const vollstaendig = await timebookPool.query(
        `SELECT h.*, k.firmenname, k.kundennummer
         FROM honorarnoten h
         LEFT JOIN kunden k ON h.kunde_id = k.id
         WHERE h.id = $1`,
        [rechnung.id]
      );

      return NextResponse.json({
        success: true,
        message: 'Rechnung erfolgreich erstellt',
        data: vollstaendig.rows[0]
      }, { status: 201 });

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Honorarnote erstellen Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Rechnung' },
      { status: 500 }
    );
  }
}
