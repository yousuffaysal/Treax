/**
 * Channel names, shared by the server publisher and the browser subscriber.
 *
 * These live apart from `lib/realtime.ts` because that module is `server-only`
 * (it holds the Pusher secret). Client components need the names but must never
 * pull in the publisher.
 */

export const userChannelName = (userId: string) => `private-user-${userId}`;
export const conversationChannelName = (conversationId: string) => `private-conversation-${conversationId}`;
