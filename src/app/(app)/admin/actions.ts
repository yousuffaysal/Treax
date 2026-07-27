'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { assertAdmin } from '@/lib/session';
import { action, type ActionResult } from '@/lib/action-result';
import { recordAudit } from '@/lib/audit';

/**
 * Admin mutations. Every one of these re-checks the role server-side with
 * assertAdmin() — the middleware guard on /admin is a convenience, not the
 * security boundary, and these actions are reachable from anywhere.
 */

const billboardSchema = z.object({
  imageUrl: z.string().url().nullable(),
  headline: z.string().max(120).optional(),
  cta: z.string().min(1, 'Give the button a label.').max(40),
  link: z.string().max(300),
});

export async function saveBillboard(input: z.infer<typeof billboardSchema>): Promise<ActionResult<undefined>> {
  return action(async () => {
    const admin = await assertAdmin();
    const data = billboardSchema.parse(input);

    await db.billboard.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...data, updatedById: admin.id },
      update: { ...data, updatedById: admin.id },
    });

    await recordAudit(admin.id, 'billboard.update', { type: 'billboard', id: 'singleton' }, { cta: data.cta });

    // The billboard sits in the right rail of every shell page.
    revalidatePath('/', 'layout');
    return undefined;
  });
}
