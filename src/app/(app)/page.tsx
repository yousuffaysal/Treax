import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { requireViewer } from '@/lib/session';
import { getRailData, getShellBadges } from '@/lib/shell-data';
import { AppShell } from '@/components/layout/app-shell';
import { MobileTools } from '@/components/layout/mobile-tools';
import { FeedClient } from '@/components/feed/feed-client';
import { FeedSkeleton } from '@/components/feed/feed-skeleton';
import { getFeed, isFeedFilter, withFeedAd, type FeedFilter } from '@/lib/feed';

export default async function FeedPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const viewer = await requireViewer();
  const [badges, rails] = await Promise.all([getShellBadges(viewer.id), getRailData(viewer)]);
  const { filter: filterParam } = await searchParams;
  const filter = isFeedFilter(filterParam) ? filterParam : 'foryou';

  return (
    <AppShell viewer={viewer} badges={badges} rails={rails}>
      <MobileTools />
      {/* The rows stream in so the composer and tabs paint immediately. */}
      <Suspense key={filter} fallback={<FeedSkeleton />}>
        <FeedRows viewerId={viewer.id} filter={filter} viewer={viewer} />
      </Suspense>
    </AppShell>
  );
}

async function FeedRows({
  viewerId,
  filter,
  viewer,
}: {
  viewerId: string;
  filter: FeedFilter;
  viewer: { id: string; name: string; initials: string; avatarColor: string; avatarUrl?: string | null; building: string | null };
}) {
  const t = await getTranslations();
  const { posts } = await getFeed({ viewerId, filter });
  const rows = await withFeedAd(posts, true);

  return (
    <FeedClient
      viewer={{
        id: viewer.id,
        name: viewer.name,
        initials: viewer.initials,
        avatarColor: viewer.avatarColor, avatarUrl: viewer.avatarUrl,
        building: viewer.building,
      }}
      rows={rows}
      filter={filter}
      shareLabel={t('share')}
      labels={{
        launched: t('launched'),
        lesson: t('lesson'),
        setback: t('setback'),
        foryou: t('foryou'),
        lessons: t('lessons'),
        setbacks: t('setbacks'),
        milestones: t('milestones'),
        cofounders: t('cofounders'),
        following: t('following'),
      }}
    />
  );
}
