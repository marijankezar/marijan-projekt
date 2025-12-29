import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import pool from "@/db";

export async function GET() {
  const session = await getSession();

  if (!session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await pool.connect();
  try {
    const res = await client.query("SELECT id, vorname, nachname, email FROM person");
    return NextResponse.json(res.rows);
  } finally {
    client.release();
  }
}
