import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { requireViewer } from '@/lib/session';
import { getRailData, getShellBadges } from '@/lib/shell-data';
import { AppShell } from '@/components/layout/app-shell';
import { EmptyState, PageHeader } from '@/components/ui/page-header';

export const metadata: Metadata = { title: 'Learn' };

/** Learn Together — admin-managed resources, real records. */
export default async function LearnPage() {
  const viewer = await requireViewer();
  const [badges, rails, resources] = await Promise.all([
    getShellBadges(viewer.id),
    getRailData(viewer),
    db.learnResource.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 40,
      select: { id: true, type: true, title: true, excerpt: true, worked: true, failed: true, readTime: true, authorName: true },
    }),
  ]);

  return (
    <AppShell viewer={viewer} badges={badges} rails={rails}>
      <PageHeader
        title="Learn Together"
        subtitle="What actually worked and what did not — written by builders who tried it here, not by people writing about startups."
      />

      {resources.length === 0 ? (
        <EmptyState title="No resources yet." body="An admin can publish the first playbook from the control room." />
      ) : (
        resources.map((r) => (
          <Link
            key={r.id}
            href={`/learn/${r.id}`}
            style={{
              background: 'var(--card)',
              border: '1px solid var(--card-border)',
              borderRadius: 24,
              padding: 24,
              boxShadow: 'var(--elev)',
              display: 'block',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span
                style={{
                  padding: '6px 12px',
                  borderRadius: 9999,
                  background: 'var(--primary-pale)',
                  color: 'var(--ink)',
                  font: '700 12px/1 var(--font-inter), Inter, sans-serif',
                }}
              >
                {r.type}
              </span>
              <span style={{ fontSize: 13, color: 'var(--mute)' }}>
                {r.authorName} · {r.readTime}
              </span>
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-manrope), Manrope',
                fontWeight: 800,
                fontSize: 22,
                letterSpacing: '-.02em',
                color: 'var(--ink)',
                margin: '14px 0 8px',
                textWrap: 'pretty',
              }}
            >
              {r.title}
            </h2>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: 'var(--body)' }}>{r.excerpt}</p>

            <div className="sl-grid2" style={{ marginTop: 18 }}>
              <div style={{ background: 'rgba(46,173,75,.08)', border: '1px solid rgba(46,173,75,.24)', borderRadius: 16, padding: '14px 16px' }}>
                <div style={{ font: '700 12px/1 var(--font-inter), Inter, sans-serif', color: 'var(--positive)', marginBottom: 7 }}>What worked</div>
                <div style={{ fontSize: 14, lineHeight: 1.45, color: 'var(--ink)' }}>{r.worked}</div>
              </div>
              <div style={{ background: 'rgba(208,50,56,.07)', border: '1px solid rgba(208,50,56,.24)', borderRadius: 16, padding: '14px 16px' }}>
                <div style={{ font: '700 12px/1 var(--font-inter), Inter, sans-serif', color: 'var(--negative)', marginBottom: 7 }}>What did not</div>
                <div style={{ fontSize: 14, lineHeight: 1.45, color: 'var(--ink)' }}>{r.failed}</div>
              </div>
            </div>
          </Link>
        ))
      )}
    </AppShell>
  );
}
