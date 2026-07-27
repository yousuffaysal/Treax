'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { assertActive } from '@/lib/session';
import { action, ActionError, type ActionResult } from '@/lib/action-result';
import { rateLimit, rateLimitMessage } from '@/lib/rate-limit';
import { analyze } from '@/lib/ai/filter';
import { notify } from '@/lib/notify';
import type { PostTag } from '@/lib/types';
import { POST_TAGS } from '@/lib/types';

/** Post, respect and comment mutations. Every one re-checks the caller. */

const MAX_BODY = 4000;

const publishSchema = z.object({
  body: z.string().trim().min(1, 'Write something first.').max(MAX_BODY, 'That update is too long.'),
  imageUrl: z.string().url().nullable().optional(),
  /** The builder may override the AI's tag before posting. */
  tag: z.enum(POST_TAGS).optional(),
});

export type FilterCheck =
  | { ok: true; tag: PostTag; score: number }
  | { ok: false; reason: string; suggestion: string };

/**
 * Runs the filter without publishing — this is what the "Run AI check" button
 * calls, so the builder sees the verdict before committing.
 */
export async function checkUpdate(bodyRaw: string): Promise<ActionResult<FilterCheck>> {
  return action(async () => {
    const viewer = await assertActive();

    const limit = rateLimit('filter', viewer.id);
    if (!limit.allowed) throw new ActionError(rateLimitMessage(limit));

    const body = z.string().trim().min(1, 'Write something first.').max(MAX_BODY).parse(bodyRaw);
    const verdict = await analyze(body);

    return verdict.ok
      ? { ok: true as const, tag: verdict.tag, score: verdict.score }
      : { ok: false as const, reason: verdict.reason, suggestion: verdict.suggestion };
  });
}

/**
 * Publishes an update. The filter runs again here rather than trusting the
 * result the client received from checkUpdate — otherwise anyone could POST
 * straight past it.
 */
export async function publishUpdate(input: z.infer<typeof publishSchema>): Promise<ActionResult<{ id: string }>> {
  return action(async () => {
    const viewer = await assertActive();

    const limit = rateLimit('post', viewer.id);
    if (!limit.allowed) throw new ActionError(rateLimitMessage(limit));

    const data = publishSchema.parse(input);
    const verdict = await analyze(data.body);

    if (!verdict.ok) {
      // Record the bounce so moderation can see what the filter is rejecting,
      // then refuse. A rejected post is never written to Post.
      await db.moderationItem.create({
        data: {
          kind: 'post',
          subjectUserId: viewer.id,
          verdict: 'BOUNCED',
          reason: verdict.reason,
        },
      });
      throw new ActionError(verdict.reason);
    }

    // The builder can re-tag an accepted post, but cannot invent a verdict.
    const tag = data.tag ?? verdict.tag;

    const post = await db.$transaction(async (tx) => {
      const created = await tx.post.create({
        data: {
          authorId: viewer.id,
          body: data.body,
          tag,
          imageUrl: data.imageUrl ?? null,
          shipScore: verdict.score,
          filterVerdict: 'ACCEPTED',
          filterSource: verdict.source,
        },
        select: { id: true },
      });

      // Counters move in the same transaction as the row that changes them.
      await tx.user.update({
        where: { id: viewer.id },
        data: { shipCount: { increment: 1 }, lastPostedAt: new Date() },
      });

      return created;
    });

    revalidatePath('/');
    revalidatePath(`/u/${viewer.handle}`);
    return { id: post.id };
  });
}

/** Respect toggle. The unique index on (userId, postId) makes this idempotent. */
export async function toggleRespect(postId: string): Promise<ActionResult<{ respected: boolean; count: number }>> {
  return action(async () => {
    const viewer = await assertActive();

    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true, author: { select: { handle: true } } },
    });
    if (!post) throw new ActionError('That update no longer exists.');

    const existing = await db.respect.findUnique({
      where: { userId_postId: { userId: viewer.id, postId } },
      select: { id: true },
    });

    const result = await db.$transaction(async (tx) => {
      if (existing) {
        await tx.respect.delete({ where: { id: existing.id } });
        const updated = await tx.post.update({
          where: { id: postId },
          data: { respectCount: { decrement: 1 } },
          select: { respectCount: true },
        });
        await tx.user.update({ where: { id: post.authorId }, data: { respectCount: { decrement: 1 } } });
        return { respected: false, count: updated.respectCount };
      }

      await tx.respect.create({ data: { userId: viewer.id, postId } });
      const updated = await tx.post.update({
        where: { id: postId },
        data: { respectCount: { increment: 1 } },
        select: { respectCount: true },
      });
      await tx.user.update({ where: { id: post.authorId }, data: { respectCount: { increment: 1 } } });
      return { respected: true, count: updated.respectCount };
    });

    // Don't notify people about their own activity.
    if (result.respected && post.authorId !== viewer.id) {
      await notify({
        recipientId: post.authorId,
        actorId: viewer.id,
        type: 'RESPECT',
        body: `${viewer.name} respected your update.`,
        targetUrl: `/p/${postId}`,
      });
    }

    return result;
  });
}

const commentSchema = z.object({
  postId: z.string().min(1),
  body: z.string().trim().min(1, 'Write a reply first.').max(1000, 'That reply is too long.'),
});

export async function addComment(input: z.infer<typeof commentSchema>): Promise<ActionResult<{ id: string }>> {
  return action(async () => {
    const viewer = await assertActive();

    const limit = rateLimit('comment', viewer.id);
    if (!limit.allowed) throw new ActionError(rateLimitMessage(limit));

    const data = commentSchema.parse(input);

    const post = await db.post.findUnique({ where: { id: data.postId }, select: { id: true, authorId: true } });
    if (!post) throw new ActionError('That update no longer exists.');

    const comment = await db.$transaction(async (tx) => {
      const created = await tx.comment.create({
        data: { postId: data.postId, authorId: viewer.id, body: data.body },
        select: { id: true },
      });
      await tx.post.update({ where: { id: data.postId }, data: { commentCount: { increment: 1 } } });
      return created;
    });

    if (post.authorId !== viewer.id) {
      await notify({
        recipientId: post.authorId,
        actorId: viewer.id,
        type: 'COMMENT',
        body: `${viewer.name} replied to your update.`,
        targetUrl: `/p/${data.postId}`,
      });
    }

    revalidatePath('/');
    return { id: comment.id };
  });
}

/** Follow toggle, used from profiles and the team page. */
export async function toggleFollow(targetId: string): Promise<ActionResult<{ following: boolean }>> {
  return action(async () => {
    const viewer = await assertActive();
    if (targetId === viewer.id) throw new ActionError('You cannot follow yourself.');

    const target = await db.user.findUnique({ where: { id: targetId }, select: { id: true, handle: true } });
    if (!target) throw new ActionError('That builder no longer exists.');

    const existing = await db.follow.findUnique({
      where: { followerId_followingId: { followerId: viewer.id, followingId: targetId } },
      select: { id: true },
    });

    const following = await db.$transaction(async (tx) => {
      if (existing) {
        await tx.follow.delete({ where: { id: existing.id } });
        await tx.user.update({ where: { id: targetId }, data: { followerCount: { decrement: 1 } } });
        return false;
      }
      await tx.follow.create({ data: { followerId: viewer.id, followingId: targetId } });
      await tx.user.update({ where: { id: targetId }, data: { followerCount: { increment: 1 } } });
      return true;
    });

    if (following) {
      await notify({
        recipientId: targetId,
        actorId: viewer.id,
        type: 'FOLLOW',
        body: `${viewer.name} started following you.`,
        targetUrl: `/u/${viewer.handle}`,
      });
    }

    revalidatePath(`/u/${target.handle}`);
    return { following };
  });
}

/** Records a sponsored-slot click and follows the link. */
export async function recordAdClick(campaignId: string): Promise<ActionResult<{ link: string }>> {
  return action(async () => {
    const viewer = await assertActive();
    const campaign = await db.adCampaign.findUnique({ where: { id: campaignId }, select: { link: true } });
    if (!campaign) throw new ActionError('That campaign is no longer running.');

    await db.$transaction([
      db.adCampaign.update({ where: { id: campaignId }, data: { clicks: { increment: 1 } } }),
      db.adEvent.create({ data: { campaignId, userId: viewer.id, type: 'CLICK' } }),
    ]);

    return { link: campaign.link };
  });
}

/** Records that a sponsored slot was rendered to this viewer. */
export async function recordAdImpression(campaignId: string): Promise<void> {
  try {
    const viewer = await assertActive();
    await db.$transaction([
      db.adCampaign.update({ where: { id: campaignId }, data: { impressions: { increment: 1 } } }),
      db.adEvent.create({ data: { campaignId, userId: viewer.id, type: 'IMPRESSION' } }),
    ]);
  } catch {
    // Metrics must never break the feed.
  }
}
