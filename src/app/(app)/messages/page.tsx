import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireViewer } from '@/lib/session';
import { getShellBadges } from '@/lib/shell-data';
import { TopBar } from '@/components/layout/top-bar';
import { openConversation } from './actions';
import { MessagesClient } from './messages-client';

export const metadata: Metadata = { title: 'Messages' };

type Props = { searchParams: Promise<{ c?: string; to?: string }> };

/**
 * Messages. Desktop shows a two-pane layout; below 860px the CSS in
 * globals.css turns the thread into a full-screen sheet.
 */
export default async function MessagesPage({ searchParams }: Props) {
  const viewer = await requireViewer();
  const { c, to } = await searchParams;

  // `?to=handle` comes from "Message" buttons around the app — resolve it to a
  // conversation (creating one if needed) and switch to the canonical URL.
  if (to) {
    const result = await openConversation(to);
    if (result.ok) redirect(`/messages?c=${result.data.conversationId}`);
    redirect('/messages');
  }

  const badges = await getShellBadges(viewer.id);

  const memberships = await db.conversationMember.findMany({
    where: { userId: viewer.id },
    select: {
      conversationId: true,
      lastReadAt: true,
      conversation: {
        select: {
          id: true,
          lastMessageAt: true,
          members: {
            where: { userId: { not: viewer.id } },
            select: { user: { select: { id: true, name: true, handle: true, initials: true, avatarColor: true, building: true } } },
          },
          messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { body: true, senderId: true, createdAt: true } },
        },
      },
    },
  });

  const threads = memberships
    .map((m) => {
      const other = m.conversation.members[0]?.user;
      const last = m.conversation.messages[0];
      const unread = Boolean(last && last.senderId !== viewer.id && (!m.lastReadAt || last.createdAt > m.lastReadAt));
      return {
        id: m.conversation.id,
        other: other ?? null,
        lastBody: last?.body ?? '',
        lastAt: (last?.createdAt ?? m.conversation.lastMessageAt).toISOString(),
        unread,
      };
    })
    .filter((t) => t.other !== null)
    .sort((a, b) => b.lastAt.localeCompare(a.lastAt));

  const activeId = c && threads.some((t) => t.id === c) ? c : (threads[0]?.id ?? null);

  const messages = activeId
    ? await db.message.findMany({
        where: { conversationId: activeId },
        orderBy: { createdAt: 'asc' },
        take: 200,
        select: { id: true, body: true, senderId: true, createdAt: true },
      })
    : [];

  return (
    <>
      <TopBar viewer={viewer} badges={badges} />
      <MessagesClient
        viewer={{ id: viewer.id, initials: viewer.initials, avatarColor: viewer.avatarColor }}
        threads={threads as never}
        activeId={activeId}
        messages={messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))}
      />
    </>
  );
}
