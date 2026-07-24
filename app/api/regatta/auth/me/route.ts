import { NextResponse } from 'next/server';
import { getRegattaSession } from '@/lib/regatta-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getRegattaSession();
  if (!session.user) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
  }
  return NextResponse.json({ user: session.user });
}
