import { cache } from 'react';
import { db } from '@/lib/db';
import type { PostTag } from '@/lib/types';

/**
 * Feed reads. Only ACCEPTED posts are ever returned — a rejected post is never
 * written in the first place, but the filter is part of the index too so a
 * future moderation bounce disappears from the feed immediately.
 */

export const FEED_FILTERS = ['foryou', 'shipped', 'learned', 'failed', 'metric', 'seeking', 'following'] as const;
export type FeedFilter = (typeof FEED_FILTERS)[number];

export function isFeedFilter(value: unknown): value is FeedFilter {
  return typeof value === 'string' && (FEED_FILTERS as readonly string[]).includes(value);
}

export const PAGE_SIZE = 12;

export type FeedAuthor = {
  id: string;
  name: string;
  handle: string;
  initials: string;
  avatarColor: string; avatarUrl?: string | null;
  verified: boolean;
  building: string | null;
};

export type FeedPost = {
  id: string;
  body: string;
  tag: PostTag;
  shipScore: number;
  imageUrl: string | null;
  metrics: Array<{ value: string; label: string }> | null;
  respectCount: number;
  commentCount: number;
  repostCount: number;
  createdAt: Date;
  author: FeedAuthor;
  respected: boolean;
};

export type FeedAd = {
  id: string;
  brand: string;
  title: string;
  body: string;
  cta: string;
  link: string;
  initials: string;
};

export type FeedRow = { kind: 'post'; post: FeedPost } | { kind: 'ad'; ad: FeedAd };

const AUTHOR_SELECT = {
  id: true,
  name: true,
  handle: true,
  initials: true,
  avatarColor: true, avatarUrl: true,
  verified: true,
  building: true,
} as const;

/**
 * Cursor pagination on (createdAt, id). Offset pagination would skip or repeat
 * rows as new posts land at the head of the feed, which is exactly what happens
 * here while someone is scrolling.
 */
export async function getFeed({
  viewerId,
  filter,
  cursor,
  take = PAGE_SIZE,
}: {
  viewerId: string;
  filter: FeedFilter;
  cursor?: string;
  take?: number;
}): Promise<{ posts: FeedPost[]; nextCursor: string | null }> {
  const tagFilter: PostTag | undefined =
    filter === 'foryou' || filter === 'following' ? undefined : (filter as PostTag);

  // "Following" narrows to people the viewer follows, plus their own posts so
  // the tab is never empty for someone who has just joined.
  let authorFilter: { authorId: { in: string[] } } | undefined;
  if (filter === 'following') {
    const following = await db.follow.findMany({
      where: { followerId: viewerId },
      select: { followingId: true },
    });
    authorFilter = { authorId: { in: [...following.map((f) => f.followingId), viewerId] } };
  }

  const rows = await db.post.findMany({
    where: {
      filterVerdict: 'ACCEPTED',
      author: { suspended: false },
      ...(tagFilter ? { tag: tagFilter } : {}),
      ...(authorFilter ?? {}),
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      body: true,
      tag: true,
      shipScore: true,
      imageUrl: true,
      metrics: true,
      respectCount: true,
      commentCount: true,
      repostCount: true,
      createdAt: true,
      author: { select: AUTHOR_SELECT },
      // Scoped to the viewer: whether *they* respected it, not whether anyone did.
      respects: { where: { userId: viewerId }, select: { id: true }, take: 1 },
    },
  });

  const hasMore = rows.length > take;
  const page = hasMore ? rows.slice(0, take) : rows;

  return {
    posts: page.map((row) => ({
      id: row.id,
      body: row.body,
      tag: row.tag as PostTag,
      shipScore: row.shipScore,
      imageUrl: row.imageUrl,
      metrics: (row.metrics as FeedPost['metrics']) ?? null,
      respectCount: row.respectCount,
      commentCount: row.commentCount,
      repostCount: row.repostCount,
      createdAt: row.createdAt,
      author: row.author,
      respected: row.respects.length > 0,
    })),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
}

/**
 * Injects one sponsored slot at index 2 — the position withFeedAd() used
 * (Treax.dc.html:3146-3158). Only runs on the first page, so scrolling does not
 * repeat the same campaign down the column.
 */
export async function withFeedAd(posts: FeedPost[], isFirstPage: boolean): Promise<FeedRow[]> {
  const rows: FeedRow[] = posts.map((post) => ({ kind: 'post', post }));
  if (!isFirstPage || rows.length < 2) return rows;

  const campaign = await db.adCampaign.findFirst({
    where: { active: true },
    orderBy: { createdAt: 'asc' },
    select: { id: true, brand: true, title: true, body: true, cta: true, link: true },
  });
  if (!campaign) return rows;

  rows.splice(2, 0, {
    kind: 'ad',
    ad: {
      ...campaign,
      initials: campaign.brand
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase(),
    },
  });
  return rows;
}

/** Relative time in the prototype's shape: "2h", "3d", "now". */
export function relativeTime(date: Date, now = new Date()): string {
  const seconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;
  return `${Math.floor(days / 30)}mo`;
}

export const getPostById = cache(async (id: string, viewerId: string) => {
  const row = await db.post.findFirst({
    where: { id, filterVerdict: 'ACCEPTED' },
    select: {
      id: true,
      body: true,
      tag: true,
      shipScore: true,
      imageUrl: true,
      metrics: true,
      respectCount: true,
      commentCount: true,
      repostCount: true,
      createdAt: true,
      author: { select: { ...AUTHOR_SELECT, bio: true, focus: true, university: true, followerCount: true } },
      respects: { where: { userId: viewerId }, select: { id: true }, take: 1 },
      comments: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          body: true,
          createdAt: true,
          author: { select: { id: true, name: true, handle: true, initials: true, avatarColor: true, avatarUrl: true, } },
        },
      },
    },
  });
  if (!row) return null;
  return { ...row, respected: row.respects.length > 0 };
});

export async function getComments(postId: string) {
  return db.comment.findMany({
    where: { postId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      body: true,
      createdAt: true,
      author: { select: { id: true, name: true, handle: true, initials: true, avatarColor: true, avatarUrl: true, } },
    },
  });
}
