import { NextRequest, NextResponse } from 'next/server';
import songPool from '@/db-songs';

// GET /api/songs - Alle Songs oder Suche
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('search') || '';

  try {
    let query: string;
    let params: string[];

    if (search) {
      query = `
        SELECT id, title, author, category
        FROM songs_meta
        WHERE LOWER(title) LIKE LOWER($1) OR LOWER(author) LIKE LOWER($1)
        ORDER BY title
      `;
      params = [`%${search}%`];
    } else {
      query = `
        SELECT id, title, author, category
        FROM songs_meta
        ORDER BY title
      `;
      params = [];
    }

    const result = await songPool.query(query, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Fehler beim Laden der Songs:', error);
    return NextResponse.json([], { status: 200 });
  }
}
