import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { requireViewer } from '@/lib/session';
import { getRailData, getShellBadges } from '@/lib/shell-data';
import { AppShell } from '@/components/layout/app-shell';
import { ThreadList } from './thread-list';

export const metadata: Metadata = { title: 'Messages' };

/**
 * The inbox. Opening a thread raises the docked panel rather than navigating —
 * matching the prototype, where chat floated over whatever screen you were on
 * instead of being a screen of its own.
 *
 * `?to=handle` is still honoured so links from profiles and posts work when
 * they arrive as a full navigation.
 */
export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ to?: string }> }) {
  const viewer = await requireViewer();
  const { to } = await searchParams;

  const [badges, rails, memberships] = await Promise.all([
    getShellBadges(viewer.id),
    getRailData(viewer),
    db.conversationMember.findMany({
      where: { userId: viewer.id },
      select: {
        lastReadAt: true,
        conversation: {
          select: {
            id: true,
            lastMessageAt: true,
            members: {
              where: { userId: { not: viewer.id } },
              select: { user: { select: { id: true, name: true, handle: true, initials: true, avatarColor: true } } },
            },
            messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { body: true, senderId: true, createdAt: true } },
          },
        },
      },
    }),
  ]);

  const threads = memberships
    .map((m) => {
      const other = m.conversation.members[0]?.user;
      const last = m.conversation.messages[0];
      if (!other) return null;
      return {
        id: m.conversation.id,
        other,
        lastBody: last?.body ?? '',
        lastAt: (last?.createdAt ?? m.conversation.lastMessageAt).toISOString(),
        unread: Boolean(last && last.senderId !== viewer.id && (!m.lastReadAt || last.createdAt > m.lastReadAt)),
      };
    })
    .filter((t): t is NonNullable<typeof t> => t !== null)
    .sort((a, b) => b.lastAt.localeCompare(a.lastAt));

  return (
    <AppShell viewer={viewer} badges={badges} rails={rails}>
      <ThreadList threads={threads} openHandle={to ?? null} />
    </AppShell>
  );
}
