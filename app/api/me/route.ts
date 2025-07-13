import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET() {
  console.log("GET /api/me aufgerufen");

  const session = await getSession();

  if (!session.user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user: session.user });
}
