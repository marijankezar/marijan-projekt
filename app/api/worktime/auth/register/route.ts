import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import worktimePool from '@/db-worktime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 });
  }

  const { username, email, password, first_name, last_name, company_id, lang } = body as Record<string, string>;

  if (!username?.trim() || !email?.trim() || !password || !company_id) {
    return NextResponse.json({ error: 'Pflichtfelder fehlen' }, { status: 400 });
  }

  try {
    // Company existiert?
    const companyRes = await worktimePool.query(
      'SELECT id FROM wt_companies WHERE id = $1 AND active = true',
      [company_id]
    );
    if (companyRes.rows.length === 0) {
      return NextResponse.json({ error: 'Unternehmen nicht gefunden' }, { status: 404 });
    }

    // Duplicate check
    const dupRes = await worktimePool.query(
      'SELECT id FROM wt_users WHERE username = $1 OR email = $2',
      [username.trim(), email.trim()]
    );
    if (dupRes.rows.length > 0) {
      return NextResponse.json({ error: 'Benutzername oder E-Mail bereits vergeben' }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 12);

    await worktimePool.query(
      `INSERT INTO wt_users (company_id, username, email, password_hash, first_name, last_name, role, active, lang)
       VALUES ($1, $2, $3, $4, $5, $6, 'employee', false, $7)`,
      [
        company_id,
        username.trim(),
        email.trim(),
        hash,
        first_name?.trim() || null,
        last_name?.trim() || null,
        lang || 'de',
      ]
    );

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error('Worktime-Registrierung-Fehler:', error);
    return NextResponse.json({ error: 'Registrierung fehlgeschlagen' }, { status: 500 });
  }
}
