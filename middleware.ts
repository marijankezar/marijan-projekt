import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { unsealData } from 'iron-session';

// Geschützte Routen, die Login erfordern
const protectedRoutes = ['/dashboard'];

// Session Konfiguration (muss mit session.ts übereinstimmen)
const SESSION_COOKIE_NAME = 'my_app_session';
const SESSION_PASSWORD = process.env.SESSION_SECRET!;

interface UserSession {
  user?: {
    id: number;
    username: string;
    admin: boolean;
  };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API-Routen überspringen (diese haben eigene Auth-Checks)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Prüfen ob die Route geschützt ist
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  // Für geschützte Routen: Session prüfen
  if (isProtectedRoute) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
      // Keine Session vorhanden - redirect zu Login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      // Session-Cookie mit iron-session entschlüsseln und verifizieren
      const session = await unsealData<UserSession>(sessionCookie.value, {
        password: SESSION_PASSWORD,
        ttl: 60 * 10, // 10 Minuten - muss mit session.ts übereinstimmen
      });

      if (!session.user) {
        // Keine User-Daten in der Session
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Session ist gültig - Anfrage durchlassen
      return NextResponse.next();
    } catch (error) {
      // Session konnte nicht entschlüsselt werden (abgelaufen oder manipuliert)
      console.error('Middleware Session Error:', error);
      const loginUrl = new URL('/login', request.url);

      // Ungültiges Cookie löschen
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
