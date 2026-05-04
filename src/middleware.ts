import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session  = request.cookies.get('session');
  const { pathname } = request.nextUrl;

  // Skip Next.js internals and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/fonts') ||
    pathname.startsWith('/images')
  ) {
    return NextResponse.next();
  }

  // Redirect logged-in users away from landing/login/signup
  if ((pathname === '/' || pathname === '/login' || pathname === '/signup') && session?.value) {
    return NextResponse.redirect(new URL('/tree', request.url));
  }

  // Protect admin routes
  if (pathname.startsWith('/admin') && !session?.value) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Protect member-only routes
  if (
    (pathname.startsWith('/tree') ||
     pathname.startsWith('/profile') ||
     pathname.startsWith('/search') ||
     pathname.startsWith('/settings')) &&
    !session?.value
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();

  // Security headers — allow data: URIs for inline SVGs and object-src
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: blob:",
      "connect-src 'self'",
      "object-src 'self' data:",
    ].join('; ')
  );

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
};
