import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import pool from '@/db';

export async function GET() {
  const session = await getSession();

  if (!session.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    // Hole alle eindeutigen Baustellen-Namen aus den Stundenbuchungen
    const result = await pool.query(
      `SELECT DISTINCT baustelle as name, MIN(id) as id
       FROM Stundenbuchungen
       WHERE baustelle IS NOT NULL AND baustelle != ''
       GROUP BY baustelle
       ORDER BY baustelle ASC`
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Fehler beim Abrufen der Baustellen:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
