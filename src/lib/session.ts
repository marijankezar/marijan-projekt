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
    // Session läuft nach 8 Stunden ab
    maxAge: 60 * 60 * 8, // 8 Stunden in Sekunden
  },
  // TTL für die Session (8 Stunden)
  ttl: 60 * 60 * 8,
};

export async function getSession() {
  return getIronSession<{ user?: UserSession }>(
    await cookies(),
    sessionOptions
  );
}