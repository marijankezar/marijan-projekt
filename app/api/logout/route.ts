import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

// Explizit Node.js Runtime verwenden
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const session = await getSession();
    await session.destroy();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: true }); // Trotzdem success, damit Client weiterleitet
  }
}