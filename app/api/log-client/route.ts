import pool from '@/db';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const forwardedFor = req.headers.get('x-forwarded-for') || '';
    const ip_address = forwardedFor.split(',')[0].trim();
    const user_agent = req.headers.get('user-agent') || 'unknown';

    await pool.query(
      `INSERT INTO connection_logs
        (username, host, ip_address, placeholder1, placeholder2, placeholder3, placeholder4, placeholder5)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        'anonymous',
        user_agent,
        ip_address,
        'auto-log',
        '',
        0.0,
        0,
        false,
      ]
    );

    return NextResponse.json({ status: 'logged' });
  } catch (err: unknown) {
    console.error('Logging-Fehler:', err);
    return NextResponse.json({ error: 'Logging fehlgeschlagen' }, { status: 500 });
  }
}
