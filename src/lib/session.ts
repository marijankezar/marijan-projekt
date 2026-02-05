// lib/session.ts
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

// 👉 Session-Datentyp anpassen
export interface UserSession {
  id: number;
  username: string;
  admin: boolean;
  email?: string;
  vorname?: string;
  nachname?: string;
}

export const sessionOptions = {
  cookieName: "my_app_session",
  password: process.env.SESSION_SECRET!,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    // Session läuft nach 10 Minuten ab (600 Sekunden)
    maxAge: 60 * 10, // 10 Minuten in Sekunden
  },
  // TTL für die Session (10 Minuten)
  ttl: 60 * 10,
};

export async function getSession() {
  return getIronSession<{ user?: UserSession }>(
    await cookies(),
    sessionOptions
  );
}