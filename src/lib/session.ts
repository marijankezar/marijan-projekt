import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

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
    // httpOnly verhindert JavaScript-Zugriff (XSS-Schutz)
    httpOnly: true,
    // secure: Cookie nur über HTTPS senden (in Produktion)
    secure: process.env.NODE_ENV === "production",
    // sameSite 'lax': CSRF-Schutz — Cookie nicht bei Cross-Site-Requests gesendet
    sameSite: "lax" as const,
    // Session läuft nach 8 Stunden ab
    maxAge: 60 * 60 * 8,
    // path: Cookie nur für diese App gültig
    path: "/",
  },
  ttl: 60 * 60 * 8,
};

export async function getSession() {
  return getIronSession<{ user?: UserSession }>(
    await cookies(),
    sessionOptions
  );
}
