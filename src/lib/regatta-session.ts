import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

export interface RegattaUser {
  id: string; // UUID
  displayName: string;
  email: string | null;
  isAdmin: boolean;
}

export const regattaSessionOptions = {
  cookieName: 'regatta_session',
  password: process.env.SESSION_SECRET!,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 8 * 60 * 60,
    path: '/',
  },
  ttl: 8 * 60 * 60, // 8 Stunden
};

export async function getRegattaSession() {
  return getIronSession<{ user?: RegattaUser }>(
    await cookies(),
    regattaSessionOptions
  );
}
