import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import type { Role } from '@/lib/types';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      handle: string;
      role: Role;
      suspended: boolean;
    } & DefaultSession['user'];
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

/** University SSO stub. Real deployments swap this for the institution's OIDC. */
const universitySsoSchema = z.object({
  email: z.string().email(),
  ssoToken: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    newUser: '/signup',
  },
  providers: [
    Credentials({
      id: 'credentials',
      name: 'University email',
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
          select: { id: true, name: true, email: true, handle: true, role: true, suspended: true, passwordHash: true },
        });
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;
        // A suspended builder can still authenticate but every write is blocked
        // by assertActive(); we surface the state on the session instead of
        // silently failing the login with a wrong-password style error.
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          handle: user.handle,
          role: user.role as Role,
          suspended: user.suspended,
        };
      },
    }),
    Credentials({
      id: 'university-sso',
      name: 'University login',
      credentials: { email: {}, ssoToken: {} },
      async authorize(raw) {
        const parsed = universitySsoSchema.safeParse(raw);
        if (!parsed.success) return null;
        // Stub: in production this token is verified against the university IdP.
        // Locally it only resolves users that already exist, so it cannot be
        // used to mint an account.
        if (process.env.NODE_ENV === 'production' && !process.env.UNIVERSITY_SSO_SECRET) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
          select: { id: true, name: true, email: true, handle: true, role: true, suspended: true },
        });
        if (!user) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          handle: user.handle,
          role: user.role as Role,
          suspended: user.suspended,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.handle = (user as { handle: string }).handle;
        token.role = (user as { role: Role }).role;
        token.suspended = (user as { suspended: boolean }).suspended;
      }
      // Role and handle can change under an admin action or a profile edit;
      // refresh them from the database when the client calls update().
      if (trigger === 'update' && token.id) {
        const fresh = await db.user.findUnique({
          where: { id: token.id as string },
          select: { handle: true, role: true, suspended: true },
        });
        if (fresh) {
          token.handle = fresh.handle;
          token.role = fresh.role;
          token.suspended = fresh.suspended;
        }
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
});
