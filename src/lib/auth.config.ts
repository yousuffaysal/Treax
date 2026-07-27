import type { NextAuthConfig } from 'next-auth';
import type { Role } from '@/lib/types';

/**
 * Edge-safe half of the auth configuration.
 *
 * Middleware runs on the Edge runtime, which cannot load Prisma or bcrypt — so
 * the providers (which need both) live in `lib/auth.ts` and only this file is
 * imported by `middleware.ts`.
 *
 * Splitting it this way also means middleware verifies the session through
 * Auth.js itself rather than through `getToken`, which has to re-derive the
 * cookie name and decryption salt by hand. Those differ between HTTP dev and
 * HTTPS production (`authjs.session-token` vs `__Secure-authjs.session-token`),
 * and getting them wrong fails closed: every route would redirect to /login in
 * production only. Letting Auth.js own that detail removes the whole class of
 * bug.
 */
export const authConfig = {
  /**
   * Auth.js refuses to build callback URLs from the request Host header unless
   * the host is trusted, and it only auto-trusts when it detects `VERCEL`. That
   * makes the app fail closed with `UntrustedHost` anywhere else — behind a
   * custom proxy, in Docker, or in a local production build.
   *
   * Trusting it is safe here: this app has no OAuth callbacks (credentials
   * only), and password resets link a relative path rather than a host-derived
   * absolute URL, so a poisoned Host header has nothing to hijack. Set AUTH_URL
   * to pin the origin if the app is ever exposed without a proxy in front.
   */
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    newUser: '/signup',
  },
  // Providers are attached in lib/auth.ts. An empty list here is enough to
  // decode and verify an existing session.
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.handle = (user as { handle: string }).handle;
        token.role = (user as { role: Role }).role;
        token.suspended = (user as { suspended: boolean }).suspended;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
        session.user.handle = token.handle as string;
        session.user.role = token.role as Role;
        session.user.suspended = Boolean(token.suspended);
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
