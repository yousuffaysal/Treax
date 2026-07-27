import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { requireViewer } from '@/lib/session';
import { getRailData, getShellBadges } from '@/lib/shell-data';
import { AppShell } from '@/components/layout/app-shell';
import { SignalRush } from './signal-rush';

export const metadata: Metadata = { title: 'Signal Rush' };

/** Signal Rush — the 30-second filter drill. Scores are saved to the leaderboard. */
export default async function GamePage() {
  const viewer = await requireViewer();
  const [badges, rails, leaderboard, best] = await Promise.all([
    getShellBadges(viewer.id),
    getRailData(viewer),
    db.gameScore.findMany({
      orderBy: { score: 'desc' },
      take: 8,
      select: { id: true, score: true, user: { select: { name: true, initials: true, avatarColor: true, avatarUrl: true, } } },
    }),
    db.gameScore.findFirst({ where: { userId: viewer.id }, orderBy: { score: 'desc' }, select: { score: true } }),
  ]);

  return (
    <AppShell viewer={viewer} badges={badges} rails={rails}>
      <SignalRush
        viewer={{ initials: viewer.initials, avatarColor: viewer.avatarColor, avatarUrl: viewer.avatarUrl, name: viewer.name }}
        personalBest={best?.score ?? 0}
        leaderboard={leaderboard}
      />
    </AppShell>
  );
}
