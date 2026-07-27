import type { ReactNode } from 'react';
import { TopBar } from '@/components/layout/top-bar';
import { LeftRail } from '@/components/layout/left-rail';
import { RightRail, type WeekSummaryLine } from '@/components/layout/right-rail';
import type { BillboardData } from '@/components/layout/billboard-card';
import type { ShellBadges, Viewer } from '@/lib/types';

export type RailData = {
  billboard: BillboardData;
  weekSummary: WeekSummaryLine[];
  weeklyGoal: { done: number; target: number };
  champion: { name: string; score: number } | null;
  streakDays: boolean[];
};

/**
 * Three-column app shell — port of Treax.dc.html:406 (`.sl-grid`).
 *
 * 250px / 1fr / 320px at 1216px max width. The right rail drops at 1100px and
 * the left rail at 860px; both are pure CSS so this markup is breakpoint-free.
 * Pages that need the full width (AI studio, reader, admin, agent) skip the
 * shell's grid and render inside `.sl-wrap` instead — see `AppShell.Wide`.
 */
export function AppShell({
  viewer,
  badges,
  rails,
  children,
}: {
  viewer: Viewer;
  badges: ShellBadges;
  rails: RailData;
  children: ReactNode;
}) {
  return (
    <>
      <TopBar viewer={viewer} badges={badges} />
      <div className="sl-grid">
        <LeftRail viewer={viewer} />
        <main style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>{children}</main>
        <RightRail
          viewer={viewer}
          billboard={rails.billboard}
          weekSummary={rails.weekSummary}
          weeklyGoal={rails.weeklyGoal}
          champion={rails.champion}
          streakDays={rails.streakDays}
        />
      </div>
    </>
  );
}

/** Full-bleed variant: top bar only, content centred in `.sl-wrap`. */
export function WideShell({
  viewer,
  badges,
  children,
  maxWidth = 1120,
  padding = '56px 32px 96px',
}: {
  viewer: Viewer;
  badges: ShellBadges;
  children: ReactNode;
  maxWidth?: number;
  padding?: string;
}) {
  return (
    <>
      <TopBar viewer={viewer} badges={badges} />
      <div className="sl-wrap" style={{ maxWidth, margin: '0 auto', padding }}>
        {children}
      </div>
    </>
  );
}
