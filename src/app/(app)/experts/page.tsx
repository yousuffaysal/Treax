import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { requireViewer } from '@/lib/session';
import { getRailData, getShellBadges } from '@/lib/shell-data';
import { AppShell } from '@/components/layout/app-shell';
import { ChipRow, EmptyState, PageHeader } from '@/components/ui/page-header';
import { BookButton } from './book-button';

export const metadata: Metadata = { title: 'Experts' };

const CATEGORIES = ['All', 'Product', 'Growth', 'Fundraising', 'Engineering', 'Design', 'Ops'];

/** Expert Network — port of Treax.dc.html:704-757. */
export default async function ExpertsPage() {
  const viewer = await requireViewer();
  const [badges, rails, experts] = await Promise.all([
    getShellBadges(viewer.id),
    getRailData(viewer),
    db.expert.findMany({
      where: { active: true, user: { suspended: false } },
      orderBy: [{ rating: 'desc' }, { sessionCount: 'desc' }],
      select: {
        id: true,
        title: true,
        company: true,
        skills: true,
        rate: true,
        free: true,
        availability: true,
        rating: true,
        sessionCount: true,
        user: { select: { id: true, name: true, handle: true, initials: true, avatarColor: true, avatarUrl: true, verified: true } },
      },
    }),
  ]);

  return (
    <AppShell viewer={viewer} badges={badges} rails={rails}>
      <PageHeader
        dark
        title="Expert Network"
        subtitle="Alumni, founders, and professionals who've been where you're going. Book a focused 30-minute session and skip a month of guessing."
      >
        <ChipRow items={CATEGORIES} dark />
      </PageHeader>

      {experts.length === 0 ? (
        <EmptyState title="No experts yet." body="Experts are invited by admins from the control room." />
      ) : (
        <div className="sl-grid2">
          {experts.map((x) => (
            <div
              key={x.id}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--card-border)',
                borderRadius: 24,
                padding: 22,
                boxShadow: 'var(--elev)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Link href={`/u/${x.user.handle}`} style={{ display: 'flex', gap: 13, alignItems: 'center' }}>
                <span
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 9999,
                    background: x.user.avatarColor,
                    color: '#fff',
                    font: '800 19px/1 var(--font-manrope), Manrope',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  {x.user.initials}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        font: '700 16px/1.2 var(--font-inter), Inter, sans-serif',
                        color: 'var(--ink)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        minWidth: 0,
                      }}
                    >
                      {x.user.name}
                    </span>
                    {x.user.verified ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="var(--primary)" style={{ flexShrink: 0 }} aria-label="Verified">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M17 9l-5.5 5.5L8 11" stroke="#163300" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : null}
                  </span>
                  <span style={{ display: 'block', fontSize: 13, color: 'var(--mute)', marginTop: 3 }}>
                    {x.title} · {x.company}
                  </span>
                </span>
              </Link>

              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', margin: '16px 0' }}>
                {x.skills.map((skill) => (
                  <span
                    key={skill}
                    style={{
                      padding: '6px 11px',
                      borderRadius: 9999,
                      background: 'var(--soft)',
                      color: 'var(--body)',
                      font: '600 12px/1 var(--font-inter), Inter, sans-serif',
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 13, color: 'var(--mute)', marginBottom: 16 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--ink)', fontWeight: 700 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--warning)" aria-hidden="true">
                    <path d="M12 3l1.9 4.9L19 9.8l-4.2 3.1L16 18l-4-2.7L8 18l1.2-5.1L5 9.8l5.1-1.9z" />
                  </svg>
                  {x.rating.toFixed(1)}
                </span>
                <span>{x.sessionCount} sessions</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'var(--soft)', borderRadius: 14, padding: '10px 13px', marginBottom: 16 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--mute)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                <span style={{ fontSize: 13, color: 'var(--body)' }}>Next: {x.availability}</span>
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span
                  style={{
                    font: '700 14px/1 var(--font-inter), Inter, sans-serif',
                    color: x.free ? 'var(--positive)' : 'var(--ink)',
                  }}
                >
                  {x.rate}
                </span>
                {x.user.id === viewer.id ? (
                  <span style={{ fontSize: 13, color: 'var(--mute)' }}>This is you</span>
                ) : (
                  <BookButton expertId={x.id} expertName={x.user.name} slot={x.availability} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
