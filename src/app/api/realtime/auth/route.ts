import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getViewer } from '@/lib/session';
import { authorizeChannel, conversationChannel, realtimeAvailable, userChannel } from '@/lib/realtime';

/**
 * Pusher private-channel authorisation.
 *
 * A client may only subscribe to its own user channel, or to a conversation it
 * is actually a member of — both checked against the database, never against
 * anything the client sent.
 */
export async function POST(req: Request) {
  if (!realtimeAvailable()) return NextResponse.json({ error: 'Realtime is not configured.' }, { status: 503 });

  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const socketId = String(form?.get('socket_id') ?? '');
  const channel = String(form?.get('channel_name') ?? '');
  if (!socketId || !channel) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

  if (channel === userChannel(viewer.id)) {
    return NextResponse.json(authorizeChannel(socketId, channel, viewer.id));
  }

  const conversationId = channel.startsWith('private-conversation-') ? channel.slice('private-conversation-'.length) : null;
  if (conversationId) {
    const member = await db.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId: viewer.id } },
      select: { id: true },
    });
    if (member && channel === conversationChannel(conversationId)) {
      return NextResponse.json(authorizeChannel(socketId, channel, viewer.id));
    }
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
