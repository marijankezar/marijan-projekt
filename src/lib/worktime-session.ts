import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

export interface WtUser {
  id: number;
  company_id: number;
  username: string;
  email: string;
  role: 'employee' | 'supervisor' | 'admin';
  first_name?: string;
  last_name?: string;
  lang: string;
}

export const worktimeSessionOptions = {
  cookieName: 'wt_session',
  password: process.env.SESSION_SECRET!,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60,
    path: '/',
  },
  ttl: 60 * 60, // 60 Minuten
};

export async function getWorktimeSession() {
  return getIronSession<{ user?: WtUser }>(
    await cookies(),
    worktimeSessionOptions
  );
}

const roleLevels: Record<string, number> = {
  employee: 0,
  supervisor: 1,
  admin: 2,
};

export function requireRole(user: WtUser, minRole: 'employee' | 'supervisor' | 'admin'): boolean {
  return (roleLevels[user.role] ?? 0) >= (roleLevels[minRole] ?? 0);
}
