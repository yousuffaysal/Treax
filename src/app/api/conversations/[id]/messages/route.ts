import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getViewer } from '@/lib/session';

/** Loads a thread for the chat dock. Membership is checked, never assumed. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const member = await db.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: viewer.id } },
    select: { id: true },
  });
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [messages, other] = await Promise.all([
    db.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
      take: 200,
      select: { id: true, body: true, senderId: true, createdAt: true },
    }),
    db.conversationMember.findFirst({
      where: { conversationId: id, userId: { not: viewer.id } },
      select: { user: { select: { id: true, name: true, handle: true, initials: true, avatarColor: true } } },
    }),
  ]);

  return NextResponse.json({
    other: other?.user ?? null,
    messages: messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
  });
}
