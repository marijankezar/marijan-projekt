import pool from '@/db';
import { NextRequest, NextResponse } from 'next/server';


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
        'anonymous mama', // oder hole eingeloggten Usernamen
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
  } 
  catch (err: unknown) {
    if (err instanceof Error) {
      console.error('Logging-Fehler:', err);
      return new NextResponse(`Fehler beim automatischen Logging: ${err.message}`, { status: 500 });
    } else {
      console.error('Unbekannter Fehler:', err);
      return new NextResponse('Unbekannter Fehler beim Logging', { status: 500 });
    }
  }
}
