// lib/session.ts
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

// 👉 Session-Datentyp anpassen
export interface UserSession {
  id: number;
  username: string;
  admin: boolean;
}

export const sessionOptions = {
  cookieName: "my_app_session",
  password: process.env.SESSION_SECRET!,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

export async function getSession() {
  return getIronSession<{ user?: UserSession }>(
    await cookies(),
    sessionOptions
  );
}