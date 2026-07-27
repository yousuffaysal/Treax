'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { assertActive } from '@/lib/session';
import { action, ActionError, type ActionResult } from '@/lib/action-result';
import { notify } from '@/lib/notify';

const bookingSchema = z.object({
  expertId: z.string().min(1),
  slot: z.string().trim().max(60),
  note: z.string().trim().max(1000).optional(),
});

export async function requestBooking(input: z.infer<typeof bookingSchema>): Promise<ActionResult<undefined>> {
  return action(async () => {
    const viewer = await assertActive();
    const data = bookingSchema.parse(input);

    const expert = await db.expert.findUnique({
      where: { id: data.expertId },
      select: { id: true, active: true, userId: true, user: { select: { name: true } } },
    });
    if (!expert || !expert.active) throw new ActionError('That expert is not taking sessions right now.');
    if (expert.userId === viewer.id) throw new ActionError('You cannot book yourself.');

    const pending = await db.booking.findFirst({
      where: { expertId: expert.id, userId: viewer.id, status: 'REQUESTED' },
      select: { id: true },
    });
    if (pending) throw new ActionError('You already have a pending request with this expert.');

    await db.booking.create({
      data: { expertId: expert.id, userId: viewer.id, slot: data.slot, note: data.note ?? null },
    });

    await notify({
      recipientId: expert.userId,
      actorId: viewer.id,
      type: 'BOOKING',
      body: `${viewer.name} requested a session for ${data.slot}.`,
      targetUrl: `/u/${viewer.handle}`,
    });

    revalidatePath('/experts');
    return undefined;
  });
}
