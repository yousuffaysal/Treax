'use server';

import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import { action, ActionError, type ActionResult } from '@/lib/action-result';
import { assertRole } from '@/lib/session';
import { rateLimit, rateLimitMessage } from '@/lib/rate-limit';
import { initialsOf } from '@/lib/types';
import { HANDLE_RE, NATURAL_FITS, SIGNUP_STAGES, colorFor, normalizeHandle } from '@/lib/handle';

/**
 * Signup is resumable: step 0 creates the account, steps 1 and 2 patch it, and
 * `signupStep` on the row is the source of truth. A refresh mid-flow lands the
 * builder back on the step they had reached rather than at the start.
 */

/** Derives a free handle from a name — "Nusrat Jahan" → nusratjahan, then 2, 3… */
async function claimHandle(name: string): Promise<string> {
  const base = (normalizeHandle(name.replace(/\s+/g, '')) || 'builder').slice(0, 16);
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}${i + 1}`;
    const taken = await db.user.findUnique({ where: { handle: candidate }, select: { id: true } });
    if (!taken) return candidate;
  }
  return `${base}${Date.now().toString(36).slice(-4)}`;
}

const step0Schema = z.object({
  name: z.string().trim().min(2, 'Add your name so people know who you are.').max(60),
  university: z.string().trim().max(80).optional().default(''),
  department: z.string().trim().max(80).optional().default(''),
  gradYear: z.string().trim().max(20).optional().default(''),
  email: z.string().trim().toLowerCase().email('That email does not look right.'),
  password: z.string().min(8, 'Use at least 8 characters.').max(200),
  avatarUrl: z.string().url().nullable().optional(),
});

export type SignupStep0Input = z.input<typeof step0Schema>;

export async function createAccount(input: SignupStep0Input): Promise<ActionResult<{ email: string }>> {
  return action(async () => {
    const limit = rateLimit('auth', `signup:${input.email ?? 'anon'}`);
    if (!limit.allowed) throw new ActionError(rateLimitMessage(limit));

    const data = step0Schema.parse(input);

    const existing = await db.user.findUnique({ where: { email: data.email }, select: { id: true } });
    if (existing) throw new ActionError('An account already uses that email. Sign in instead.');

    const handle = await claimHandle(data.name);
    const passwordHash = await bcrypt.hash(data.password, 12);

    await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        handle,
        passwordHash,
        initials: initialsOf(data.name),
        avatarColor: colorFor(data.email),
        avatarUrl: data.avatarUrl ?? null,
        university: data.university || null,
        department: data.department || null,
        gradYear: data.gradYear || null,
        signupStep: 1,
      },
    });

    return { email: data.email };
  });
}

const step1Schema = z.object({
  stage: z.enum(SIGNUP_STAGES, { errorMap: () => ({ message: 'Pick the one that sounds most like you.' }) }),
});

export async function saveSignupStage(input: z.infer<typeof step1Schema>): Promise<ActionResult<undefined>> {
  return action(async () => {
    const viewer = await assertRole();
    const { stage } = step1Schema.parse(input);
    await db.user.update({
      where: { id: viewer.id },
      data: { stage, signupStep: 2 },
    });
    return undefined;
  });
}

const step2Schema = z.object({
  naturalFit: z.array(z.enum(NATURAL_FITS)).max(NATURAL_FITS.length),
});

export async function saveNaturalFit(input: z.infer<typeof step2Schema>): Promise<ActionResult<undefined>> {
  return action(async () => {
    const viewer = await assertRole();
    const { naturalFit } = step2Schema.parse(input);
    await db.user.update({
      where: { id: viewer.id },
      data: { naturalFit, signupStep: 3 },
    });
    return undefined;
  });
}

/**
 * Password reset. Always reports success so the response cannot be used to
 * discover which emails have accounts.
 */
export async function requestPasswordReset(emailRaw: string): Promise<ActionResult<undefined>> {
  return action(async () => {
    const email = z.string().email('Enter a valid email.').parse(emailRaw.trim().toLowerCase());

    const limit = rateLimit('auth', `reset:${email}`);
    if (!limit.allowed) throw new ActionError(rateLimitMessage(limit));

    const user = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (user) {
      const token = crypto.randomUUID().replace(/-/g, '');
      await db.verificationToken.create({
        data: { identifier: email, token, expires: new Date(Date.now() + 60 * 60 * 1000) },
      });
      // Delivery is the deployment's job — wire an email provider here.
      if (process.env.NODE_ENV !== 'production') {
        console.info(`[reset] ${email} -> /reset-password?token=${token}`);
      }
    }
    return undefined;
  });
}

export async function isHandleAvailable(handleRaw: string, forUserId?: string): Promise<boolean> {
  const handle = normalizeHandle(handleRaw);
  if (!HANDLE_RE.test(handle)) return false;
  const existing = await db.user.findUnique({ where: { handle }, select: { id: true } });
  return !existing || existing.id === forUserId;
}
