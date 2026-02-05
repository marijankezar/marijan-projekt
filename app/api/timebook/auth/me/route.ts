import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import timebookPool from '@/db-timebook';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();

    if (!session.user) {
      return NextResponse.json(
        { error: 'Nicht angemeldet' },
        { status: 401 }
      );
    }

    // Aktuelle Benutzerdaten laden
    const result = await timebookPool.query(
      `SELECT id, username, email, vorname, nachname, admin, aktiv,
              telefon, position, erstellt_am
       FROM personlogin WHERE id = $1`,
      [session.user.id]
    );

    if (result.rows.length === 0) {
      session.destroy();
      return NextResponse.json(
        { error: 'Benutzer nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Auth/Me Fehler:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
