'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { assertRole } from '@/lib/session';
import { action, type ActionResult } from '@/lib/action-result';

export async function markAllNotificationsRead(): Promise<ActionResult<undefined>> {
  return action(async () => {
    const viewer = await assertRole();
    // Scoped to the caller — an id from the client is never trusted here.
    await db.notification.updateMany({ where: { recipientId: viewer.id, read: false }, data: { read: true } });
    revalidatePath('/notifications');
    revalidatePath('/', 'layout');
    return undefined;
  });
}
