import { cache } from 'react';
import { db } from '@/lib/db';
import type { RailData } from '@/components/layout/app-shell';
import type { ShellBadges, Viewer } from '@/lib/types';
import { TAG_META } from '@/lib/types';

/**
 * Everything the shell chrome needs, in as few queries as possible.
 * All of it is real: the badges are unread counts, the streak strip is derived
 * from the builder's actual posting days, and the week summary comes from their
 * last seven days of updates rather than the prototype's three fixed lines.
 */

export const getShellBadges = cache(async (viewerId: string): Promise<ShellBadges> => {
  const [unreadNotifications, memberships] = await Promise.all([
    db.notification.count({ where: { recipientId: viewerId, read: false } }),
    db.conversationMember.findMany({
      where: { userId: viewerId },
      select: { conversationId: true, lastReadAt: true },
    }),
  ]);

  if (memberships.length === 0) return { unreadNotifications, unreadMessages: 0 };

  // "Conversations with at least one message I haven't read" — the badge counts
  // threads, not messages, which is what the prototype's "2" represented.
  const unreadMessages = await db.conversation.count({
    where: {
      OR: memberships.map((m) => ({
        id: m.conversationId,
        messages: {
          some: {
            senderId: { not: viewerId },
            ...(m.lastReadAt ? { createdAt: { gt: m.lastReadAt } } : {}),
          },
        },
      })),
    },
  });

  return { unreadNotifications, unreadMessages };
});

const startOfWeek = (now: Date) => {
  const d = new Date(now);
  const day = (d.getDay() + 6) % 7; // Monday = 0, matching the M-T-W-T-F-S-S strip
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
};

export const getRailData = cache(async (viewer: Viewer): Promise<RailData> => {
  const weekStart = startOfWeek(new Date());

  const [billboardRow, weekPosts, topScore] = await Promise.all([
    db.billboard.findUnique({ where: { id: 'singleton' } }),
    db.post.findMany({
      where: { authorId: viewer.id, filterVerdict: 'ACCEPTED', createdAt: { gte: weekStart } },
      select: { tag: true, body: true, createdAt: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    }),
    db.gameScore.findFirst({
      orderBy: { score: 'desc' },
      select: { score: true, user: { select: { name: true } } },
    }),
  ]);

  // Streak strip: one cell per weekday, lit if they posted that day.
  const streakDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    return weekPosts.some((p) => p.createdAt >= day && p.createdAt < next);
  });

  // "Your week, by AI": one line per update, coloured by its tag — the same
  // three-bullet shape as the prototype, now driven by real posts.
  const weekSummary = weekPosts.slice(0, 3).map((p) => ({
    color: TAG_META[p.tag as keyof typeof TAG_META]?.dot ?? 'var(--positive)',
    text: firstSentence(p.body),
  }));

  return {
    billboard: {
      imageUrl: billboardRow?.imageUrl ?? null,
      headline: billboardRow?.headline ?? null,
      cta: billboardRow?.cta ?? 'Learn more',
      link: billboardRow?.link ?? '',
    },
    weekSummary,
    weeklyGoal: { done: weekPosts.length, target: viewer.cadence || 5 },
    champion: topScore ? { name: topScore.user.name, score: topScore.score } : null,
    streakDays,
  };
});

function firstSentence(body: string): string {
  const text = body.trim().split('\n')[0] ?? '';
  const stop = text.search(/[.!?]\s|[.!?]$/);
  const sentence = stop === -1 ? text : text.slice(0, stop + 1);
  return sentence.length > 92 ? `${sentence.slice(0, 89).trimEnd()}…` : sentence;
}
