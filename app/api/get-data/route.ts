import { NextResponse } from 'next/server';
import mariadb from 'mariadb';

export async function GET() {
  const pool = mariadb.createPool({
    host: 'localhost',
    user: 'kmarijan',
    password: 'kmarijankmarijan',
    database: 'kmarijan',
    connectionLimit: 5,
  });

  let conn;
  try {
    conn = await pool.getConnection();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('❌ Fehler bei der Verbindung zur Datenbank:', message);
    return new NextResponse(
      JSON.stringify({ error: 'Verbindungsfehler', details: message }),
      { status: 500 }
    );
  }

  try {
    const rows = await conn.query('SELECT Name, IP FROM `test_tab` ORDER BY id DESC LIMIT 3;');

    // ✅ BigInt-Werte in Strings umwandeln
    const safeRows = rows.map((row: any) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [
          key,
          typeof value === 'bigint' ? value.toString() : value,
        ])
      )
    );

    return NextResponse.json(safeRows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('❌ Fehler beim Ausführen der SQL-Abfrage:', message);
    return new NextResponse(
      JSON.stringify({ error: 'Query-Fehler', details: message }),
      { status: 500 }
    );
  } finally {
    if (conn) conn.end();
  }
}
