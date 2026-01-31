import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Geschützte Routen, die Login erfordern
const protectedRoutes = ['/dashboard'];

// Session Cookie Name (muss mit session.ts übereinstimmen)
const SESSION_COOKIE_NAME = 'my_app_session';

export async function middleware(request: NextRequest) {
  // WICHTIG: Server Action Requests abfangen und sauber behandeln
  // Diese können von gecachtem Browser-JavaScript kommen und den Server crashen
  const nextAction = request.headers.get('Next-Action');
  if (nextAction) {
    console.log('Server Action Request abgefangen:', nextAction);
    // Leere Antwort zurückgeben statt Server crashen zu lassen
    return new NextResponse(
      JSON.stringify({ error: 'Server Actions sind nicht verfügbar' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const { pathname } = request.nextUrl;

  // API-Routen und statische Dateien überspringen
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/public/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Prüfen ob die Route geschützt ist
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  // Für geschützte Routen: Cookie-Existenz prüfen
  if (isProtectedRoute) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

    // Wenn kein Cookie vorhanden ist, zu Login umleiten
    if (!sessionCookie?.value) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Cookie existiert - die eigentliche Session-Validierung
    // erfolgt im Dashboard Layout (Server Component)
    // Dies ist ein zusätzlicher Schutz gegen direkte URL-Zugriffe
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
