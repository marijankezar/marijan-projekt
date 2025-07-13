// file: app/api/fetch-testtab/route.ts
import { NextResponse } from "next/server";
import { createClient } from "../../lib/dbClient";  

export async function GET() {
  const client = createClient();
  await client.connect();

  try {
    const result = await client.query(`
      SELECT id, "timestamp", name, ip, host FROM public.test_tab;
    `);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Database query error:", error);
    return NextResponse.json({ error: "Database query failed" }, { status: 500 });
  } finally {
    await client.end();
  }
}
