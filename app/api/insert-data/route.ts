import { NextRequest, NextResponse } from 'next/server'
import mariadb from 'mariadb'

const pool = mariadb.createPool({
  host: 'localhost',
  user: 'kmarijan',
  password: 'kmarijankmarijan',
  database: 'kmarijan',
})

export async function POST(req: NextRequest) {
  console.log('[POST] Neue Anfrage erhalten.')

  try {
    const body = await req.json()
    console.log('[POST] Anfrage-Body empfangen:', body)

    const { Name, IP, Host } = body

    if (!Name || !IP || !Host) {
      console.warn('[POST] Ungültige Eingabedaten:', { Name, IP, Host })
      return NextResponse.json(
        { error: 'Name, IP und Host müssen angegeben werden' },
        { status: 400 }
      )
    }

    console.log('[POST] Verbindung zur Datenbank wird aufgebaut...')
    const conn = await pool.getConnection()
    console.log('[POST] Verbindung erfolgreich hergestellt.')

    console.log('[POST] SQL INSERT wird ausgeführt mit:', { Name, IP, Host })
    const result = await conn.query(
      'INSERT INTO test_tab (Timestamp, Name, IP, Host) VALUES (NOW(), ?, ?, ?)',
      [Name, IP, Host]
    )
    console.log('[POST] INSERT erfolgreich, Ergebnis:', result)

    conn.end()
    console.log('[POST] Verbindung zur Datenbank geschlossen.')

    return NextResponse.json({ success: true, insertId: result.insertId })
  } catch (err: any) {
    console.error('[POST] Fehler beim Verarbeiten der Anfrage:', err)
    return NextResponse.json(
      { error: 'Fehler beim Einfügen', details: err.message },
      { status: 500 }
    )
  }
}
