import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import bcrypt from 'bcryptjs';
import pool from '@/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_VERSUCHE = 3;
const SPERRZEIT_MINUTEN = 5;

// In-Memory Rate-Limiting (IP-basiert, zusätzlich zum DB-seitigen Lockout)
// Schützt vor Burst-Angriffen bevor die DB überhaupt erreicht wird
const ipRateLimit = new Map<string, { count: number; resetAt: number }>();
const IP_RATE_MAX = 10;          // max. 10 Login-Versuche
const IP_RATE_WINDOW = 60_000;   // innerhalb von 1 Minute

function isIpRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipRateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRateLimit.set(ip, { count: 1, resetAt: now + IP_RATE_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > IP_RATE_MAX;
}

// Stale Entries bereinigen
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of ipRateLimit) {
    if (now > entry.resetAt) ipRateLimit.delete(ip);
  }
}, 60_000);

// Dummy-Hash für Timing-Attack-Schutz (Benutzer nicht gefunden → trotzdem bcrypt durchführen)
const DUMMY_HASH = '$2b$12$invalidhashfortimingnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn';

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  // IP-Rate-Limit prüfen
  if (isIpRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Zu viele Anfragen. Bitte später erneut versuchen.' },
      { status: 429 }
    );
  }

  let username: string;
  let passwort: string;

  try {
    const body = await request.json();
    username = body.username;
    passwort = body.passwort;
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 });
  }

  // Eingabe-Validierung
  if (!username || typeof username !== 'string' || username.length > 100) {
    return NextResponse.json({ error: 'Fehlende oder ungültige Daten' }, { status: 400 });
  }
  if (!passwort || typeof passwort !== 'string' || passwort.length > 200) {
    return NextResponse.json({ error: 'Fehlende oder ungültige Daten' }, { status: 400 });
  }

  try {
    const result = await pool.query(
      'SELECT id, username, hashed_passwort, admin, login_versuche, letzte_login_sperre FROM personlogin WHERE username = $1',
      [username.trim()]
    );

    const userFound = result.rowCount === 1;
    const user = userFound ? result.rows[0] : null;
    const now = new Date();

    // Konto gesperrt?
    if (userFound && user.letzte_login_sperre) {
      const sperrzeitStart = new Date(user.letzte_login_sperre + 'Z');
      const sperrzeitEnde = new Date(sperrzeitStart.getTime() + SPERRZEIT_MINUTEN * 60 * 1000);
      if (sperrzeitEnde.getTime() > now.getTime()) {
        return NextResponse.json(
          {
            error: `Konto gesperrt bis ${sperrzeitEnde.toLocaleString('de-DE', {
              timeZone: 'Europe/Berlin',
              dateStyle: 'short',
              timeStyle: 'short',
            })}`,
          },
          { status: 403 }
        );
      }
    }

    // Timing-Attack-Schutz: bcrypt IMMER durchführen, auch wenn Benutzer nicht existiert
    // Verhindert Username-Enumeration durch unterschiedliche Antwortzeiten
    const hashToCheck = userFound ? user.hashed_passwort : DUMMY_HASH;
    const pwOK = await bcrypt.compare(passwort, hashToCheck);

    if (!userFound || !pwOK) {
      // Fehlversuch nur protokollieren wenn Benutzer existiert
      if (userFound) {
        const neueVersuche = (user.login_versuche || 0) + 1;
        if (neueVersuche >= MAX_VERSUCHE) {
          await pool.query(
            'UPDATE personlogin SET login_versuche = $1, letzte_login_sperre = NOW() WHERE id = $2',
            [neueVersuche, user.id]
          );
          const sperrzeitEnde = new Date(now.getTime() + SPERRZEIT_MINUTEN * 60 * 1000);
          return NextResponse.json(
            {
              error: `Konto wurde für ${SPERRZEIT_MINUTEN} Minuten gesperrt bis ${sperrzeitEnde.toLocaleString('de-DE', {
                timeZone: 'Europe/Berlin',
                dateStyle: 'short',
                timeStyle: 'short',
              })}`,
            },
            { status: 403 }
          );
        }
        await pool.query(
          'UPDATE personlogin SET login_versuche = $1 WHERE id = $2',
          [neueVersuche, user.id]
        );
        return NextResponse.json(
          { error: `Passwort falsch. Versuch ${neueVersuche} von ${MAX_VERSUCHE}` },
          { status: 401 }
        );
      }
      // Benutzer nicht gefunden — gleiche Fehlermeldung wie falsches Passwort (kein Username-Leak)
      return NextResponse.json({ error: 'Ungültige Anmeldedaten' }, { status: 401 });
    }

    // Login erfolgreich
    await pool.query(
      'UPDATE personlogin SET login_versuche = 0, letzte_login_sperre = NULL WHERE id = $1',
      [user.id]
    );

    const session = await getSession();
    session.user = {
      id: user.id,
      username: user.username,
      admin: user.admin === 1,
    };
    await session.save();

    return NextResponse.json({ success: true });

  } catch (error) {
    // Fehlerdetails NICHT an Client weitergeben (Information Disclosure)
    console.error('Login-Fehler:', error);
    return NextResponse.json({ error: 'Anmeldung fehlgeschlagen' }, { status: 500 });
  }
}
