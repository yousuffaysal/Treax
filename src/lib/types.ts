import type { Locale, Theme } from '@/i18n/config';

export type Role = 'BUILDER' | 'EXPERT' | 'ADMIN';

/** The signed-in user as every shell component needs them. */
export type Viewer = {
  id: string;
  name: string;
  handle: string;
  role: Role;
  avatarColor: string; avatarUrl?: string | null;
  initials: string;
  building: string | null;
  university: string | null;
  streak: number;
  shipCount: number;
  respectCount: number;
  followerCount: number;
  verified: boolean;
  suspended: boolean;
  /** Weekly update goal, chosen in onboarding step 3. */
  cadence: number;
  onboardingDone: boolean;
  locale: Locale;
  theme: Theme;
};

/** Live counters rendered in the top bar; fetched once per request. */
export type ShellBadges = {
  unreadNotifications: number;
  unreadMessages: number;
};

export const POST_TAGS = ['shipped', 'learned', 'failed', 'metric', 'feedback', 'seeking'] as const;
export type PostTag = (typeof POST_TAGS)[number];

/** tagMeta, verbatim from Treax.dc.html:2349-2356 */
export const TAG_META: Record<PostTag, { label: string; dot: string; bg: string }> = {
  shipped: { label: 'Launched', dot: '#2ead4b', bg: 'rgba(46,173,75,.14)' },
  learned: { label: 'Lesson', dot: '#38c8ff', bg: 'rgba(56,200,255,.15)' },
  failed: { label: 'Setback', dot: '#d03238', bg: 'rgba(208,50,56,.14)' },
  metric: { label: 'Milestone', dot: '#ffc091', bg: 'rgba(255,192,145,.22)' },
  feedback: { label: 'Feedback', dot: '#868685', bg: 'rgba(134,134,133,.16)' },
  seeking: { label: 'Looking for', dot: '#8b7bf0', bg: 'rgba(139,123,240,.16)' },
};

/** scoreStyle(), Treax.dc.html:2946-2949 */
export function scoreStyle(score: number): { background: string; color: string } {
  if (score >= 88) return { background: 'rgba(46,173,75,.16)', color: 'var(--positive)' };
  if (score >= 75) return { background: 'rgba(255,192,145,.24)', color: 'var(--warning)' };
  return { background: 'var(--soft)', color: 'var(--body)' };
}

export function initialsOf(name: string): string {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? 'T') + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

/** The prototype prints respects as "3.2k" once past a thousand. */
export function compactCount(n: number): string {
  if (n < 1000) return String(n);
  const k = n / 1000;
  return (k >= 10 ? Math.round(k) : Math.round(k * 10) / 10) + 'k';
}
