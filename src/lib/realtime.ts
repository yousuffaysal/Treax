import 'server-only';
import Pusher from 'pusher';
import { hasPusher } from '@/lib/env';

/**
 * Realtime fan-out for messages and notifications.
 *
 * Pusher Channels is the implementation; everything else in the app publishes
 * through `publish()` and subscribes through `useChannel()` in
 * `components/providers/realtime-provider.tsx`. Swapping transports means
 * rewriting these two files only.
 *
 * When Pusher is not configured, publish() is a no-op and the UI falls back to
 * router.refresh() after each mutation — degraded, but never broken.
 */

let client: Pusher | null = null;

function pusher(): Pusher | null {
  if (!hasPusher()) return null;
  if (!client) {
    client = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER || 'ap2',
      useTLS: true,
    });
  }
  return client;
}

export const realtimeAvailable = hasPusher;

/**
 * Channel names are defined in `lib/realtime-names.ts` and re-exported here, so
 * client components can import them without pulling in this module's secret.
 */
export { userChannelName as userChannel, conversationChannelName as conversationChannel } from '@/lib/realtime-names';

export type RealtimeEvent =
  | { name: 'message:new'; data: { conversationId: string; messageId: string; senderId: string; body: string; createdAt: string } }
  | { name: 'message:typing'; data: { conversationId: string; userId: string } }
  | { name: 'notification:new'; data: { id: string; type: string; body: string; targetUrl: string | null } }
  | { name: 'badge:update'; data: { unreadNotifications: number; unreadMessages: number } };

export async function publish(channel: string | string[], event: RealtimeEvent): Promise<void> {
  const p = pusher();
  if (!p) return;
  try {
    await p.trigger(channel, event.name, event.data);
  } catch (err) {
    // A dropped realtime frame must never fail the write that produced it.
    console.error('[realtime] publish failed', err);
  }
}

export function authorizeChannel(socketId: string, channel: string, userId: string) {
  const p = pusher();
  if (!p) throw new Error('Realtime is not configured.');
  return p.authorizeChannel(socketId, channel, { user_id: userId });
}
