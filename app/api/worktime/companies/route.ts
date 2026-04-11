import { NextResponse } from 'next/server';
import worktimePool from '@/db-worktime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Öffentlicher Endpunkt — nur für Registrierungsformular
export async function GET() {
  const result = await worktimePool.query(
    'SELECT id, name FROM wt_companies WHERE active = true ORDER BY name'
  );
  return NextResponse.json(result.rows);
}
