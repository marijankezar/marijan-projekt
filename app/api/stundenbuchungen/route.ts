import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import pool from '@/db';

export async function GET() {
  const session = await getSession();

  // ✅ Zugriff nur für eingeloggte User
  if (!session.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const result = await pool.query('SELECT * FROM Stundenbuchungen ORDER BY id DESC LIMIT 100');

    const data = result.rows.map((row) => ({
      ...row,
      stunden: row.stunden !== null ? parseFloat(row.stunden) : null,
      platzhalter_double: row.platzhalter_double !== null ? parseFloat(row.platzhalter_double) : null,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error('Fehler beim Abrufen der Stundenbuchungen:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
