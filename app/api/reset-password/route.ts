import { NextResponse } from 'next/server';
import pool from '@/db';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let token: string, newPassword: string;
  try {
    const body = await req.json();
    token = (body.token ?? '').trim();
    newPassword = body.password ?? '';
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 });
  }

  if (!token || token.length !== 64) {
    return NextResponse.json({ error: 'Ungültiger Token' }, { status: 400 });
  }
  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'Passwort muss mindestens 8 Zeichen haben' }, { status: 400 });
  }
  if (newPassword.length > 200) {
    return NextResponse.json({ error: 'Passwort zu lang' }, { status: 400 });
  }

  const result = await pool.query(
    `SELECT t.id, t.user_id, t.expires_at, t.used
     FROM password_reset_tokens t
     WHERE t.token = $1`,
    [token]
  );

  if (result.rowCount === 0) {
    return NextResponse.json({ error: 'Ungültiger oder abgelaufener Link' }, { status: 400 });
  }

  const row = result.rows[0];

  if (row.used) {
    return NextResponse.json({ error: 'Dieser Link wurde bereits verwendet' }, { status: 400 });
  }
  if (new Date(row.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Link abgelaufen. Bitte erneut anfordern.' }, { status: 400 });
  }

  const hashed = await bcrypt.hash(newPassword, 12);

  await pool.query(
    'UPDATE personlogin SET hashed_passwort = $1, login_versuche = 0, letzte_login_sperre = NULL WHERE id = $2',
    [hashed, row.user_id]
  );
  await pool.query(
    'UPDATE password_reset_tokens SET used = TRUE WHERE id = $1',
    [row.id]
  );

  return NextResponse.json({ success: true });
}
