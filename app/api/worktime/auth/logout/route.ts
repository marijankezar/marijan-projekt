import { NextResponse } from 'next/server';
import { getWorktimeSession } from '@/lib/worktime-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const session = await getWorktimeSession();
  session.destroy();
  return NextResponse.json({ ok: true });
}
