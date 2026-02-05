import { NextRequest, NextResponse } from 'next/server';
import timebookPool from '@/db-timebook';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, vorname, nachname } = body;

    // Validierung
    const errors: string[] = [];

    if (!username || username.length < 3) {
      errors.push('Benutzername muss mindestens 3 Zeichen haben.');
    } else if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
      errors.push('Benutzername darf nur Buchstaben, Zahlen, Punkte, Unterstriche und Bindestriche enthalten.');
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Bitte eine gültige E-Mail-Adresse eingeben.');
    }

    if (!password || password.length < 8) {
      errors.push('Passwort muss mindestens 8 Zeichen haben.');
    } else {
      if (!/[A-Z]/.test(password)) errors.push('Passwort muss mindestens einen Großbuchstaben enthalten.');
      if (!/[a-z]/.test(password)) errors.push('Passwort muss mindestens einen Kleinbuchstaben enthalten.');
      if (!/[0-9]/.test(password)) errors.push('Passwort muss mindestens eine Zahl enthalten.');
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(' '), details: errors }, { status: 400 });
    }

    // Prüfen ob Username oder Email bereits existiert
    const existingUser = await timebookPool.query(
      'SELECT id FROM personlogin WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'Benutzername oder E-Mail bereits vergeben.' },
        { status: 409 }
      );
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 12);

    // Benutzer erstellen
    const result = await timebookPool.query(
      `INSERT INTO personlogin (username, email, hashed_passwort, vorname, nachname, admin, aktiv)
       VALUES ($1, $2, $3, $4, $5, 0, true)
       RETURNING id, username, email, vorname, nachname, admin, aktiv, erstellt_am`,
      [username, email, hashedPassword, vorname || null, nachname || null]
    );

    return NextResponse.json({
      success: true,
      message: 'Benutzer erfolgreich registriert',
      user: result.rows[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Registrierung Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler bei der Registrierung' },
      { status: 500 }
    );
  }
}
