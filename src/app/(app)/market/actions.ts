'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { assertActive } from '@/lib/session';
import { action, ActionError, type ActionResult } from '@/lib/action-result';
import { notify } from '@/lib/notify';

/**
 * Hiring. A request creates a ServiceRequest, opens (or reuses) a conversation
 * with the seller, posts the opening message, and notifies them — the prototype
 * only flashed a toast.
 */
const hireSchema = z.object({
  serviceId: z.string().min(1),
  note: z.string().trim().max(1000).optional(),
});

export async function requestService(input: z.infer<typeof hireSchema>): Promise<ActionResult<{ conversationId: string }>> {
  return action(async () => {
    const viewer = await assertActive();
    const data = hireSchema.parse(input);

    const service = await db.service.findUnique({
      where: { id: data.serviceId },
      select: { id: true, title: true, active: true, ownerId: true, owner: { select: { name: true, suspended: true } } },
    });
    if (!service || !service.active) throw new ActionError('That service is no longer listed.');
    if (service.ownerId === viewer.id) throw new ActionError('That is your own listing.');
    if (service.owner.suspended) throw new ActionError('That seller is not available right now.');

    const existingRequest = await db.serviceRequest.findFirst({
      where: { serviceId: service.id, requesterId: viewer.id, status: 'PENDING' },
      select: { id: true },
    });
    if (existingRequest) throw new ActionError('You already have a pending request for this service.');

    // Reuse the 1:1 conversation if one exists.
    const existing = await db.conversation.findFirst({
      where: {
        AND: [{ members: { some: { userId: viewer.id } } }, { members: { some: { userId: service.ownerId } } }],
      },
      select: { id: true, members: { select: { userId: true } } },
    });
    const conversationId =
      existing && existing.members.length === 2
        ? existing.id
        : (
            await db.conversation.create({
              data: { members: { create: [{ userId: viewer.id }, { userId: service.ownerId }] } },
              select: { id: true },
            })
          ).id;

    const opening = data.note?.trim() || `Hi — I'd like to request "${service.title}". Is it available?`;

    await db.$transaction([
      db.serviceRequest.create({ data: { serviceId: service.id, requesterId: viewer.id, note: opening } }),
      db.message.create({ data: { conversationId, senderId: viewer.id, body: opening } }),
      db.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date() } }),
    ]);

    await notify({
      recipientId: service.ownerId,
      actorId: viewer.id,
      type: 'SERVICE_REQUEST',
      body: `${viewer.name} requested "${service.title}".`,
      targetUrl: `/messages?c=${conversationId}`,
    });

    revalidatePath('/market');
    return { conversationId };
  });
}
