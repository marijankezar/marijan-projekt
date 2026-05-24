import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import pool from '@/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/strom?from=2026-01-01&to=2026-12-31&group=day|month|year
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });

  const from  = req.nextUrl.searchParams.get('from')  ?? '2020-01-01';
  const to    = req.nextUrl.searchParams.get('to')    ?? new Date().toISOString().split('T')[0];
  const group = req.nextUrl.searchParams.get('group') ?? 'day';

  try {
    let query: string;
    if (group === 'month') {
      query = `
        SELECT to_char(datum, 'YYYY-MM') AS label,
               SUM(kwh)::numeric(10,3)  AS kwh,
               COUNT(*)                 AS tage
        FROM stromverbrauch
        WHERE datum BETWEEN $1 AND $2
        GROUP BY 1 ORDER BY 1
      `;
    } else if (group === 'year') {
      query = `
        SELECT to_char(datum, 'YYYY') AS label,
               SUM(kwh)::numeric(10,3) AS kwh,
               COUNT(*)                AS tage
        FROM stromverbrauch
        WHERE datum BETWEEN $1 AND $2
        GROUP BY 1 ORDER BY 1
      `;
    } else {
      query = `
        SELECT to_char(datum, 'YYYY-MM-DD') AS label,
               kwh,
               1 AS tage
        FROM stromverbrauch
        WHERE datum BETWEEN $1 AND $2
        ORDER BY datum
      `;
    }

    const { rows } = await pool.query(query, [from, to]);

    const stats = await pool.query(`
      SELECT
        COUNT(*)                        AS anzahl,
        SUM(kwh)::numeric(10,3)         AS gesamt,
        AVG(kwh)::numeric(10,3)         AS schnitt,
        MIN(kwh)::numeric(10,3)         AS min,
        MAX(kwh)::numeric(10,3)         AS max,
        MIN(datum)::text                AS erster,
        MAX(datum)::text                AS letzter
      FROM stromverbrauch
    `);

    return NextResponse.json({
      data:  rows.map(r => ({ label: r.label, kwh: parseFloat(r.kwh), tage: parseInt(r.tage) })),
      stats: stats.rows[0],
    });
  } catch (err) {
    console.error('Strom API Fehler:', err);
    return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 });
  }
}

// POST /api/strom  — CSV-Upload und Import
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'Keine Datei' }, { status: 400 });

    const text = await file.text();
    const rows = parseCsv(text);

    if (rows.length === 0)
      return NextResponse.json({ error: 'Keine gültigen Daten in der Datei' }, { status: 400 });

    let inserted = 0;
    let skipped  = 0;
    for (const { datum, kwh } of rows) {
      const res = await pool.query(
        `INSERT INTO stromverbrauch (datum, kwh)
         VALUES ($1, $2)
         ON CONFLICT (datum) DO NOTHING`,
        [datum, kwh]
      );
      if (res.rowCount === 1) inserted++;
      else skipped++;
    }

    return NextResponse.json({ success: true, inserted, skipped, total: rows.length });
  } catch (err) {
    console.error('Strom Import Fehler:', err);
    return NextResponse.json({ error: 'Import fehlgeschlagen' }, { status: 500 });
  }
}

function parseCsv(text: string): { datum: string; kwh: number }[] {
  const lines = text.replace(/^﻿/, '').split('\n').map(l => l.trim()).filter(Boolean);
  const result: { datum: string; kwh: number }[] = [];
  for (let i = 1; i < lines.length; i++) {
    // Format: "DD.MM.YYYY","n,nnn"  oder  DD.MM.YYYY,n.nnn
    const cols = lines[i].split(',').map(c => c.replace(/"/g, '').trim());
    if (cols.length < 2) continue;

    // Datum parsen: DD.MM.YYYY
    const dateParts = cols[0].split('.');
    if (dateParts.length !== 3) continue;
    const datum = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;

    // Komma als Dezimaltrennzeichen: "3,656" → 3.656
    // Aber CSV trennt auch mit Komma — letztes Segment nehmen falls mehrere
    const rawKwh = cols.slice(1).join('.').replace(',', '.');
    const kwh = parseFloat(rawKwh);
    if (isNaN(kwh) || kwh < 0) continue;

    result.push({ datum, kwh });
  }
  return result;
}
