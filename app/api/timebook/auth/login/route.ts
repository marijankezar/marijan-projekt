import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import timebookPool from '@/db-timebook';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validierung
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Benutzername und Passwort sind erforderlich' },
        { status: 400 }
      );
    }

    // Benutzer suchen
    const userResult = await timebookPool.query(
      `SELECT id, username, email, hashed_passwort, vorname, nachname, admin, aktiv,
              login_versuche, letzte_login_sperre
       FROM personlogin WHERE username = $1 OR email = $1`,
      [username]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Ungültige Anmeldedaten' },
        { status: 401 }
      );
    }

    const user = userResult.rows[0];

    // Prüfen ob Benutzer aktiv ist
    if (!user.aktiv) {
      return NextResponse.json(
        { error: 'Dieses Konto wurde deaktiviert' },
        { status: 403 }
      );
    }

    // Login-Sperre prüfen
    const sperreResult = await timebookPool.query(
      'SELECT * FROM pruefe_login_sperre($1)',
      [user.id]
    );

    if (sperreResult.rows[0]?.gesperrt) {
      const verbleibend = Math.ceil(sperreResult.rows[0].verbleibende_sekunden / 60);
      return NextResponse.json(
        {
          error: `Konto vorübergehend gesperrt. Bitte warten Sie ${verbleibend} Minute(n).`,
          gesperrt: true,
          verbleibende_sekunden: sperreResult.rows[0].verbleibende_sekunden
        },
        { status: 429 }
      );
    }

    // Passwort prüfen
    const passwordValid = await bcrypt.compare(password, user.hashed_passwort);

    // IP-Adresse extrahieren
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || null;
    const userAgent = request.headers.get('user-agent') || null;

    if (!passwordValid) {
      // Fehlgeschlagenen Login registrieren
      await timebookPool.query(
        'SELECT registriere_login_versuch($1, $2, $3::inet, $4)',
        [user.id, false, ip, userAgent]
      );

      const versuche = (sperreResult.rows[0]?.fehlversuche || 0) + 1;
      const verbleibend = 3 - versuche;

      return NextResponse.json(
        {
          error: verbleibend > 0
            ? `Ungültige Anmeldedaten. Noch ${verbleibend} Versuch(e).`
            : 'Konto wurde gesperrt. Bitte warten Sie 5 Minuten.',
          versuche_verbleibend: Math.max(0, verbleibend)
        },
        { status: 401 }
      );
    }

    // Erfolgreichen Login registrieren
    await timebookPool.query(
      'SELECT registriere_login_versuch($1, $2, $3::inet, $4)',
      [user.id, true, ip, userAgent]
    );

    // Session erstellen
    const session = await getSession();
    session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      vorname: user.vorname || undefined,
      nachname: user.nachname || undefined,
      admin: !!user.admin
    };
    await session.save();

    return NextResponse.json({
      success: true,
      message: 'Erfolgreich angemeldet',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        vorname: user.vorname,
        nachname: user.nachname,
        admin: user.admin
      }
    });

  } catch (error) {
    console.error('Login Fehler:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
