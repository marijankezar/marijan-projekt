import { NextRequest, NextResponse } from 'next/server';
import pool from '../../lib/db'; 

// GET – Alle Logs abrufen
export async function GET() {
  const res = await pool.query('SELECT * FROM connection_logs ORDER BY log_time DESC');
  return NextResponse.json(res.rows);
}

// POST – Neuen Log-Eintrag hinzufügen
export async function POST(req: NextRequest) {
  const data = await req.json();
  await pool.query(
    `INSERT INTO connection_logs 
    (username, host, ip_address, placeholder1, placeholder2, placeholder3, placeholder4, placeholder5)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      data.username,
      data.host,
      data.ip_address,
      data.placeholder1,
      data.placeholder2,
      data.placeholder3,
      data.placeholder4,
      data.placeholder5,
    ]
  );

  return NextResponse.json({ status: 'OK' });
}

// PUT – Einen Eintrag aktualisieren (via username)
export async function PUT(req: NextRequest) {
  const data = await req.json();
  await pool.query(
    `UPDATE connection_logs 
     SET placeholder1 = $1, placeholder3 = $2 
     WHERE username = $3`,
    [data.placeholder1, data.placeholder3, data.username]
  );

  return NextResponse.json({ status: 'updated' });
}
