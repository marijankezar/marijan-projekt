import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/db";

// Rate Limiting: max 5 Registrierungen pro IP innerhalb von 15 Minuten
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 Minuten

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// Alte Einträge regelmäßig bereinigen
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 60 * 1000);

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Zu viele Registrierungsversuche. Bitte später erneut versuchen." },
      { status: 429 }
    );
  }

  try {
    const data = await request.json();

    const {
      username,
      passwort, // ⬅️ kommt so vom Client
      email,
      vorname,
      nachname,
      adresse,
      geburtsdatum,
      geschlecht,
    } = data;

    // Pflichtfeldprüfung (passwort statt hashed_passwort!)
    if (!username || !passwort || !email) {
      return NextResponse.json({ error: "Fehlende Pflichtfelder" }, { status: 400 });
    }

    const hashedPw = await bcrypt.hash(passwort, 12); // Serverseitig hashen
    const client = await pool.connect();

    try {
      await client.query(
        `INSERT INTO personlogin
        (username, hashed_passwort, email, vorname, nachname, adresse, geburtsdatum, geschlecht, admin)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0)`,
        [
          username,
          hashedPw, // ⬅️ das gehashte Passwort in die Datenbank
          email,
          vorname,
          nachname,
          adresse,
          geburtsdatum || null, // optionales Feld
          geschlecht,
        ]
      );

      return NextResponse.json({ success: true });
    } catch (e: any) {
      console.error("DB Fehler:", e);
      return NextResponse.json({ error: "Benutzername oder E-Mail bereits vergeben?" }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (error) {
    return NextResponse.json({ error: "Fehler bei der Registrierung" }, { status: 400 });
  }
}
