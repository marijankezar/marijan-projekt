import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import timebookPool from '@/db-timebook';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/timebook/honorarnoten/[id]/bezahlt - Rechnung als bezahlt markieren
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session.user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { bezahlt_am, zahlungsmethode } = body;

    // Prüfen ob Rechnung existiert und nicht storniert ist
    const checkResult = await timebookPool.query(
      `SELECT bezahlt, storniert FROM honorarnoten WHERE id = $1 AND mitarbeiter_id = $2`,
      [id, session.user.id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Rechnung nicht gefunden' }, { status: 404 });
    }

    if (checkResult.rows[0].storniert) {
      return NextResponse.json({ error: 'Stornierte Rechnungen können nicht als bezahlt markiert werden' }, { status: 409 });
    }

    if (checkResult.rows[0].bezahlt) {
      return NextResponse.json({ error: 'Rechnung ist bereits als bezahlt markiert' }, { status: 409 });
    }

    const result = await timebookPool.query(
      `UPDATE honorarnoten SET
        bezahlt = true,
        bezahlt_am = $1,
        zahlungsmethode = $2
      WHERE id = $3 AND mitarbeiter_id = $4
      RETURNING *`,
      [
        bezahlt_am || new Date().toISOString().split('T')[0],
        zahlungsmethode || null,
        id, session.user.id
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Rechnung als bezahlt markiert',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Rechnung bezahlen Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler beim Markieren als bezahlt' },
      { status: 500 }
    );
  }
}

// DELETE /api/timebook/honorarnoten/[id]/bezahlt - Zahlung zurücknehmen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session.user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const result = await timebookPool.query(
      `UPDATE honorarnoten SET
        bezahlt = false,
        bezahlt_am = NULL,
        zahlungsmethode = NULL
      WHERE id = $1 AND mitarbeiter_id = $2 AND storniert = false
      RETURNING *`,
      [id, session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Rechnung nicht gefunden oder storniert' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Zahlung zurückgenommen',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Zahlung zurücknehmen Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler beim Zurücknehmen der Zahlung' },
      { status: 500 }
    );
  }
}
