import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const ADMIN_ROLES = new Set(['super_admin', 'editor', 'contributor']);

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

  // Decode session for role checks
  const payload = session?.value ? decodeJwtPayload(session.value) : null;

  // Redirect logged-in users away from landing/login/signup
  if ((pathname === '/' || pathname === '/login' || pathname === '/signup') && session?.value) {
    return NextResponse.redirect(new URL('/tree', request.url));
  }

  // Protect admin routes — require valid session AND allowed role
  if (pathname.startsWith('/admin')) {
    if (!session?.value) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
    const role = payload?.role;
    if (!role || !ADMIN_ROLES.has(role)) {
      return NextResponse.redirect(new URL('/tree', request.url));
    }
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
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()'
  );
  res.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: blob: https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co",
      "object-src 'self' data:",
    ].join('; ')
  );

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
};
