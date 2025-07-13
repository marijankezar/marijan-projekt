import { NextResponse } from "next/server";
import pool from "@/db";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
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
