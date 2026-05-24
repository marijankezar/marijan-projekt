import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import pool from '@/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/strom?from=2023-01-01&to=2026-12-31&group=15min|hour|day|month|year
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });

  const from  = req.nextUrl.searchParams.get('from')  ?? '2020-01-01';
  const to    = req.nextUrl.searchParams.get('to')    ?? new Date().toISOString().split('T')[0];
  const group = req.nextUrl.searchParams.get('group') ?? 'day';

  try {
    let dataQuery: string;

    switch (group) {
      case '15min':
        dataQuery = `
          SELECT to_char(zeitpunkt, 'YYYY-MM-DD HH24:MI') AS label,
                 kwh::float AS kwh, 1 AS cnt
          FROM stromverbrauch
          WHERE zeitpunkt >= $1::timestamp AND zeitpunkt <= $2::timestamp
          ORDER BY zeitpunkt
        `;
        break;
      case 'hour':
        dataQuery = `
          SELECT to_char(date_trunc('hour', zeitpunkt), 'YYYY-MM-DD HH24:MI') AS label,
                 SUM(kwh)::numeric(8,3)::float AS kwh,
                 COUNT(*) AS cnt
          FROM stromverbrauch
          WHERE zeitpunkt >= $1::timestamp AND zeitpunkt <= $2::timestamp
          GROUP BY 1 ORDER BY 1
        `;
        break;
      case 'month':
        dataQuery = `
          SELECT to_char(date_trunc('month', zeitpunkt), 'YYYY-MM') AS label,
                 SUM(kwh)::numeric(10,3)::float AS kwh,
                 COUNT(*) AS cnt
          FROM stromverbrauch
          WHERE zeitpunkt >= $1::timestamp AND zeitpunkt <= $2::timestamp
          GROUP BY 1 ORDER BY 1
        `;
        break;
      case 'year':
        dataQuery = `
          SELECT to_char(date_trunc('year', zeitpunkt), 'YYYY') AS label,
                 SUM(kwh)::numeric(10,3)::float AS kwh,
                 COUNT(*) AS cnt
          FROM stromverbrauch
          WHERE zeitpunkt >= $1::timestamp AND zeitpunkt <= $2::timestamp
          GROUP BY 1 ORDER BY 1
        `;
        break;
      default: // day
        dataQuery = `
          SELECT to_char(date_trunc('day', zeitpunkt), 'YYYY-MM-DD') AS label,
                 SUM(kwh)::numeric(8,3)::float AS kwh,
                 COUNT(*) AS cnt
          FROM stromverbrauch
          WHERE zeitpunkt >= $1::timestamp AND zeitpunkt <= $2::timestamp
          GROUP BY 1 ORDER BY 1
        `;
    }

    const [dataRes, statsRes, rangeRes] = await Promise.all([
      pool.query(dataQuery, [from, to]),
      pool.query(`
        SELECT
          COUNT(DISTINCT date_trunc('day', zeitpunkt)) AS tage,
          SUM(kwh)::numeric(10,3)::float               AS gesamt,
          AVG(kwh)::numeric(8,4)::float                AS schnitt_15min,
          MIN(kwh)::numeric(8,4)::float                AS min_15min,
          MAX(kwh)::numeric(8,4)::float                AS max_15min
        FROM stromverbrauch
      `),
      pool.query(`
        SELECT
          to_char(MIN(zeitpunkt), 'YYYY-MM-DD') AS erster,
          to_char(MAX(zeitpunkt), 'YYYY-MM-DD') AS letzter,
          COUNT(*) AS anzahl
        FROM stromverbrauch
      `),
    ]);

    return NextResponse.json({
      data:  dataRes.rows.map(r => ({ label: r.label, kwh: parseFloat(r.kwh), cnt: parseInt(r.cnt) })),
      stats: { ...statsRes.rows[0], ...rangeRes.rows[0] },
    });
  } catch (err) {
    console.error('Strom GET Fehler:', err);
    return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 });
  }
}

// POST /api/strom — CSV-Upload
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'Keine Datei' }, { status: 400 });

    const text = await file.text();
    const rows = parseStromCsv(text);

    if (rows.length === 0)
      return NextResponse.json({ error: 'Keine gültigen Daten in der Datei' }, { status: 400 });

    // Batch-Insert in Blöcken von 500 für Performance bei 100k Zeilen
    const CHUNK = 500;
    let inserted = 0;
    let skipped  = 0;

    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      const placeholders = chunk.map((_, j) => `($${j * 2 + 1}, $${j * 2 + 2})`).join(', ');
      const params = chunk.flatMap(r => [r.zeitpunkt, r.kwh]);
      const res = await pool.query(
        `INSERT INTO stromverbrauch (zeitpunkt, kwh) VALUES ${placeholders}
         ON CONFLICT (zeitpunkt) DO NOTHING`,
        params
      );
      inserted += res.rowCount ?? 0;
      skipped  += chunk.length - (res.rowCount ?? 0);
    }

    return NextResponse.json({ success: true, inserted, skipped, total: rows.length });
  } catch (err) {
    console.error('Strom POST Fehler:', err);
    return NextResponse.json({ error: 'Import fehlgeschlagen' }, { status: 500 });
  }
}

function parseStromCsv(text: string): { zeitpunkt: string; kwh: number }[] {
  // BOM entfernen, Zeilen aufteilen
  const lines = text.replace(/^﻿/, '').split('\n').map(l => l.trim()).filter(Boolean);
  const result: { zeitpunkt: string; kwh: number }[] = [];

  for (let i = 1; i < lines.length; i++) {
    // Gequotete Felder extrahieren: "DD.MM.YYYY HH:MM","0,028"
    const quoted = lines[i].match(/"([^"]*)"/g);
    if (!quoted || quoted.length < 2) continue;

    const rawDate = quoted[0].replace(/"/g, '').trim();
    const rawKwh  = quoted[1].replace(/"/g, '').trim().replace(',', '.');

    // Datum parsen: "DD.MM.YYYY HH:MM" oder "DD.MM.YYYY"
    const spaceIdx = rawDate.indexOf(' ');
    const datePart = spaceIdx >= 0 ? rawDate.slice(0, spaceIdx) : rawDate;
    const timePart = spaceIdx >= 0 ? rawDate.slice(spaceIdx + 1) : '00:00';
    const parts = datePart.split('.');
    if (parts.length !== 3) continue;
    const [day, month, year] = parts;
    const zeitpunkt = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${timePart}:00`;

    const kwh = parseFloat(rawKwh);
    if (isNaN(kwh) || kwh < 0) continue;

    result.push({ zeitpunkt, kwh });
  }
  return result;
}
