import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { requireViewer } from '@/lib/session';
import { getRailData, getShellBadges } from '@/lib/shell-data';
import { AppShell } from '@/components/layout/app-shell';
import { EmptyState, PageHeader } from '@/components/ui/page-header';
import { relativeTime } from '@/lib/feed';
import { TAG_META, type PostTag } from '@/lib/types';

export const metadata: Metadata = { title: 'Search' };

/** Search across builders, updates and services — the top bar's search target. */
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const viewer = await requireViewer();
  const { q } = await searchParams;
  const query = (q ?? '').trim();

  const [badges, rails] = await Promise.all([getShellBadges(viewer.id), getRailData(viewer)]);

  if (!query) {
    return (
      <AppShell viewer={viewer} badges={badges} rails={rails}>
        <PageHeader title="Search" subtitle="Find builders, updates and services across Treax." />
        <EmptyState title="Type something to search." body="Try a name, a skill, a university, or an idea." />
      </AppShell>
    );
  }

  const contains = { contains: query, mode: 'insensitive' as const };

  const [builders, posts, services] = await Promise.all([
    db.user.findMany({
      where: {
        suspended: false,
        OR: [{ name: contains }, { handle: contains }, { building: contains }, { focus: contains }, { university: contains }, { bio: contains }],
      },
      take: 8,
      select: { id: true, name: true, handle: true, initials: true, avatarColor: true, focus: true, university: true, building: true },
    }),
    db.post.findMany({
      where: { filterVerdict: 'ACCEPTED', author: { suspended: false }, body: contains },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        body: true,
        tag: true,
        createdAt: true,
        author: { select: { name: true, handle: true, initials: true, avatarColor: true } },
      },
    }),
    db.service.findMany({
      where: { active: true, owner: { suspended: false }, OR: [{ title: contains }, { description: contains }, { category: contains }] },
      take: 8,
      select: { id: true, title: true, price: true, owner: { select: { name: true, handle: true } } },
    }),
  ]);

  const total = builders.length + posts.length + services.length;

  return (
    <AppShell viewer={viewer} badges={badges} rails={rails}>
      <PageHeader
        title={`Results for “${query}”`}
        subtitle={total === 0 ? 'Nothing matched. Try a different word.' : `${total} match${total === 1 ? '' : 'es'} across builders, updates and services.`}
      />

      {builders.length > 0 ? (
        <Section title="Builders">
          {builders.map((b) => (
            <Link key={b.id} href={`/u/${b.handle}`} style={rowStyle}>
              <span
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 9999,
                  background: b.avatarColor,
                  color: '#fff',
                  font: '800 15px/1 var(--font-manrope), Manrope',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                {b.initials}
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', font: '700 15px/1.2 var(--font-inter), Inter, sans-serif', color: 'var(--ink)' }}>{b.name}</span>
                <span style={{ display: 'block', fontSize: 13, color: 'var(--mute)', marginTop: 3 }}>
                  @{b.handle}
                  {b.building ? ` · Building ${b.building}` : b.focus ? ` · ${b.focus}` : ''}
                </span>
              </span>
            </Link>
          ))}
        </Section>
      ) : null}

      {posts.length > 0 ? (
        <Section title="Updates">
          {posts.map((p) => {
            const meta = TAG_META[p.tag as PostTag];
            return (
              <Link key={p.id} href={`/p/${p.id}`} style={{ ...rowStyle, alignItems: 'flex-start' }}>
                <span
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 9999,
                    background: p.author.avatarColor,
                    color: '#fff',
                    font: '800 15px/1 var(--font-manrope), Manrope',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  {p.author.initials}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ font: '700 14px/1.2 var(--font-inter), Inter, sans-serif', color: 'var(--ink)' }}>{p.author.name}</span>
                    <span
                      style={{
                        font: '700 11px/1 var(--font-inter), Inter, sans-serif',
                        color: 'var(--ink)',
                        background: meta.bg,
                        borderRadius: 9999,
                        padding: '4px 9px',
                      }}
                    >
                      {meta.label}
                    </span>
                    <span style={{ fontSize: 12.5, color: 'var(--mute)' }}>{relativeTime(p.createdAt)}</span>
                  </span>
                  <span style={{ display: 'block', marginTop: 6, fontSize: 14.5, lineHeight: 1.5, color: 'var(--body)' }}>
                    {p.body.split('\n')[0].slice(0, 160)}
                    {p.body.length > 160 ? '…' : ''}
                  </span>
                </span>
              </Link>
            );
          })}
        </Section>
      ) : null}

      {services.length > 0 ? (
        <Section title="Services">
          {services.map((s) => (
            <Link key={s.id} href="/market" style={rowStyle}>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: 'block', font: '700 15px/1.3 var(--font-inter), Inter, sans-serif', color: 'var(--ink)' }}>{s.title}</span>
                <span style={{ display: 'block', fontSize: 13, color: 'var(--mute)', marginTop: 3 }}>by {s.owner.name}</span>
              </span>
              <span style={{ font: '800 15px/1 var(--font-manrope), Manrope', color: 'var(--ink)', flexShrink: 0 }}>{s.price}</span>
            </Link>
          ))}
        </Section>
      ) : null}

      {total === 0 ? <EmptyState title="No matches." body="Try a builder's name, a skill, or a university." /> : null}
    </AppShell>
  );
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '14px 16px',
  borderRadius: 18,
  background: 'var(--soft)',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 24, padding: 22, boxShadow: 'var(--elev)' }}>
      <h2 style={{ font: '700 16px/1 var(--font-inter), Inter, sans-serif', color: 'var(--ink)', margin: '0 0 14px' }}>{title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  );
}
