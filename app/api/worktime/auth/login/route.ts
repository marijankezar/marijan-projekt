import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import worktimePool from '@/db-worktime';
import { getWorktimeSession } from '@/lib/worktime-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Dummy-Hash für Timing-Attack-Schutz
const DUMMY_HASH = '$2b$12$invalidhashfortimingnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn';

export async function POST(req: Request) {
  let username: string;
  let password: string;

  try {
    const body = await req.json();
    username = body.username;
    password = body.password;
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 });
  }

  if (!username?.trim() || !password) {
    return NextResponse.json({ error: 'Username und Passwort erforderlich' }, { status: 400 });
  }

  try {
    const userRes = await worktimePool.query(
      `SELECT u.*, c.name as company_name FROM wt_users u
       LEFT JOIN wt_companies c ON c.id = u.company_id
       WHERE u.username = $1`,
      [username.trim()]
    );

    const userFound = userRes.rows.length > 0;
    const user = userFound ? userRes.rows[0] : null;

    // Timing-Attack-Schutz: bcrypt IMMER durchführen
    const hashToCheck = userFound ? user.password_hash : DUMMY_HASH;
    const valid = await bcrypt.compare(password, hashToCheck);

    if (!userFound || !valid) {
      if (userFound) {
        const attempts = (user.login_attempts || 0) + 1;
        // Exponential lockout: 3min * 2^(attempts-3) nach dem 3. Versuch
        let lockedUntil: Date | null = null;
        if (attempts >= 3) {
          const minutes = 3 * Math.pow(2, attempts - 3);
          lockedUntil = new Date(Date.now() + minutes * 60 * 1000);
        }
        await worktimePool.query(
          `UPDATE wt_users SET login_attempts = $1, locked_until = $2, updated_at = NOW() WHERE id = $3`,
          [attempts, lockedUntil, user.id]
        );
      }
      return NextResponse.json({ error: 'Ungültige Anmeldedaten' }, { status: 401 });
    }

    // Sperrprüfung
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return NextResponse.json(
        { error: `Konto gesperrt bis ${new Date(user.locked_until).toLocaleString('de-AT')}` },
        { status: 423 }
      );
    }

    if (!user.active) {
      return NextResponse.json({ error: 'Konto noch nicht freigeschaltet' }, { status: 403 });
    }

    // Login erfolgreich
    await worktimePool.query(
      `UPDATE wt_users SET login_attempts = 0, locked_until = NULL, last_login = NOW(), updated_at = NOW() WHERE id = $1`,
      [user.id]
    );

    const session = await getWorktimeSession();
    session.user = {
      id: user.id,
      company_id: user.company_id,
      username: user.username,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      lang: user.lang || 'de',
    };
    await session.save();

    return NextResponse.json({ ok: true, user: session.user });
  } catch (error) {
    console.error('Worktime-Login-Fehler:', error);
    return NextResponse.json({ error: 'Anmeldung fehlgeschlagen' }, { status: 500 });
  }
}
