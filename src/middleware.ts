import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from '@/lib/auth.config';

/**
 * Enforcement point 1 of 3: the cheap route guard.
 *
 * This only reads the session cookie — it never touches the database, so it
 * must not be the only check. Server Actions call assertRole() and every read
 * is scoped by the caller's id, so a stale `role` claim cannot grant real
 * access.
 *
 * The session is verified through Auth.js rather than by decoding the cookie
 * by hand; see lib/auth.config.ts for why that matters in production.
 */

const { auth } = NextAuth(authConfig);

const PUBLIC_PREFIXES = ['/login', '/signup', '/forgot-password', '/api/auth', '/ai/filter'];
const ADMIN_PREFIXES = ['/admin'];

function isPublic(pathname: string) {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const session = req.auth;

  if (!session?.user) {
    if (isPublic(pathname)) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  // Signed in: keep them off the login screen. /signup is deliberately NOT
  // redirected here — steps 1 and 2 run authenticated, and the page itself
  // sends anyone who has finished on to the feed.
  if (pathname === '/login') {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (ADMIN_PREFIXES.some((p) => pathname.startsWith(p)) && session.user.role !== 'ADMIN') {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)'],
};
