import 'server-only';
import { db } from '@/lib/db';
import type { NotificationType } from '@prisma/client';
import { publish, userChannel } from '@/lib/realtime';

/**
 * Creates a notification and pushes it to the recipient's private channel.
 *
 * Realtime failures are swallowed inside publish(), so a dropped socket frame
 * never rolls back the write that produced it — the badge simply catches up on
 * the next render.
 */
export async function notify({
  recipientId,
  actorId,
  type,
  body,
  targetUrl,
}: {
  recipientId: string;
  actorId?: string;
  type: NotificationType;
  body: string;
  targetUrl?: string;
}): Promise<void> {
  const notification = await db.notification.create({
    data: { recipientId, actorId: actorId ?? null, type, body, targetUrl: targetUrl ?? null },
    select: { id: true, type: true, body: true, targetUrl: true },
  });

  await publish(userChannel(recipientId), {
    name: 'notification:new',
    data: {
      id: notification.id,
      type: notification.type,
      body: notification.body,
      targetUrl: notification.targetUrl,
    },
  });
}
