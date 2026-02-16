import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const songPool = new Pool({
  connectionString: process.env.SONGS_DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// GET /api/songs/[id] - Einzelner Song mit Text
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const songId = parseInt(id, 10);

  if (isNaN(songId)) {
    return NextResponse.json({ error: 'Ungültige Song-ID' }, { status: 400 });
  }

  try {
    // Song-Metadaten laden
    const metaResult = await songPool.query(
      'SELECT id, title, author, category FROM songs_meta WHERE id = $1',
      [songId]
    );

    if (metaResult.rows.length === 0) {
      return NextResponse.json({ error: 'Song nicht gefunden' }, { status: 404 });
    }

    // Song-Text laden
    const textResult = await songPool.query(
      'SELECT row_num, song_text FROM songs WHERE song_id = $1 ORDER BY row_num',
      [songId]
    );

    return NextResponse.json({
      ...metaResult.rows[0],
      lines: textResult.rows
    });
  } catch (error) {
    console.error('Fehler beim Laden des Songs:', error);
    return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 });
  }
}
