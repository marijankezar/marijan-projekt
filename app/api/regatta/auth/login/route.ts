import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import regattaPool from '@/db-regatta';
import { getRegattaSession, type RegattaUser } from '@/lib/regatta-session';
import { loginSchema } from '@/lib/regatta-validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Dummy-Hash für Timing-Attack-Schutz (bcrypt läuft auch bei unbekannter E-Mail)
const DUMMY_HASH = '$2b$12$invalidhashfortimingnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn';

// Einfaches In-Memory Rate-Limiting: 5 Versuche / 5 Minuten pro IP
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function isRateLimited(ip: string): boolean {
  const entry = attempts.get(ip);
  const now = Date.now();
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Zu viele Versuche. Bitte in ein paar Minuten erneut versuchen.' },
      { status: 429 }
    );
  }

  const parsed = loginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 });
  }
  const { email, password } = parsed.data;

  try {
    const result = await regattaPool.query(
      `SELECT id, display_name, email, password_hash, is_admin
       FROM person WHERE email = $1`,
      [email]
    );

    const found = result.rows.length > 0 ? result.rows[0] : null;
    const hashToCheck = found?.password_hash ?? DUMMY_HASH;
    const valid = await bcrypt.compare(password, hashToCheck);

    if (!found || !found.password_hash || !valid) {
      return NextResponse.json({ error: 'Ungültige Anmeldedaten' }, { status: 401 });
    }

    const user: RegattaUser = {
      id: found.id,
      displayName: found.display_name,
      email: found.email,
      isAdmin: found.is_admin,
    };

    const session = await getRegattaSession();
    session.user = user;
    await session.save();

    return NextResponse.json({ ok: true, user });
  } catch (error) {
    console.error('Regatta-Login-Fehler:', error);
    return NextResponse.json({ error: 'Anmeldung fehlgeschlagen' }, { status: 500 });
  }
}
