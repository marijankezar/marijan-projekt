import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import pool from "@/db";

const MAX_VERSUCHE = 3;
const SPERRZEIT_MINUTEN = 5;

export async function POST(request: Request) {
  try {
    const { username, passwort } = await request.json();

    if (!username || !passwort) {
      return NextResponse.json({ error: "Fehlende Daten" }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      const result = await client.query(
        "SELECT id, username, hashed_passwort, admin, login_versuche, letzte_login_sperre FROM personlogin WHERE username = $1",
        [username]
      );

      if (result.rowCount !== 1) {
        return NextResponse.json({ error: "Ungültiger Benutzername" }, { status: 401 });
      }

      const user = result.rows[0];
      const now = new Date();

      // Prüfung: gesperrt?
      if (
        user.letzte_login_sperre &&
        new Date(user.letzte_login_sperre).getTime() + SPERRZEIT_MINUTEN * 60000 > now.getTime()
      ) {
        return NextResponse.json({ error: `Konto gesperrt bis ${new Date(user.letzte_login_sperre).toLocaleTimeString("de-DE")}` }, { status: 403 });
      }

      // Passwortprüfung mit bcrypt
      const bcrypt = await import("bcryptjs");
      const pwOK = await bcrypt.compare(passwort, user.hashed_passwort);

      if (!pwOK) {
        const neueVersuche = (user.login_versuche ?? 0) + 1;

        // Wenn zu viele Versuche → Sperre setzen
        if (neueVersuche >= MAX_VERSUCHE) {
          await client.query(
            "UPDATE personlogin SET login_versuche = $1, letzte_login_sperre = NOW() WHERE id = $2",
            [neueVersuche, user.id]
          );
          return NextResponse.json({ error: "Konto wurde für 5 Minuten gesperrt" }, { status: 403 });
        } else {
          await client.query(
            "UPDATE personlogin SET login_versuche = $1 WHERE id = $2",
            [neueVersuche, user.id]
          );
          return NextResponse.json({ error: "Passwort falsch" }, { status: 401 });
        }
      }

      // Login erfolgreich → Zurücksetzen
      await client.query(
        "UPDATE personlogin SET login_versuche = 0, letzte_login_sperre = NULL WHERE id = $1",
        [user.id]
      );

      const session = await getSession();
      session.user = {
        id: user.id,
        username: user.username,
        admin: user.admin === 1,
      };
      await session.save();

      return NextResponse.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Login-Fehler:", error);
    return NextResponse.json({ error: "Login fehlgeschlagen" }, { status: 400 });
  }
}
