import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { requireViewer } from '@/lib/session';
import { redirect } from 'next/navigation';
import { getShellBadges } from '@/lib/shell-data';
import { TopBar } from '@/components/layout/top-bar';
import { compactCount } from '@/lib/types';
import { relativeTime } from '@/lib/feed';
import { AdminUsers } from './admin-users';
import { AdminCampaigns } from './admin-campaigns';

export const metadata: Metadata = { title: 'Control room' };

const TABS = ['overview', 'users', 'ads', 'mod', 'audit'] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  overview: 'Overview',
  users: 'Users',
  ads: 'Ads',
  mod: 'Moderation',
  audit: 'Audit log',
};

/**
 * Admin control room — port of the prototype's bento dashboard.
 *
 * Every number here is a live query. The prototype's placeholder stats are gone.
 * Middleware guards /admin, and each action re-checks with assertAdmin().
 */
export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const viewer = await requireViewer();
  // Defence in depth: middleware already blocks non-admins, but a page must
  // never rely on that alone.
  if (viewer.role !== 'ADMIN') redirect('/');

  const { tab: tabParam } = await searchParams;
  const tab: Tab = (TABS as readonly string[]).includes(tabParam ?? '') ? (tabParam as Tab) : 'overview';

  const badges = await getShellBadges(viewer.id);

  const [userCount, postCount, respectCount, serviceCount, campaigns, pendingMod, weekPosts, weekUsers] = await Promise.all([
    db.user.count(),
    db.post.count({ where: { filterVerdict: 'ACCEPTED' } }),
    db.respect.count(),
    db.service.count({ where: { active: true } }),
    db.adCampaign.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: { id: true, brand: true, title: true, body: true, cta: true, impressions: true, clicks: true, spend: true, budget: true, active: true },
    }),
    db.moderationItem.count({ where: { verdict: 'PENDING' } }),
    db.post.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 864e5) } } }),
    db.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 864e5) } } }),
  ]);

  const bounced = await db.moderationItem.count({ where: { verdict: 'BOUNCED' } });
  const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
  const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);

  return (
    <>
      <TopBar viewer={viewer} badges={badges} />
      <div className="sl-admin" style={{ maxWidth: 1216, margin: '0 auto', padding: 24 }}>
        <div className="sl-adminwrap" style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 28, padding: '26px 26px 32px', boxShadow: 'var(--elev)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace',
                  fontSize: 12,
                  letterSpacing: '.16em',
                  textTransform: 'uppercase',
                  color: 'var(--mute)',
                }}
              >
                Treax / Control room
              </div>
              <h1
                style={{
                  fontFamily: 'var(--font-manrope), Manrope',
                  fontWeight: 800,
                  fontSize: 38,
                  letterSpacing: '-.03em',
                  color: 'var(--ink)',
                  margin: '10px 0 0',
                }}
              >
                Everything, in one place.
              </h1>
            </div>
            <Link
              href="/agent"
              style={{
                background: 'var(--ink)',
                color: 'var(--card)',
                borderRadius: 9999,
                padding: '12px 22px',
                font: '600 14px/1 var(--font-inter), Inter, sans-serif',
              }}
            >
              Open the agent
            </Link>
          </div>

          <nav style={{ display: 'flex', gap: 6, marginTop: 24, overflowX: 'auto' }} className="sl-noscroll">
            {TABS.map((key) => {
              const on = key === tab;
              return (
                <Link
                  key={key}
                  href={`/admin?tab=${key}`}
                  aria-current={on ? 'page' : undefined}
                  style={{
                    whiteSpace: 'nowrap',
                    padding: '10px 18px',
                    borderRadius: 9999,
                    font: '600 13.5px/1 var(--font-inter), Inter, sans-serif',
                    background: on ? 'var(--ink)' : 'var(--soft)',
                    color: on ? 'var(--card)' : 'var(--body)',
                  }}
                >
                  {TAB_LABELS[key]}
                  {key === 'mod' && pendingMod > 0 ? ` (${pendingMod})` : ''}
                </Link>
              );
            })}
          </nav>

          <div style={{ marginTop: 24 }}>
            {tab === 'overview' ? (
              <>
                <div className="sl-kpis">
                  <Kpi label="Builders" value={compactCount(userCount)} sub={`+${weekUsers} this week`} />
                  <Kpi label="Updates published" value={compactCount(postCount)} sub={`+${weekPosts} this week`} />
                  <Kpi label="Respects given" value={compactCount(respectCount)} sub="all time" />
                  <Kpi label="Filter bounces" value={compactCount(bounced)} sub="posts refused" />
                </div>

                <div className="sl-adgrid" style={{ marginTop: 20 }}>
                  <Panel title="Ad wallet">
                    <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
                      <Figure label="Spend" value={`৳${compactCount(Math.round(totalSpend))}`} />
                      <Figure label="Impressions" value={compactCount(totalImpressions)} />
                      <Figure label="Clicks" value={compactCount(totalClicks)} />
                      <Figure
                        label="CTR"
                        value={totalImpressions === 0 ? '—' : `${((totalClicks / totalImpressions) * 100).toFixed(2)}%`}
                      />
                    </div>
                  </Panel>
                  <Panel title="Live now">
                    <p style={{ margin: 0, fontSize: 15, color: 'var(--body)' }}>
                      {campaigns.filter((c) => c.active).length} of {campaigns.length} campaigns running · {serviceCount} services listed
                    </p>
                  </Panel>
                </div>
              </>
            ) : null}

            {tab === 'users' ? <AdminUsersTab viewerId={viewer.id} /> : null}
            {tab === 'ads' ? <AdminCampaigns campaigns={campaigns} /> : null}
            {tab === 'mod' ? <ModerationTab /> : null}
            {tab === 'audit' ? <AuditTab /> : null}
          </div>
        </div>
      </div>
    </>
  );
}

async function AdminUsersTab({ viewerId }: { viewerId: string }) {
  const users = await db.user.findMany({
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: 60,
    select: {
      id: true,
      name: true,
      handle: true,
      email: true,
      initials: true,
      avatarColor: true, avatarUrl: true,
      role: true,
      verified: true,
      suspended: true,
      badge: true,
      shipCount: true,
      university: true,
    },
  });
  return <AdminUsers users={users} viewerId={viewerId} />;
}

async function ModerationTab() {
  const items = await db.moderationItem.findMany({
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: 50,
    select: {
      id: true,
      kind: true,
      verdict: true,
      reason: true,
      createdAt: true,
      subjectUser: { select: { name: true, handle: true } },
      post: { select: { id: true, body: true } },
    },
  });

  if (items.length === 0) {
    return <Panel title="Review queue"><p style={{ margin: 0, fontSize: 15, color: 'var(--mute)' }}>Nothing to review. The filter has not bounced anything yet.</p></Panel>;
  }

  return (
    <Panel title="Review queue">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((item) => (
          <div key={item.id} style={{ background: 'var(--soft)', borderRadius: 18, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span
                style={{
                  font: '700 11px/1 var(--font-inter), Inter, sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                  padding: '5px 10px',
                  borderRadius: 9999,
                  background: item.verdict === 'BOUNCED' ? 'rgba(208,50,56,.14)' : 'rgba(46,173,75,.14)',
                  color: item.verdict === 'BOUNCED' ? 'var(--negative)' : 'var(--positive)',
                }}
              >
                {item.verdict}
              </span>
              <span style={{ fontSize: 13, color: 'var(--mute)' }}>
                {item.subjectUser ? `@${item.subjectUser.handle}` : 'unknown'} · {relativeTime(item.createdAt)}
              </span>
            </div>
            {item.reason ? <p style={{ margin: '10px 0 0', fontSize: 14.5, lineHeight: 1.5, color: 'var(--ink)' }}>{item.reason}</p> : null}
          </div>
        ))}
      </div>
    </Panel>
  );
}

async function AuditTab() {
  const logs = await db.auditLog.findMany({
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: 80,
    select: { id: true, action: true, targetType: true, targetId: true, createdAt: true, actor: { select: { name: true, handle: true } } },
  });

  if (logs.length === 0) {
    return <Panel title="Audit log"><p style={{ margin: 0, fontSize: 15, color: 'var(--mute)' }}>No admin actions recorded yet.</p></Panel>;
  }

  return (
    <Panel title="Audit log">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {logs.map((log) => (
          <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--soft)', borderRadius: 14, padding: '12px 16px' }}>
            <code
              style={{
                fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace',
                fontSize: 12,
                color: 'var(--ink)',
                background: 'var(--card)',
                padding: '4px 9px',
                borderRadius: 8,
                flexShrink: 0,
              }}
            >
              {log.action}
            </code>
            <span style={{ fontSize: 13.5, color: 'var(--body)', flex: 1, minWidth: 0 }}>
              by {log.actor.name}
              {log.targetType ? ` · ${log.targetType}` : ''}
            </span>
            <span style={{ fontSize: 12.5, color: 'var(--mute)', flexShrink: 0 }}>{relativeTime(log.createdAt)}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div style={{ background: 'var(--soft)', borderRadius: 20, padding: 20 }}>
      <div style={{ fontSize: 13, color: 'var(--mute)' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-manrope), Manrope', fontWeight: 800, fontSize: 32, letterSpacing: '-.03em', color: 'var(--ink)', margin: '8px 0 4px' }}>
        {value}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--mute)' }}>{sub}</div>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-manrope), Manrope', fontWeight: 800, fontSize: 24, letterSpacing: '-.02em', color: 'var(--ink)' }}>{value}</div>
      <div style={{ fontSize: 12.5, color: 'var(--mute)', marginTop: 3 }}>{label}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 22, padding: 22 }}>
      <h2 style={{ font: '700 16px/1 var(--font-inter), Inter, sans-serif', color: 'var(--ink)', margin: '0 0 14px' }}>{title}</h2>
      {children}
    </div>
  );
}
