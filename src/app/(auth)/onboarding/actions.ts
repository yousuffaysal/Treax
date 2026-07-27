'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { assertRole } from '@/lib/session';
import { action, ActionError, type ActionResult } from '@/lib/action-result';
import { HANDLE_RE, normalizeHandle } from '@/lib/handle';

/** Onboarding steps persist one at a time — Treax.dc.html:1907-1930. */

const skillsSchema = z.object({
  skills: z.array(z.string().trim().min(1).max(40)).min(1, 'Pick at least one skill.').max(10),
});

export async function saveSkills(input: z.infer<typeof skillsSchema>): Promise<ActionResult<undefined>> {
  return action(async () => {
    const viewer = await assertRole();
    const { skills } = skillsSchema.parse(input);
    await db.user.update({
      where: { id: viewer.id },
      data: { tags: skills, focus: skills[0], onboardingStep: 1 },
    });
    return undefined;
  });
}

const handleSchema = z.object({
  building: z.string().trim().max(120),
  handle: z.string().trim(),
});

export async function saveHandleAndProject(input: z.infer<typeof handleSchema>): Promise<ActionResult<{ handle: string }>> {
  return action(async () => {
    const viewer = await assertRole();
    const parsed = handleSchema.parse(input);
    const handle = normalizeHandle(parsed.handle);

    if (!HANDLE_RE.test(handle)) {
      throw new ActionError('Handles are 3-20 characters: letters, numbers and underscores.');
    }

    const taken = await db.user.findUnique({ where: { handle }, select: { id: true } });
    if (taken && taken.id !== viewer.id) throw new ActionError('That handle is taken. Try another.');

    await db.user.update({
      where: { id: viewer.id },
      data: { handle, building: parsed.building || null, onboardingStep: 2 },
    });

    revalidatePath('/', 'layout');
    return { handle };
  });
}

const cadenceSchema = z.object({ cadence: z.union([z.literal(3), z.literal(5), z.literal(7)]) });

export async function finishOnboarding(input: z.infer<typeof cadenceSchema>): Promise<ActionResult<undefined>> {
  return action(async () => {
    const viewer = await assertRole();
    const { cadence } = cadenceSchema.parse(input);
    await db.user.update({
      where: { id: viewer.id },
      data: { cadence, onboardingStep: 3, onboardingDone: true, signupStep: 3 },
    });
    revalidatePath('/', 'layout');
    return undefined;
  });
}

/** "Skip for now" still marks onboarding done so the app stops redirecting. */
export async function skipOnboarding(): Promise<ActionResult<undefined>> {
  return action(async () => {
    const viewer = await assertRole();
    await db.user.update({
      where: { id: viewer.id },
      data: { onboardingDone: true, signupStep: 3 },
    });
    revalidatePath('/', 'layout');
    return undefined;
  });
}

export async function checkHandle(handleRaw: string): Promise<{ available: boolean; normalized: string }> {
  const viewer = await assertRole();
  const normalized = normalizeHandle(handleRaw);
  if (!HANDLE_RE.test(normalized)) return { available: false, normalized };
  const existing = await db.user.findUnique({ where: { handle: normalized }, select: { id: true } });
  return { available: !existing || existing.id === viewer.id, normalized };
}
