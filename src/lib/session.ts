import { cache } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import type { Locale, Theme } from '@/i18n/config';
import type { Role, Viewer } from '@/lib/types';

/**
 * The three enforcement points the spec asks for are:
 *   1. middleware.ts        — route guard, cheap, JWT-only
 *   2. assertRole()         — every Server Action re-checks against the DB
 *   3. Prisma query scoping — reads filter by the caller's id, never by input
 * This module is (2) and the loader everything else builds on.
 */

const VIEWER_SELECT = {
  id: true,
  name: true,
  handle: true,
  role: true,
  avatarColor: true,
  initials: true,
  building: true,
  university: true,
  streak: true,
  shipCount: true,
  respectCount: true,
  followerCount: true,
  verified: true,
  suspended: true,
  cadence: true,
  onboardingDone: true,
  locale: true,
  theme: true,
} as const;

/** Deduped per request — the shell, page and actions all call this. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: VIEWER_SELECT,
  });
  if (!user) return null;

  return {
    ...user,
    role: user.role as Role,
    locale: user.locale as Locale,
    theme: user.theme as Theme,
  };
});

/** For pages: bounce to /login, preserving where they were headed. */
export async function requireViewer(returnTo?: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(returnTo ? `/login?next=${encodeURIComponent(returnTo)}` : '/login');
  return viewer;
}

export class AuthorizationError extends Error {
  constructor(message = 'You do not have access to this.') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * For Server Actions and Route Handlers. Throws rather than redirecting so the
 * caller can turn it into a typed `{ ok: false }` result.
 */
export async function assertRole(...allowed: Role[]): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) throw new AuthorizationError('Sign in to continue.');
  if (allowed.length && !allowed.includes(viewer.role)) {
    throw new AuthorizationError('You do not have access to this.');
  }
  return viewer;
}

/** Any authenticated, non-suspended builder. Suspended accounts cannot write. */
export async function assertActive(): Promise<Viewer> {
  const viewer = await assertRole();
  if (viewer.suspended) {
    throw new AuthorizationError('Your account is suspended. You cannot post or message right now.');
  }
  return viewer;
}

export async function assertAdmin(): Promise<Viewer> {
  return assertRole('ADMIN');
}

export function isAdmin(viewer: Viewer | null): boolean {
  return viewer?.role === 'ADMIN';
}
