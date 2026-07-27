import { requireViewer } from '@/lib/session';
import { getRailData, getShellBadges } from '@/lib/shell-data';
import { AppShell } from '@/components/layout/app-shell';
import { MobileTools } from '@/components/layout/mobile-tools';

/**
 * Feed. The post list, composer and ad injection land in milestone 3 — this
 * renders the shell so the layout can be checked against the prototype first.
 */
export default async function FeedPage() {
  const viewer = await requireViewer();
  const [badges, rails] = await Promise.all([getShellBadges(viewer.id), getRailData(viewer)]);

  return (
    <AppShell viewer={viewer} badges={badges} rails={rails}>
      <MobileTools />
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--card-border)',
          borderRadius: 24,
          padding: 18,
          boxShadow: 'var(--elev)',
        }}
      >
        <p style={{ margin: 0, fontSize: 15, color: 'var(--body)' }}>
          The feed lands in the next milestone.
        </p>
      </div>
    </AppShell>
  );
}
