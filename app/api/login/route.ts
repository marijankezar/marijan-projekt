import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import bcrypt from 'bcryptjs';
import pool from '@/db';

// Explizit Node.js Runtime verwenden (nicht Edge)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_VERSUCHE = 3;
const SPERRZEIT_MINUTEN = 5;

export async function POST(request: Request) {
  let username: string;
  let passwort: string;

  try {
    const body = await request.json();
    username = body.username;
    passwort = body.passwort;
  } catch (parseError) {
    console.error('JSON Parse Error:', parseError);
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 });
  }

  if (!username || !passwort) {
    return NextResponse.json({ error: 'Fehlende Daten' }, { status: 400 });
  }

  try {
    // Benutzer abrufen - direkt mit pool.query() statt pool.connect()
    const result = await pool.query(
      'SELECT id, username, hashed_passwort, admin, login_versuche, letzte_login_sperre FROM personlogin WHERE username = $1',
      [username]
    );

    if (result.rowCount !== 1) {
      return NextResponse.json({ error: 'Ungültiger Benutzername' }, { status: 401 });
    }

    const user = result.rows[0];
    const now = new Date();

    // Prüfung: Ist das Konto gesperrt?
    if (user.letzte_login_sperre) {
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

    // Passwortprüfung
    let pwOK = false;
    try {
      pwOK = await bcrypt.compare(passwort, user.hashed_passwort);
    } catch (bcryptError) {
      console.error('Bcrypt Error:', bcryptError);
      return NextResponse.json({
        error: 'Fehler bei Passwortprüfung',
        details: bcryptError instanceof Error ? bcryptError.message : 'Unbekannt'
      }, { status: 500 });
    }

    if (!pwOK) {
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
      } else {
        await pool.query(
          'UPDATE personlogin SET login_versuche = $1 WHERE id = $2',
          [neueVersuche, user.id]
        );
        return NextResponse.json(
          { error: `Passwort falsch. Versuch ${neueVersuche} von ${MAX_VERSUCHE}` },
          { status: 401 }
        );
      }
    }

    // Login erfolgreich: Versuche und Sperrzeit zurücksetzen
    await pool.query(
      'UPDATE personlogin SET login_versuche = 0, letzte_login_sperre = NULL WHERE id = $1',
      [user.id]
    );

    // Session erstellen
    try {
      const session = await getSession();
      session.user = {
        id: user.id,
        username: user.username,
        admin: user.admin === 1,
      };
      await session.save();
    } catch (sessionError) {
      console.error('Session-Fehler:', sessionError);
      return NextResponse.json({
        error: 'Session konnte nicht erstellt werden',
        details: sessionError instanceof Error ? sessionError.message : 'Unbekannter Fehler'
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Login-Fehler:', error);
    return NextResponse.json({
      error: 'Login fehlgeschlagen',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler',
      hint: 'Möglicherweise ist die Datenbankverbindung nicht verfügbar'
    }, { status: 500 });
  }
}
