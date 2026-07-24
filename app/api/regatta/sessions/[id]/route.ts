import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import regattaPool from '@/db-regatta';
import { getRegattaSession } from '@/lib/regatta-session';
import { publishSessionEnd } from '@/lib/regatta-broadcast';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Stop einer Tracking-Session. Idempotent: doppeltes Stoppen ist kein Fehler. */
export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRegattaSession();
  if (!session.user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const { id } = await params;

  const result = await regattaPool.query(
    `UPDATE track_session SET active = false, stopped_at = NOW()
     WHERE id = $1 AND person_id = $2 AND active = true
     RETURNING id, started_at AS "startedAt", stopped_at AS "stoppedAt"`,
    [id, session.user.id]
  );

  if (result.rows.length > 0) {
    publishSessionEnd(id, session.user.id);
    return NextResponse.json(result.rows[0]);
  }

  // Bereits gestoppt oder gehört nicht dieser Person -> unterscheiden für saubere Fehlermeldung
  const existing = await regattaPool.query(
    `SELECT id, started_at AS "startedAt", stopped_at AS "stoppedAt", active
     FROM track_session WHERE id = $1 AND person_id = $2`,
    [id, session.user.id]
  );
  if (existing.rows.length === 0) {
    return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
  }
  return NextResponse.json(existing.rows[0]); // bereits inaktiv -> idempotent OK
}

/**
 * Löscht eine abgeschlossene Track-Session (kaskadiert auf ihre GPS-Punkte).
 * Nur Admins, zusätzlich abgesichert durch erneute Passwort-Bestätigung
 * (des eingeloggten Admins, nicht der Zielperson) - Löschen ist unwiderruflich.
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRegattaSession();
  if (!session.user?.isAdmin) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!password) {
    return NextResponse.json({ error: 'Passwort erforderlich' }, { status: 400 });
  }

  const adminResult = await regattaPool.query('SELECT password_hash FROM person WHERE id = $1', [session.user.id]);
  const adminHash = adminResult.rows[0]?.password_hash;
  const validPassword = adminHash ? await bcrypt.compare(password, adminHash) : false;
  if (!validPassword) {
    return NextResponse.json({ error: 'Falsches Passwort' }, { status: 403 });
  }

  const { id } = await params;
  const result = await regattaPool.query(
    'DELETE FROM track_session WHERE id = $1 AND active = false RETURNING id',
    [id]
  );
  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Nicht gefunden oder noch aktiv' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
