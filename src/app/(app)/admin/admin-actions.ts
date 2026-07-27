'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { assertAdmin } from '@/lib/session';
import { action, ActionError, type ActionResult } from '@/lib/action-result';
import { recordAudit } from '@/lib/audit';
import { notify } from '@/lib/notify';

/** Control-room mutations. assertAdmin() runs first in every one. */

export async function setVerified(userId: string, verified: boolean): Promise<ActionResult<undefined>> {
  return action(async () => {
    const admin = await assertAdmin();
    const user = await db.user.update({ where: { id: userId }, data: { verified }, select: { name: true, handle: true } });
    await recordAudit(admin.id, verified ? 'user.verify' : 'user.unverify', { type: 'user', id: userId });
    await notify({
      recipientId: userId,
      actorId: admin.id,
      type: 'VERIFICATION',
      body: verified ? 'You are now a verified builder on Treax.' : 'Your verification was removed.',
      targetUrl: `/u/${user.handle}`,
    });
    revalidatePath('/admin');
    return undefined;
  });
}

export async function setSuspended(userId: string, suspended: boolean): Promise<ActionResult<undefined>> {
  return action(async () => {
    const admin = await assertAdmin();
    if (userId === admin.id) throw new ActionError('You cannot suspend your own account.');

    await db.user.update({
      where: { id: userId },
      data: { suspended, access: suspended ? 'SUSPENDED' : 'MEMBER' },
    });
    await recordAudit(admin.id, suspended ? 'user.suspend' : 'user.unsuspend', { type: 'user', id: userId });
    revalidatePath('/admin');
    revalidatePath('/');
    return undefined;
  });
}

const badgeSchema = z.object({ userId: z.string().min(1), badge: z.string().trim().max(40) });

export async function awardBadge(input: z.infer<typeof badgeSchema>): Promise<ActionResult<undefined>> {
  return action(async () => {
    const admin = await assertAdmin();
    const data = badgeSchema.parse(input);
    const badge = data.badge || null;

    const user = await db.user.update({ where: { id: data.userId }, data: { badge }, select: { name: true, handle: true } });
    await recordAudit(admin.id, badge ? 'user.badge.award' : 'user.badge.remove', { type: 'user', id: data.userId }, { badge });

    if (badge) {
      await notify({
        recipientId: data.userId,
        actorId: admin.id,
        type: 'BADGE',
        body: `You were awarded the “${badge}” badge.`,
        targetUrl: `/u/${user.handle}`,
      });
    }
    revalidatePath('/admin');
    return undefined;
  });
}

const campaignSchema = z.object({
  brand: z.string().trim().min(1, 'Add a brand and a headline first.').max(80),
  title: z.string().trim().min(1, 'Add a brand and a headline first.').max(140),
  body: z.string().trim().max(600),
  cta: z.string().trim().max(40),
  link: z.string().trim().max(300),
  budget: z.number().min(0).max(10_000_000).optional(),
});

export async function createCampaign(input: z.infer<typeof campaignSchema>): Promise<ActionResult<{ id: string }>> {
  return action(async () => {
    const admin = await assertAdmin();
    const data = campaignSchema.parse(input);

    const campaign = await db.adCampaign.create({
      data: {
        brand: data.brand,
        title: data.title,
        body: data.body,
        cta: data.cta || 'Get started',
        link: data.link,
        budget: data.budget ?? 0,
        active: true,
        createdById: admin.id,
      },
      select: { id: true },
    });

    await recordAudit(admin.id, 'campaign.create', { type: 'campaign', id: campaign.id }, { brand: data.brand });
    revalidatePath('/admin');
    revalidatePath('/');
    return { id: campaign.id };
  });
}

export async function toggleCampaign(campaignId: string): Promise<ActionResult<{ active: boolean }>> {
  return action(async () => {
    const admin = await assertAdmin();
    const campaign = await db.adCampaign.findUnique({ where: { id: campaignId }, select: { active: true } });
    if (!campaign) throw new ActionError('That campaign no longer exists.');

    const updated = await db.adCampaign.update({
      where: { id: campaignId },
      data: { active: !campaign.active },
      select: { active: true },
    });
    await recordAudit(admin.id, 'campaign.toggle', { type: 'campaign', id: campaignId }, { active: updated.active });
    revalidatePath('/admin');
    revalidatePath('/');
    return { active: updated.active };
  });
}

export async function reviewModerationItem(itemId: string, accept: boolean, reason?: string): Promise<ActionResult<undefined>> {
  return action(async () => {
    const admin = await assertAdmin();
    await db.moderationItem.update({
      where: { id: itemId },
      data: {
        verdict: accept ? 'ACCEPTED' : 'BOUNCED',
        reason: reason ?? null,
        reviewedById: admin.id,
        reviewedAt: new Date(),
      },
    });
    await recordAudit(admin.id, accept ? 'post.moderate.accept' : 'post.moderate.bounce', { type: 'moderation', id: itemId });
    revalidatePath('/admin');
    return undefined;
  });
}
