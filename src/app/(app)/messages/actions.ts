'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { assertActive } from '@/lib/session';
import { action, ActionError, type ActionResult } from '@/lib/action-result';
import { rateLimit, rateLimitMessage } from '@/lib/rate-limit';
import { conversationChannel, publish, userChannel } from '@/lib/realtime';
import { notify } from '@/lib/notify';

/** Messaging. Membership is always re-checked against the database. */

/** Finds the 1:1 conversation with a builder, creating it on first message. */
export async function openConversation(handle: string): Promise<ActionResult<{ conversationId: string }>> {
  return action(async () => {
    const viewer = await assertActive();

    const other = await db.user.findUnique({ where: { handle }, select: { id: true, suspended: true } });
    if (!other) throw new ActionError('That builder no longer exists.');
    if (other.id === viewer.id) throw new ActionError('You cannot message yourself.');
    if (other.suspended) throw new ActionError('That account is suspended.');

    // A conversation both of us belong to, with exactly two members.
    const existing = await db.conversation.findFirst({
      where: {
        AND: [{ members: { some: { userId: viewer.id } } }, { members: { some: { userId: other.id } } }],
      },
      select: { id: true, members: { select: { userId: true } } },
    });
    const oneToOne = existing && existing.members.length === 2 ? existing : null;
    if (oneToOne) return { conversationId: oneToOne.id };

    const created = await db.conversation.create({
      data: { members: { create: [{ userId: viewer.id }, { userId: other.id }] } },
      select: { id: true },
    });
    return { conversationId: created.id };
  });
}

const sendSchema = z.object({
  conversationId: z.string().min(1),
  body: z.string().trim().min(1, 'Write a message first.').max(4000, 'That message is too long.'),
});

export async function sendMessage(input: z.infer<typeof sendSchema>): Promise<ActionResult<{ id: string; createdAt: string }>> {
  return action(async () => {
    const viewer = await assertActive();

    const limit = rateLimit('message', viewer.id);
    if (!limit.allowed) throw new ActionError(rateLimitMessage(limit));

    const data = sendSchema.parse(input);

    // Membership check: the caller must already belong to this conversation.
    const membership = await db.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId: data.conversationId, userId: viewer.id } },
      select: { id: true },
    });
    if (!membership) throw new ActionError('You are not part of that conversation.');

    const message = await db.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: { conversationId: data.conversationId, senderId: viewer.id, body: data.body },
        select: { id: true, createdAt: true },
      });
      await tx.conversation.update({
        where: { id: data.conversationId },
        data: { lastMessageAt: created.createdAt },
      });
      // Sending also marks the thread read for the sender.
      await tx.conversationMember.update({
        where: { conversationId_userId: { conversationId: data.conversationId, userId: viewer.id } },
        data: { lastReadAt: created.createdAt },
      });
      return created;
    });

    const recipients = await db.conversationMember.findMany({
      where: { conversationId: data.conversationId, userId: { not: viewer.id } },
      select: { userId: true },
    });

    await publish(conversationChannel(data.conversationId), {
      name: 'message:new',
      data: {
        conversationId: data.conversationId,
        messageId: message.id,
        senderId: viewer.id,
        body: data.body,
        createdAt: message.createdAt.toISOString(),
      },
    });

    for (const r of recipients) {
      await publish(userChannel(r.userId), {
        name: 'message:new',
        data: {
          conversationId: data.conversationId,
          messageId: message.id,
          senderId: viewer.id,
          body: data.body,
          createdAt: message.createdAt.toISOString(),
        },
      });
      await notify({
        recipientId: r.userId,
        actorId: viewer.id,
        type: 'MESSAGE',
        body: `${viewer.name} sent you a message.`,
        targetUrl: `/messages?c=${data.conversationId}`,
      });
    }

    revalidatePath('/messages');
    return { id: message.id, createdAt: message.createdAt.toISOString() };
  });
}

export async function markConversationRead(conversationId: string): Promise<ActionResult<undefined>> {
  return action(async () => {
    const viewer = await assertActive();
    const updated = await db.conversationMember.updateMany({
      where: { conversationId, userId: viewer.id },
      data: { lastReadAt: new Date() },
    });
    if (updated.count === 0) throw new ActionError('You are not part of that conversation.');
    revalidatePath('/', 'layout');
    return undefined;
  });
}

/** Broadcasts a typing indicator; deliberately fire-and-forget. */
export async function sendTyping(conversationId: string): Promise<void> {
  try {
    const viewer = await assertActive();
    const membership = await db.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId: viewer.id } },
      select: { id: true },
    });
    if (!membership) return;
    await publish(conversationChannel(conversationId), {
      name: 'message:typing',
      data: { conversationId, userId: viewer.id },
    });
  } catch {
    // Typing indicators are cosmetic.
  }
}
