import { NextResponse } from 'next/server';
import { getRegattaSession } from '@/lib/regatta-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const session = await getRegattaSession();
  session.destroy();
  return NextResponse.json({ ok: true });
}
